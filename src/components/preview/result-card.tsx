"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ResultCardProps {
  imageUrl: string;
  resultNumber: number;
  orderId: string;
  label: string;
}

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ResultCard({ imageUrl, resultNumber, orderId, label }: ResultCardProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  const handleUnlock = async (formula: "standard" | "color") => {
    setIsLoading(formula);
    
    try {
      // 1. Vérifier si l'utilisateur est connecté
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Rediriger vers login avec retour vers cette page
        window.location.href = `/login?next=${encodeURIComponent(`/preview/${orderId}`)}`;
        return;
      }

      // 2. Procéder au paiement
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, result: resultNumber, formula }),
      });
      
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Une erreur est survenue lors de l'initiation du paiement.");
        setIsLoading(null);
      }
    } catch (err) {
      console.error("Payment initiation error:", err);
      alert("Erreur de connexion au service de paiement.");
      setIsLoading(null);
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-xl transition-all hover:shadow-2xl flex flex-col select-none">
      <CardHeader className="bg-slate-50 border-b border-slate-200">
        <CardTitle className="text-lg font-semibold text-slate-800">{label}</CardTitle>
      </CardHeader>
      <CardContent 
        className="p-0 relative aspect-square bg-slate-100"
        onContextMenu={(e) => e.preventDefault()}
      >
        <Image 
          src={imageUrl} 
          alt={label} 
          fill 
          className="object-contain p-4"
          sizes="(max-width: 768px) 100vw, 50vw"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
        {/* Overlay invisible pour bloquer les interactions directes */}
        <div className="absolute inset-0 z-10 pointer-events-none" />
        
        {/* Overlay texte APERÇU */}
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="bg-black/70 px-4 py-3 text-white font-bold text-sm md:text-base text-center border border-white/30">
            APERÇU — ACHETEZ LA VERSION HD
          </div>
        </div>
        {/* Branding coin haut gauche */}
        <div className="absolute top-3 left-3 z-30 pointer-events-none">
          <span className="bg-black/60 text-white text-xs px-2 py-1 font-bold tracking-wider">
            PHOTORESTORE.GA
          </span>
        </div>
        {/* Bandeau bas */}
        <div className="absolute bottom-3 left-0 right-0 z-30 pointer-events-none flex justify-center">
          <span className="bg-black/60 text-white text-[10px] px-3 py-1 font-bold tracking-widest uppercase">
            Aperçu Watermarqué
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-6 grid grid-cols-1 gap-3 mt-auto">
        <Button 
          onClick={() => handleUnlock("standard")}
          disabled={!!isLoading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12"
        >
          {isLoading === "standard" ? "Chargement..." : "Débloquer — Standard (2 000 FCFA)"}
        </Button>
        <Button 
          onClick={() => handleUnlock("color")}
          disabled={!!isLoading}
          variant="outline"
          className="w-full border-slate-200 hover:bg-slate-50 h-12"
        >
          {isLoading === "color" ? "Chargement..." : "Débloquer — Colorisé (3 500 FCFA)"}
        </Button>
      </CardFooter>
    </Card>
  );
}
