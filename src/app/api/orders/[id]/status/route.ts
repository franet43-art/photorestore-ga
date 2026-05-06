import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupération dynamique des paramètres pour Next.js 16
    const { id } = await params

    const { data: order, error } = await supabase
      .from("orders")
      .select("status, preview_a_path, preview_b_path")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    }

    let previewAUrl = null
    let previewBUrl = null

    // Générer les URLs publiques pour les previews existantes
    if (order.preview_a_path) {
      const { data } = supabase.storage.from('previews').getPublicUrl(order.preview_a_path)
      previewAUrl = data.publicUrl
    }

    if (order.preview_b_path) {
      const { data } = supabase.storage.from('previews').getPublicUrl(order.preview_b_path)
      previewBUrl = data.publicUrl
    }

    return NextResponse.json({
      status: order.status,
      previewAUrl,
      previewBUrl
    }, { status: 200 })

  } catch (error: any) {
    console.error("Erreur lors de la récupération du statut:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
