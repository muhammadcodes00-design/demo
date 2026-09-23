"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShoppingBag, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Truck,
  RotateCw
} from "lucide-react";
import type { Order } from "@/lib/data";

const STATUS_LIST = ["pending", "processing", "shipped", "delivered", "cancelled"];

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();
        setOrder(data);
        setSelectedStatus(data.status);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [id]);

  async function handleStatusChange(newStatus: string) {
    if (!order || newStatus === order.status) return;
    setUpdating(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Failed to update status");

      setOrder(updated);
      setSelectedStatus(updated.status);
      setFeedback("Order status updated successfully.");
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-slate-600 font-medium">Order not found.</p>
        <Link href="/orders" className="text-sm text-blue-600 hover:underline">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const subtotal = order.items?.reduce((acc, it) => acc + it.quantity * it.unit_price, 0) || order.total;
  const tax = Number((subtotal * 0.08).toFixed(2)); // Standard 8% dental supply estimate for display

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back action */}
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders List</span>
        </Link>
        <span className="font-mono text-xs text-slate-400">System ID: {order.id}</span>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.startsWith("Error")
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Order Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                {order.order_number}
              </h1>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize border ${
                  statusStyles[order.status]
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Placed on{" "}
                {new Date(order.created_at).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </p>
          </div>

          {/* Status Change Control */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
            <span className="text-xs font-semibold uppercase text-slate-500">Update Status:</span>
            <select
              value={selectedStatus}
              disabled={updating}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {STATUS_LIST.map((st) => (
                <option key={st} value={st}>
                  {st.toUpperCase()}
                </option>
              ))}
            </select>
            {updating && <RotateCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-sm">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Customer / Practice Details
            </h3>
            <p className="font-semibold text-slate-900">{order.customer_name}</p>
            <p className="text-xs text-slate-500 mt-1">Verified Dental Account</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Shipping & Delivery Destination</span>
            </h3>
            <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">
              {order.customer_address}
            </p>
          </div>
        </div>
      </div>

      {/* Itemized Line Items Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-slate-900 text-sm">Itemized Order Manifest</h2>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-6">Product / Description</th>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4 text-center">Quantity</th>
              <th className="py-3 px-4 text-right">Unit Price (Snapshot)</th>
              <th className="py-3 px-6 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {order.items?.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-6 font-medium text-slate-900">
                  {item.product_name || `Product #${item.product_id}`}
                </td>
                <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                  {item.product_sku || "—"}
                </td>
                <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                  {item.quantity}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                  ${item.unit_price.toFixed(2)}
                </td>
                <td className="py-3.5 px-6 text-right font-mono font-medium text-slate-900">
                  ${(item.quantity * item.unit_price).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pricing Summary */}
        <div className="p-6 bg-slate-50/60 border-t border-slate-200 flex justify-end">
          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono text-slate-800">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Estimated Sales Tax (8%):</span>
              <span className="font-mono text-slate-800">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Standard Medical Freight:</span>
              <span className="font-mono text-emerald-600 uppercase font-semibold">Included</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
              <span>Total Invoice:</span>
              <span className="font-mono text-blue-600">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
