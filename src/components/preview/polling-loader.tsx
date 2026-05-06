"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

interface PollingLoaderProps {
  orderId: string;
}

export default function PollingLoader({ orderId }: PollingLoaderProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>("processing");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    const timeout = 3 * 60 * 1000; // 3 minutes

    const pollStatus = async () => {
      if (Date.now() - startTime > timeout) {
        setError("Le délai d'attente est dépassé. Veuillez rafraîchir la page ou réessayer plus tard.");
        return;
      }

      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        const data = await res.json();

        if (data.status === "preview_ready") {
          router.refresh();
          return;
        }

        if (data.status === "failed") {
          setError("Désolé, la restauration a échoué. Veuillez réessayer avec une autre photo.");
          setStatus("failed");
          return;
        }

        // Continuer le polling
        setTimeout(pollStatus, 3000);
      } catch (err) {
        console.error("Polling error:", err);
        setTimeout(pollStatus, 3000);
      }
    };

    pollStatus();
  }, [orderId, router]);

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-lg">
      <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-6">
        {error ? (
          <div className="space-y-4">
            <div className="rounded-full bg-red-100 p-3 w-fit mx-auto">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-700 font-medium">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-sm text-slate-500 underline hover:text-slate-800"
            >
              Réessayer
            </button>
          </div>
        ) : (
          <>
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-slate-900">Restauration en cours...</h2>
              <p className="text-slate-500">
                Nos modèles d'IA travaillent sur vos photos. Cela prend généralement moins d'une minute.
              </p>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-full w-2/3 animate-[shimmer_2s_infinite] origin-left"></div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
