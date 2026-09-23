"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Search } from "lucide-react";

interface Customer {
  id: string; name: string; email: string | null; phone: string | null;
  order_count: number; total_spend: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/customers?search=${encodeURIComponent(search)}`)
      .then((r) => r.json()).then(setCustomers).finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Users className="text-action w-6 h-6" />
        <h1 className="text-2xl font-bold text-navy">Customers</h1>
      </div>

      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm w-full focus:outline-none focus:ring-2 focus:ring-action/30"
          placeholder="Search name, email, phone…"
          value={search} onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Name", "Email", "Phone", "Orders", "Total Spend", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No customers found</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-navy">{c.name}</td>
                <td className="px-4 py-3 text-slate-500">{c.email || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-slate-700 font-medium">{c.order_count}</td>
                <td className="px-4 py-3 font-semibold text-navy">${c.total_spend.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <Link href={`/customers/${c.id}`} className="text-action hover:underline font-medium text-xs">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
