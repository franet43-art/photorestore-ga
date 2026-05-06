import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusMap: Record<string, { label: string; classes: string }> = {
  uploaded: {
    label: "Reçue",
    classes: "bg-slate-100 text-slate-700 border-slate-200",
  },
  processing: {
    label: "En cours...",
    classes: "bg-blue-50 text-blue-700 border-blue-200 animate-pulse",
  },
  preview_ready: {
    label: "Aperçu prêt",
    classes: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  pending_payment: {
    label: "Paiement en attente",
    classes: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  paid: {
    label: "Payée ✓",
    classes: "bg-green-50 text-green-700 border-green-200",
  },
  delivered: {
    label: "Livrée ✓",
    classes: "bg-green-50 text-green-700 border-green-200",
  },
  failed: {
    label: "Échec",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  expired: {
    label: "Expirée",
    classes: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, classes: "bg-slate-100 text-slate-600" };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
