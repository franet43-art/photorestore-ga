import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function SuccessPage(
  { searchParams }: { searchParams: Promise<{ order?: string; result?: string }> }
) {
  const { order: orderId, result } = await searchParams;
  
  if (!orderId) redirect("/dashboard");

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

  if (order.status === "paid" || order.status === "delivered") {
    const path = order.chosen_result === 1 ? order.output_a_path : order.output_b_path;
    
    if (!path) {
      return (
        <div className="container mx-auto py-24 px-4 text-center">
          <h1 className="text-2xl font-bold text-red-600">Erreur de fichier</h1>
          <p className="mt-4">Le fichier restauré est introuvable. Veuillez contacter le support.</p>
        </div>
      );
    }

    // Générer un lien signé Supabase (15 min)
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from("outputs")
      .createSignedUrl(path, 900);

    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-12 max-w-2xl w-full text-center shadow-xl">
          <div className="rounded-full bg-green-100 p-4 w-fit mx-auto mb-6">
            <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Paiement Confirmé !</h1>
          <p className="text-slate-600 mb-10 text-lg">
            Votre photo restaurée en haute définition est prête. Vous pouvez la télécharger dès maintenant.
          </p>
          
          <div className="flex flex-col gap-4">
            {signedUrlData?.signedUrl ? (
              <a 
                href={signedUrlData.signedUrl} 
                download={`PhotoRestore_${orderId}.png`}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-slate-50 shadow hover:bg-blue-600/90 h-14 px-8 text-xl"
              >
                Télécharger la photo HD
              </a>
            ) : (
              <p className="text-red-500">Erreur lors de la génération du lien de téléchargement.</p>
            )}
            
            <Link href="/dashboard">
              <Button variant="outline" className="h-12 w-full text-slate-600">
                Retourner à mon espace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Si pas encore payé (en attente de vérification manuelle admin dans le MVP)
  return (
    <div className="container mx-auto py-24 px-4 flex flex-col items-center text-center">
      <div className="bg-white border border-slate-200 rounded-2xl p-12 max-w-2xl w-full shadow-lg">
        <div className="rounded-full bg-blue-50 p-4 w-fit mx-auto mb-6">
          <svg className="h-12 w-12 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Vérification de votre paiement</h1>
        <div className="space-y-4 text-slate-600 mb-10">
          <p className="text-lg">Votre paiement est en cours de vérification par notre équipe.</p>
          <p>
            Votre image HD sera disponible dans un délai maximal de **1 heure**. 
            Dès validation, elle apparaîtra dans votre historique.
          </p>
          <p className="text-sm italic">
            Vous pouvez fermer cet onglet et revenir plus tard depuis votre espace personnel.
          </p>
        </div>
        
        <div className="flex flex-col gap-3">
          <a 
            href={`/success?order=${orderId}`} 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90 h-12 px-8"
          >
            Vérifier à nouveau
          </a>
          <Link href="/dashboard" className="w-full">
            <Button variant="outline" className="h-12 w-full">
              Aller à mon espace
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
