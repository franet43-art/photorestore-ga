import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import PollingLoader from "@/components/preview/polling-loader";
import ResultCard from "@/components/preview/result-card";

export default async function PreviewPage(
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error || !order) redirect("/dashboard");

  // Redirection si déjà payé
  if (order.status === "paid" || order.status === "delivered") {
    redirect(`/success?order=${orderId}`);
  }

  // Affichage du loader si en cours de traitement
  if (order.status === "uploaded" || order.status === "processing") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
        <PollingLoader orderId={orderId} />
      </div>
    );
  }

  // Affichage des résultats
  const { data: publicUrlA } = order.preview_a_path 
    ? supabase.storage.from("previews").getPublicUrl(order.preview_a_path) 
    : { data: { publicUrl: null } };
    
  const { data: publicUrlB } = order.preview_b_path 
    ? supabase.storage.from("previews").getPublicUrl(order.preview_b_path) 
    : { data: { publicUrl: null } };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900">Vos restaurations sont prêtes !</h1>
        <p className="text-slate-600 mt-2">Choisissez la version qui vous convient le mieux pour la débloquer en haute définition.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {publicUrlA.publicUrl && (
          <ResultCard 
            imageUrl={publicUrlA.publicUrl} 
            resultNumber={1} 
            orderId={orderId} 
            label="Version 1 : Restauration fidèle" 
          />
        )}
        {publicUrlB.publicUrl && (
          <ResultCard 
            imageUrl={publicUrlB.publicUrl} 
            resultNumber={2} 
            orderId={orderId} 
            label="Version 2 : Restauration améliorée" 
          />
        )}
      </div>

      {order.status === "failed" && (
        <div className="mt-12 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-red-700 font-medium">Une erreur est survenue lors de la restauration. Veuillez contacter le support.</p>
        </div>
      )}
    </div>
  );
}
