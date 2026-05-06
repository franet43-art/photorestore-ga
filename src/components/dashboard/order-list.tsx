"use client";

import OrderCard from "./order-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface OrderListProps {
  orders: any[];
}

export default function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-3xl text-center px-4">
        <div className="bg-slate-50 rounded-full p-6 mb-6">
          <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Aucune photo pour le moment</h2>
        <p className="text-slate-500 max-w-sm mb-8">
          Commencez par envoyer une ancienne photo. Nos experts IA s'occuperont du reste.
        </p>
        <Link href="/upload">
          <Button className="h-12 bg-slate-900 hover:bg-slate-800 text-white">
            Restaurer ma première photo
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
