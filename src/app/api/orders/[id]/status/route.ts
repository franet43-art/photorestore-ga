import { NextRequest, NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    // Récupération dynamique des paramètres pour Next.js 16
    const { id: orderId } = await params

    const { data: { user } } = await supabase.auth.getUser()
    const guestId = request.cookies.get('guest_id')?.value

    // Ni user authentifié ni guest cookie → rejet
    if (!user && !guestId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Construire la query selon le type de visiteur
    let query = supabase
      .from('orders')
      .select('status, preview_a_path, preview_b_path')
      .eq('id', orderId)

    if (user) {
      query = query.eq('user_id', user.id)
    } else {
      query = query.eq('guest_id', guestId)
    }

    const { data: order, error } = await query.single()

    if (error || !order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    }

    function buildPreviewUrl(path: string | null): string | null {
      if (!path) return null
      // Si c'est déjà une URL complète
      if (path.startsWith('http')) return path
      
      return supabase.storage.from('previews').getPublicUrl(path).data.publicUrl
    }

    console.log('DEBUG status route:', {
      preview_a_path: order.preview_a_path,
      previewAUrl: buildPreviewUrl(order.preview_a_path),
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'DEFINED' : 'UNDEFINED',
    })

    return NextResponse.json({
      status: order.status,
      previewAUrl: buildPreviewUrl(order.preview_a_path),
      previewBUrl: buildPreviewUrl(order.preview_b_path),
    }, { status: 200 })

  } catch (error: any) {
    console.error("Erreur lors de la récupération du statut:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
