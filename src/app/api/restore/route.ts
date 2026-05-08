export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { restoreImage } from "@/lib/gemini/client"
import { applyWatermark } from "@/lib/watermark"
import { cookies } from "next/headers"
import {
  PROMPT_CONSERVATIVE,
  PROMPT_CREATIVE,
  PROMPT_CONSERVATIVE_COLOR,
  PROMPT_CREATIVE_COLOR,
} from "@/lib/gemini/prompts"

export async function POST(request: NextRequest) {
  let globalOrderId: string | null = null;
  
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()
    const guestId = cookieStore.get("guest_id")?.value

    // TÂCHE 1 — Rate limiting (3 requêtes / 60s)
    const { rateLimit } = await import("@/lib/rate-limit")
    const rl = await rateLimit(user?.id || guestId || "anonymous", 3, 60_000)
    if (!rl.success) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans une minute." },
        { status: 429 }
      )
    }

    // 2. Récupérer orderId depuis le body JSON
    const body = await request.json()
    const { orderId, formula = 'standard' } = body

    if (!orderId) {
      return NextResponse.json({ error: "orderId manquant" }, { status: 400 })
    }
    
    globalOrderId = orderId;

    // 3. Vérifier que l'order appartient à l'user OU au guest et a status 'uploaded'
    let query = supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("status", "uploaded")

    if (user) {
      query = query.eq("user_id", user.id)
    } else if (guestId) {
      query = query.eq("guest_id", guestId)
    } else {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: order, error: orderError } = await query.single()
    if (orderError || !order) {
      console.error("Restore Error: Order not found or ownership mismatch", { orderId, error: orderError })
      return NextResponse.json({ error: "Commande introuvable ou accès refusé" }, { status: 403 })
    }

    console.log("Restore: Processing order", orderId)

    // 4. Mettre à jour status → 'processing'
    await supabase.from("orders").update({ status: 'processing' }).eq("id", orderId)

    // 5. Récupérer le fichier depuis Supabase Storage
    console.log("Restore: Downloading source file", order.upload_path)
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("uploads")
      .download(order.upload_path)

    if (downloadError || !fileData) {
      console.error("Restore Error: Download failed", downloadError)
      throw new Error("Impossible de télécharger l'image source.")
    }

    const imageBuffer = Buffer.from(await fileData.arrayBuffer())

    // 6. Lancer Promise.allSettled
    const promptConservative = formula === 'color' ? PROMPT_CONSERVATIVE_COLOR : PROMPT_CONSERVATIVE

    // UN SEUL appel au lieu de deux — économie de 50% des crédits
    console.log("Restore: Calling OpenAI with prompt QUALITY")
    const results = await Promise.allSettled([
      restoreImage(imageBuffer, PROMPT_CONSERVATIVE),
    ])

    const resultA = results[0]
    const resultB = { status: 'rejected' as const, reason: 'single mode' }

    console.log("Restore: OpenAI result", { 
      A: resultA.status,
      errorA: resultA.status === 'rejected' ? resultA.reason : null,
    })

    // 7. Vérifier les résultats
    if (resultA.status === 'rejected' && resultB.status === 'rejected') {
      await supabase.from("orders").update({ status: 'failed' }).eq("id", orderId)
      return NextResponse.json({ 
        error: "La restauration a échoué.",
        debug: {
          errorA: resultA.status === 'rejected' ? String(resultA.reason) : null,
          errorB: resultB.status === 'rejected' ? String(resultB.reason) : null,
        }
      }, { status: 500 })
    }

    const updates: any = { status: 'preview_ready' }
    const ownerId = user?.id || `guest_${guestId}`
    let previewAUrl = null
    let previewBUrl = null

    // 8. Pour chaque résultat réussi
    if (resultA.status === 'fulfilled') {
      const bufferA = resultA.value
      const hdPathA = `${ownerId}/${orderId}/result_a.png`
      const previewPathA = `${ownerId}/${orderId}/preview_a.png`

      await supabase.storage.from('outputs').upload(hdPathA, bufferA, { contentType: 'image/png' })
      updates.output_a_path = hdPathA

      const watermarkedA = await applyWatermark(bufferA)
      await supabase.storage.from('previews').upload(previewPathA, watermarkedA, { contentType: 'image/jpeg' })
      updates.preview_a_path = previewPathA

      previewAUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/previews/${previewPathA}`
    }

    // 9. Mettre à jour l'order dans Supabase
    await supabase.from("orders").update(updates).eq("id", orderId)

    return NextResponse.json({ orderId, previewAUrl, previewBUrl }, { status: 200 })

  } catch (error: any) {
    console.error("Restore handler CRITICAL error:", {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      code: error.code,
      globalOrderId
    })
    if (globalOrderId) {
      try {
        const supabase = await createSupabaseServerClient()
        await supabase.from("orders").update({ status: 'failed' }).eq("id", globalOrderId)
      } catch (e) {}
    }

    if (error.message === "QUOTA_EXCEEDED") {
      return NextResponse.json(
        { error: "Le service est temporairement indisponible. Réessayez dans une minute." },
        { status: 503 }
      )
    }

    return NextResponse.json({ 
      error: "Une erreur inattendue est survenue.",
      debug: {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5),
        code: error.code,
        cause: error.cause?.message || String(error.cause)
      }
    }, { status: 500 })
  }
}
