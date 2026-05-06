import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminOrdersTable from "@/components/admin/admin-orders-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Vérification du rôle admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Récupérer toutes les commandes avec l'email de l'utilisateur
  // Note: On suppose que la table profiles contient l'email
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      profiles:user_id (email)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin fetch error:", error);
  }

  const allOrders = orders || [];
  const paidOrders = allOrders.filter(o => o.status === "paid" || o.status === "delivered");
  const totalRevenue = paidOrders.reduce((acc, curr) => acc + (curr.price_fcfa || 0), 0);

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-slate-900 mb-10">Console Administrateur</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Commandes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{allOrders.length}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Commandes Payées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{paidOrders.length}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Revenus Estimés (FCFA)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalRevenue.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Toutes les commandes</h2>
        </div>
        <AdminOrdersTable orders={allOrders} />
      </div>
    </div>
  );
}
