import { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PollingLoader from "@/components/preview/polling-loader";
import ResultCard from "@/components/preview/result-card";

export const metadata: Metadata = {
  title: "Aperçu de la restauration | PhotoRestore.ga",
};

interface PreviewPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { orderId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    notFound();
  }

  const isReady = order.status === "preview_ready";
  const isFailed = order.status === "failed";

  // Générer les URLs publiques pour les previews
  let previewAUrl = null;
  let previewBUrl = null;

  if (isReady) {
    if (order.preview_a_path) {
      const { data } = supabase.storage.from("previews").getPublicUrl(order.preview_a_path);
      previewAUrl = data.publicUrl;
    }
    if (order.preview_b_path) {
      const { data } = supabase.storage.from("previews").getPublicUrl(order.preview_b_path);
      previewBUrl = data.publicUrl;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full max-w-6xl space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Votre restauration
          </h1>
          {isReady ? (
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Voici les deux versions générées par notre intelligence artificielle. Choisissez celle qui vous convient le mieux pour la télécharger en haute définition sans filigrane.
            </p>
          ) : (
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Nous préparons vos photos restaurées. Veuillez patienter un instant.
            </p>
          )}
        </div>

        {!isReady && !isFailed ? (
          <div className="flex justify-center py-12">
            <PollingLoader orderId={orderId} />
          </div>
        ) : isFailed ? (
          <div className="flex justify-center py-12">
            <PollingLoader orderId={orderId} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {previewAUrl ? (
              <ResultCard 
                imageUrl={previewAUrl} 
                resultNumber={1} 
                orderId={orderId} 
                label="Version A — Restauration Classique" 
              />
            ) : (
              <div className="bg-slate-100 rounded-xl p-8 flex items-center justify-center text-slate-400 italic">
                Aperçu A non disponible
              </div>
            )}
            {previewBUrl ? (
              <ResultCard 
                imageUrl={previewBUrl} 
                resultNumber={2} 
                orderId={orderId} 
                label="Version B — Restauration Profonde" 
              />
            ) : (
               <div className="bg-slate-100 rounded-xl p-8 flex items-center justify-center text-slate-400 italic">
                Aperçu B non disponible
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
