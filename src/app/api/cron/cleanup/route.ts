import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * TÂCHE 3 — Cron de nettoyage storage
 * Supprime les fichiers et marque les commandes comme expirées après 30 jours.
 */

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  // 1. Vérification de sécurité
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    // Client admin pour contourner les RLS et gérer le storage
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 2. Récupérer les commandes à nettoyer
    const { data: orders, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .lt("created_at", thirtyDaysAgo.toISOString())
      .in("status", ["paid", "delivered", "failed", "expired"]);

    if (fetchError) {
      throw fetchError;
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ cleaned: 0, message: "Rien à nettoyer" });
    }

    let cleanedCount = 0;

    // 3. Traiter chaque commande
    for (const order of orders) {
      const filesToDelete: { bucket: string; path: string }[] = [];

      if (order.upload_path) filesToDelete.push({ bucket: "uploads", path: order.upload_path });
      if (order.preview_a_path) filesToDelete.push({ bucket: "previews", path: order.preview_a_path });
      if (order.preview_b_path) filesToDelete.push({ bucket: "previews", path: order.preview_b_path });
      if (order.output_a_path) filesToDelete.push({ bucket: "outputs", path: order.output_a_path });
      if (order.output_b_path) filesToDelete.push({ bucket: "outputs", path: order.output_b_path });

      // Suppression physique des fichiers
      for (const file of filesToDelete) {
        try {
          const { error: deleteError } = await supabaseAdmin.storage
            .from(file.bucket)
            .remove([file.path]);
          
          if (deleteError) {
            console.error(`[CRON] Erreur suppression ${file.bucket}/${file.path}:`, deleteError);
          } else {
            console.log(`[CRON] Supprimé: ${file.bucket}/${file.path}`);
          }
        } catch (e) {
          console.error(`[CRON] Erreur inattendue suppression ${file.bucket}/${file.path}`, e);
        }
      }

      // 4. Mettre à jour le statut
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({ status: "expired" })
        .eq("id", order.id);

      if (updateError) {
        console.error(`[CRON] Erreur mise à jour statut order ${order.id}:`, updateError);
      } else {
        cleanedCount++;
      }
    }

    return NextResponse.json({ cleaned: cleanedCount });

  } catch (error: any) {
    console.error("[CRON] Erreur globale:", error);
    return NextResponse.json({ error: "Erreur lors du nettoyage" }, { status: 500 });
  }
}
