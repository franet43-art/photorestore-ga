"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import StatusBadge from "./status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface OrderCardProps {
  order: any;
}

export default function OrderCard({ order }: OrderCardProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchThumb = async () => {
      if (order.upload_path) {
        const { data, error } = await supabase.storage
          .from("uploads")
          .createSignedUrl(order.upload_path, 60);
        
        if (data) setThumbUrl(data.signedUrl);
      }
    };
    fetchThumb();
  }, [order.upload_path, supabase]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/download`);
      const data = await res.json();
      if (data.signedUrl) {
        // Déclenchement du téléchargement
        const link = document.createElement("a");
        link.href = data.signedUrl;
        link.download = `PhotoRestore_HD_${order.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const dateLabel = format(new Date(order.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr });

  return (
    <Card className="overflow-hidden border-slate-200 hover:shadow-md transition-all">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          {/* Miniature */}
          <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
            {thumbUrl ? (
              <Image src={thumbUrl} alt={order.original_filename} fill className="object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h3 className="font-semibold text-slate-900 truncate max-w-[200px]" title={order.original_filename}>
                {order.original_filename}
              </h3>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-slate-500 mb-4">{dateLabel}</p>
            
            {/* Boutons d'action */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
              {(order.status === "uploaded" || order.status === "processing") && (
                <Link href={`/preview/${order.id}`}>
                  <Button variant="outline" size="sm" className="h-9">
                    Voir l'avancement
                  </Button>
                </Link>
              )}
              
              {(order.status === "preview_ready" || order.status === "pending_payment") && (
                <Link href={`/preview/${order.id}`}>
                  <Button size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-700">
                    Voir mes résultats
                  </Button>
                </Link>
              )}
              
              {(order.status === "paid" || order.status === "delivered") && (
                <Button 
                  size="sm" 
                  className="h-9 bg-green-600 hover:bg-green-700" 
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? "Génération..." : "Retélécharger HD"}
                </Button>
              )}
              
              {order.status === "failed" && (
                <Link href="/upload">
                  <Button size="sm" variant="destructive" className="h-9">
                    Réessayer
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
