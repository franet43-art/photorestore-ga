"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

interface PollingLoaderProps {
  orderId: string;
}

export default function PollingLoader({ orderId }: PollingLoaderProps) {
  const [status, setStatus] = useState<string>("processing");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const startTime = Date.now();
    const timeout = 3 * 60 * 1000;

    const pollStatus = async () => {
      if (Date.now() - startTime > timeout) {
        setError("Le délai d'attente est dépassé. Veuillez rafraîchir la page ou réessayer plus tard.");
        return;
      }
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        const data = await res.json();

        if (data.status === "preview_ready" && data.previewAUrl) {
          setPreviewUrl(data.previewAUrl);
          setStatus("preview_ready");
          return;
        }
        if (data.status === "failed") {
          setError("Désolé, la restauration a échoué. Veuillez réessayer.");
          setStatus("failed");
          return;
        }
        setTimeout(pollStatus, 3000);
      } catch (err) {
        console.error("Polling error:", err);
        setTimeout(pollStatus, 3000);
      }
    };

    pollStatus();
  }, [orderId]);

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center gap-4 p-8">
          <div className="rounded-full bg-red-100 p-4">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-red-600 text-center">{error}</p>
          <a href="/upload" className="text-sm text-blue-600 underline">Réessayer</a>
        </CardContent>
      </Card>
    );
  }

  if (status === "preview_ready" && previewUrl) {
    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <p className="text-lg font-semibold text-slate-700">Votre photo restaurée est prête !</p>
        <div className="relative w-full max-w-md aspect-square rounded-xl overflow-hidden shadow-lg">
          <Image
            src={previewUrl}
            alt="Photo restaurée avec filigrane"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <p className="text-sm text-slate-500 text-center">
          Achetez la version HD sans filigrane pour télécharger votre photo restaurée.
        </p>
        
        <a
          href={`/payment/${orderId}`}
          className="bg-black text-white px-8 py-3 rounded-full font-semibold text-base hover:bg-slate-800 transition"
        >
          Obtenir la version HD
        </a>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="flex flex-col items-center gap-4 p-8">
        <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
        <p className="text-lg font-medium text-slate-700">Restauration en cours...</p>
        <p className="text-sm text-slate-500 text-center">
          Nos modèles d'IA travaillent sur vos photos. Cela prend généralement moins d'une minute.
        </p>
        <div className="w-full max-w-xs bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}
