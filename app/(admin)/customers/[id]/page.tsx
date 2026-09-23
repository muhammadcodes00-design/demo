"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, User, Phone, Mail, MapPin, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  total: number;
  created_at: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  orders: Order[];
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Customer not found");
        return res.json();
      })
      .then((data) => {
        setCustomer(data);
        setNotes(data.notes || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSaveNotes() {
    setSavingNotes(true);
    setSavedSuccess(false);
    try {
      const res = await fetch(`/api/customers/${id}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to save notes");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e: any) {
      alert(e.message || "Error saving notes");
    } finally {
      setSavingNotes(false);
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    processing: "bg-blue-100 text-blue-800 border-blue-200",
    shipped: "bg-purple-100 text-purple-800 border-purple-200",
    delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-700 border-slate-200",
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-action" />
        Loading customer profile...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6">
        <Link href="/customers" className="text-sm text-action hover:underline inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || "Customer record not found"}</span>
        </div>
      </div>
    );
  }

  const totalSpent = customer.orders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="text-sm font-medium text-slate-600 hover:text-action inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-action flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy">{customer.name}</h1>
              <p className="text-xs text-slate-400 mt-1">Customer ID: {customer.id}</p>
            </div>
          </div>
          <div className="flex gap-6 sm:text-right">
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Orders</p>
              <p className="text-xl font-bold text-navy mt-0.5">{customer.orders.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Spend</p>
              <p className="text-xl font-bold text-navy mt-0.5">${totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Contact info grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-sm">
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Email Address</p>
              <p className="text-slate-800 font-medium mt-0.5">{customer.email || "No email on file"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Phone Number</p>
              <p className="text-slate-800 font-medium mt-0.5">{customer.phone || "No phone on file"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Billing & Delivery Address</p>
              <p className="text-slate-800 font-medium mt-0.5">{customer.address || "No address recorded"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order History (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-navy mb-4 flex items-center justify-between">
            <span>Order History</span>
            <span className="text-xs font-normal text-slate-500">{customer.orders.length} orders recorded</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-y border-slate-100 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-3">Order #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customer.orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No orders placed by this customer yet.
                    </td>
                  </tr>
                ) : (
                  customer.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-action">
                        <Link href={`/orders/${order.id}`} className="hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(order.created_at).toLocaleDateString()}
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
                      <td className="py-3 px-3 text-right font-medium text-navy">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-xs text-action hover:underline font-medium"
                        >
                          View Order →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Internal Notes (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-action" />
              <h2 className="text-base font-bold text-navy">Internal CRM Notes</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Staff-only confidential notes regarding account preferences, payment terms, or delivery instructions.
            </p>
            <textarea
              className="w-full h-44 p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-action/30 resize-none font-sans text-slate-800"
              placeholder="e.g. Requires packing slip inside box. Preferred delivery before noon. Doctor Elena requested net-30 terms."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
            {savedSuccess ? (
              <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            ) : (
              <span />
            )}
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="px-4 py-2 bg-action hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              {savingNotes ? "Saving..." : "Save Notes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
