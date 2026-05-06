import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

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
