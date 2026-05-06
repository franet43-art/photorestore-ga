import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérification du rôle admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Interdit" }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: "Statut manquant" }, { status: 400 });
    }

    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };

    if (status === "paid") {
      updateData.paid_at = new Date().toISOString();
      // On peut aussi fixer le prix ici selon la formule si ce n'est pas déjà fait
      // formula 'standard' -> 2000, 'color' -> 3500
    }

    const { data: order, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Erreur de mise à jour" }, { status: 500 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
