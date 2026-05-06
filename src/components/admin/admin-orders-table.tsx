"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import StatusBadge from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface AdminOrdersTableProps {
  orders: any[];
}

export default function AdminOrdersTable({ orders }: AdminOrdersTableProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const markAsPaid = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Erreur lors de la mise à jour du statut.");
      }
    } catch (err) {
      console.error("Admin update error:", err);
      alert("Erreur de connexion.");
    } finally {
      setLoadingId(null);
    }
  };

  if (orders.length === 0) {
    return <div className="p-12 text-center text-slate-500">Aucune commande trouvée.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
            <th className="px-6 py-4 border-b border-slate-200">ID court</th>
            <th className="px-6 py-4 border-b border-slate-200">Email Utilisateur</th>
            <th className="px-6 py-4 border-b border-slate-200">Statut</th>
            <th className="px-6 py-4 border-b border-slate-200">Formule</th>
            <th className="px-6 py-4 border-b border-slate-200">Prix</th>
            <th className="px-6 py-4 border-b border-slate-200">Date</th>
            <th className="px-6 py-4 border-b border-slate-200 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-mono text-xs text-slate-500">
                {order.id.substring(0, 8)}...
              </td>
              <td className="px-6 py-4 text-slate-700">
                {order.profiles?.email || "N/A"}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-6 py-4 capitalize text-slate-600">
                {order.formula || "-"}
              </td>
              <td className="px-6 py-4 font-medium text-slate-900">
                {order.price_fcfa ? `${order.price_fcfa.toLocaleString()} FCFA` : "-"}
              </td>
              <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
              </td>
              <td className="px-6 py-4 text-right">
                {order.status === "pending_payment" && (
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                    onClick={() => markAsPaid(order.id)}
                    disabled={loadingId === order.id}
                  >
                    {loadingId === order.id ? "..." : "Marquer Payée"}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
