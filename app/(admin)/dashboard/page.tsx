import Link from "next/link";
import { getDashboardStats } from "@/lib/data";
import { 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle, 
  PackagePlus, 
  ArrowRight, 
  Clock, 
  Boxes, 
  Package
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    processing: "bg-blue-100 text-blue-800 border-blue-200",
    shipped: "bg-purple-100 text-purple-800 border-purple-200",
    delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time catalog metrics, inventory thresholds, and order activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Boxes className="w-4 h-4 text-slate-500" />
            <span>Manage Stock</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today&apos;s Orders</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stats.todayOrders}</p>
            <p className="text-xs text-slate-400 mt-1">{stats.totalOrders} all-time processed</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today&apos;s Revenue</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ${stats.todayRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              ${stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} cumulative
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <Link
          href="/inventory"
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Low Stock SKUs</p>
            <p className={`text-2xl font-bold mt-1 ${stats.lowStockCount > 0 ? "text-amber-600" : "text-slate-900"}`}>
              {stats.lowStockCount}
            </p>
            <p className="text-xs text-amber-600/90 font-medium mt-1 group-hover:underline">Requires reorder attention →</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </Link>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quick Portal Links</p>
            <div className="flex gap-2 mt-2">
              <Link
                href="/products"
                className="text-xs font-medium text-blue-600 hover:text-blue-800 underline decoration-blue-200 underline-offset-2"
              >
                Products
              </Link>
              <span className="text-slate-300">•</span>
              <Link
                href="/orders"
                className="text-xs font-medium text-blue-600 hover:text-blue-800 underline decoration-blue-200 underline-offset-2"
              >
                Orders
              </Link>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">InvortechDS Catalog v1.0</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Low Stock Alert Widget + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alert Widget (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-slate-900 text-sm">Low Stock Alerts (≤ 10)</h2>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto mt-2 max-h-96">
            {stats.lowStockItems.length === 0 ? (
              <p className="py-6 text-sm text-center text-slate-400">All inventory items are healthy.</p>
            ) : (
              stats.lowStockItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">{item.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.stock === 0
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {item.stock} left
                    </span>
                    <Link
                      href="/inventory"
                      className="block text-[11px] text-blue-600 hover:text-blue-700 font-medium mt-1"
                    >
                      Adjust →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-slate-900 text-sm">Recent Orders</h2>
            </div>
            <Link
              href="/orders"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase text-slate-400">
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-blue-600">
                      <Link href={`/orders/${order.id}`} className="hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 max-w-xs truncate">
                      {order.customer_name}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                          statusColors[order.status] || "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                      >
                        Detail →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
