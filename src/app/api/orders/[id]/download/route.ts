import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { id: orderId } = await params;
    const { data: { user } } = await supabase.auth.getUser();
    const guestId = request.cookies.get('guest_id')?.value;

    // Ni user authentifié ni guest cookie → rejet
    if (!user && !guestId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Construire la query selon le type de visiteur
    let query = supabase
      .from("orders")
      .select("*")
      .eq("id", orderId);

    if (user) {
      query = query.eq("user_id", user.id);
    } else {
      query = query.eq("guest_id", guestId);
    }

    const { data: order, error } = await query.single();

    if (error || !order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    if (order.status !== "paid" && order.status !== "delivered") {
      return NextResponse.json({ error: "La commande n'est pas payée" }, { status: 403 });
    }

    const path = order.chosen_result === 1 ? order.output_a_path : order.output_b_path;
    
    if (!path) {
      return NextResponse.json({ error: "Fichier source introuvable" }, { status: 404 });
    }

    // Générer un lien signé (15 min)
    const { data, error: signedError } = await supabase.storage
      .from("outputs")
      .createSignedUrl(path, 900);

    if (signedError) {
      return NextResponse.json({ error: "Erreur de génération du lien" }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error) {
    console.error("Download route error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
