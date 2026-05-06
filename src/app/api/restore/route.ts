import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { restoreImage } from "@/lib/gemini/client"
import { applyWatermark } from "@/lib/watermark"
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

    // 1. Vérifier session
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // TÂCHE 1 — Rate limiting (3 requêtes / 60s)
    const { rateLimit } = await import("@/lib/rate-limit")
    const rl = rateLimit(user.id, 3, 60_000)
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

    // 3. Vérifier que l'order appartient à l'user et a status 'uploaded'
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Commande introuvable ou accès refusé" }, { status: 403 })
    }

    if (order.status !== 'uploaded') {
      return NextResponse.json({ error: "Statut de commande invalide" }, { status: 400 })
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

    // 6. Lancer Promise.allSettled (OBLIGATOIRE, jamais Promise.all)
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
      console.error("Les deux restaurations ont échoué:", resultA.reason, resultB.reason)
      return NextResponse.json({ error: "La restauration a échoué." }, { status: 500 })
    }

    const updates: any = { status: 'preview_ready' }
    let previewAUrl = null
    let previewBUrl = null

    // 8. Pour chaque résultat réussi
    // Résultat A (Conservative)
    if (resultA.status === 'fulfilled') {
      const bufferA = resultA.value
      const hdPathA = `${user.id}/${orderId}/result_a.png`
      const previewPathA = `${user.id}/${orderId}/preview_a.png`

      // Upload HD dans bucket 'outputs' AVANT watermark
      await supabase.storage.from('outputs').upload(hdPathA, bufferA, { contentType: 'image/png' })
      updates.output_a_path = hdPathA

      // Appliquer watermark APRÈS et upload dans 'previews'
      const watermarkedA = await applyWatermark(bufferA)
      await supabase.storage.from('previews').upload(previewPathA, watermarkedA, { contentType: 'image/jpeg' })
      updates.preview_a_path = previewPathA

      const { data: publicUrlDataA } = supabase.storage.from('previews').getPublicUrl(previewPathA)
      previewAUrl = publicUrlDataA.publicUrl
    }

    // Résultat B (Creative)
    if (resultB.status === 'fulfilled') {
      const bufferB = resultB.value
      const hdPathB = `${user.id}/${orderId}/result_b.png`
      const previewPathB = `${user.id}/${orderId}/preview_b.png`

      // Upload HD dans bucket 'outputs' AVANT watermark
      await supabase.storage.from('outputs').upload(hdPathB, bufferB, { contentType: 'image/png' })
      updates.output_b_path = hdPathB

      // Appliquer watermark APRÈS et upload dans 'previews'
      const watermarkedB = await applyWatermark(bufferB)
      await supabase.storage.from('previews').upload(previewPathB, watermarkedB, { contentType: 'image/jpeg' })
      updates.preview_b_path = previewPathB

      const { data: publicUrlDataB } = supabase.storage.from('previews').getPublicUrl(previewPathB)
      previewBUrl = publicUrlDataB.publicUrl
    }

    // 9. Mettre à jour l'order dans Supabase
    await supabase.from("orders").update(updates).eq("id", orderId)

    // 10. Retourner JSON
    return NextResponse.json({
      orderId,
      previewAUrl,
      previewBUrl
    }, { status: 200 })

  } catch (error: any) {
    console.error("Restore handler unexpected error:", error)
    
    // Si l'erreur est inattendue, on met le statut en failed
    if (globalOrderId) {
        try {
            const supabase = await createSupabaseServerClient()
            await supabase.from("orders").update({ status: 'failed' }).eq("id", globalOrderId)
        } catch (e) {
            console.error("Échec de la mise à jour du statut failed", e)
        }
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
