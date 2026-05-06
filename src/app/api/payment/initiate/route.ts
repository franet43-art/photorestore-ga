import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { orderId, result, formula } = await request.json();

    if (!orderId || !result || !formula) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Vérifier que l'order appartient à l'user et est prêt pour preview
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    if (order.status !== "preview_ready" && order.status !== "pending_payment") {
      return NextResponse.json({ error: "Statut de commande invalide" }, { status: 400 });
    }

    // Mettre à jour la commande
    await supabase.from("orders").update({
      chosen_result: result,
      formula: formula,
      status: "pending_payment"
    }).eq("id", orderId);

    // Sélectionner le bon lien Chariow
    let baseUrl = "";
    if (result === 1 && formula === "standard") baseUrl = process.env.CHARIOW_LINK_RESULT1_STANDARD || "";
    if (result === 2 && formula === "standard") baseUrl = process.env.CHARIOW_LINK_RESULT2_STANDARD || "";
    if (result === 1 && formula === "color") baseUrl = process.env.CHARIOW_LINK_RESULT1_COLOR || "";
    if (result === 2 && formula === "color") baseUrl = process.env.CHARIOW_LINK_RESULT2_COLOR || "";

    if (!baseUrl) {
      return NextResponse.json({ error: "Configuration de paiement manquante" }, { status: 500 });
    }

    // Construire l'URL de redirection finale
    // On ajoute nos paramètres à l'URL Chariow si nécessaire, ou on gère la redirection via Chariow params
    // Ici on suppose que le lien Chariow accepte une redirection de succès
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${appUrl}/success?order=${orderId}&result=${result}`;
    
    // Ajout du paramètre de retour à l'URL Chariow (format dépend de l'API Chariow)
    const checkoutUrl = `${baseUrl}?reference=${orderId}&redirect_url=${encodeURIComponent(successUrl)}`;

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
