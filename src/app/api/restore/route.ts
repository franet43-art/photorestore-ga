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
      return NextResponse.json({ error: "Commande introuvable ou accès refusé" }, { status: 403 })
    }

    // 4. Mettre à jour status → 'processing'
    await supabase.from("orders").update({ status: 'processing' }).eq("id", orderId)

    // 5. Récupérer le fichier depuis Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("uploads")
      .download(order.upload_path)

    if (downloadError || !fileData) {
      throw new Error("Impossible de télécharger l'image source.")
    }

    const imageBuffer = Buffer.from(await fileData.arrayBuffer())

    // 6. Lancer Promise.allSettled
    const promptConservative = formula === 'color' ? PROMPT_CONSERVATIVE_COLOR : PROMPT_CONSERVATIVE
    const promptCreative = formula === 'color' ? PROMPT_CREATIVE_COLOR : PROMPT_CREATIVE

    const results = await Promise.allSettled([
      restoreImage(imageBuffer, promptConservative),
      restoreImage(imageBuffer, promptCreative),
    ])

    const resultA = results[0]
    const resultB = results[1]

    // 7. Vérifier les résultats
    if (resultA.status === 'rejected' && resultB.status === 'rejected') {
      await supabase.from("orders").update({ status: 'failed' }).eq("id", orderId)
      return NextResponse.json({ error: "La restauration a échoué." }, { status: 500 })
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

      const { data: publicUrlDataA } = supabase.storage.from('previews').getPublicUrl(previewPathA)
      previewAUrl = publicUrlDataA.publicUrl
    }

    if (resultB.status === 'fulfilled') {
      const bufferB = resultB.value
      const hdPathB = `${ownerId}/${orderId}/result_b.png`
      const previewPathB = `${ownerId}/${orderId}/preview_b.png`

      await supabase.storage.from('outputs').upload(hdPathB, bufferB, { contentType: 'image/png' })
      updates.output_b_path = hdPathB

      const watermarkedB = await applyWatermark(bufferB)
      await supabase.storage.from('previews').upload(previewPathB, watermarkedB, { contentType: 'image/jpeg' })
      updates.preview_b_path = previewPathB

      const { data: publicUrlDataB } = supabase.storage.from('previews').getPublicUrl(previewPathB)
      previewBUrl = publicUrlDataB.publicUrl
    }

    // 9. Mettre à jour l'order dans Supabase
    await supabase.from("orders").update(updates).eq("id", orderId)

    return NextResponse.json({ orderId, previewAUrl, previewBUrl }, { status: 200 })

  } catch (error: any) {
    console.error("Restore handler unexpected error:", error)
    if (globalOrderId) {
      try {
        const supabase = await createSupabaseServerClient()
        await supabase.from("orders").update({ status: 'failed' }).eq("id", globalOrderId)
      } catch (e) {}
    }

    if (error.message === "QUOTA_EXCEEDED") {
      return NextResponse.json(
        { error: "Le service est temporairement indisponible. Réessayez dans quelques heures." },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: "Une erreur inattendue est survenue." }, { status: 500 })
  }
}
