"use client";

import { useEffect, useState, useCallback } from "react";
import { Boxes, SlidersHorizontal, AlertTriangle, CheckCircle2, XCircle, X } from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  status: string;
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  threshold: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);

  // Modal form state
  const [change, setChange] = useState<string>("");
  const [reason, setReason] = useState<"restock" | "damage" | "correction">("restock");
  const [notes, setNotes] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  function openAdjustment(item: InventoryItem) {
    setActiveItem(item);
    setChange("");
    setReason("restock");
    setNotes("");
    setAdjustError(null);
  }

  function closeAdjustment() {
    setActiveItem(null);
    setAdjustError(null);
  }

  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeItem) return;
    setAdjustError(null);

    const changeNum = parseInt(change, 10);
    if (isNaN(changeNum) || changeNum === 0) {
      setAdjustError("Please specify a non-zero quantity change (+/-)");
      return;
    }

    setAdjusting(true);
    try {
      const res = await fetch(`/api/inventory/${activeItem.id}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          change: changeNum,
          reason,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Adjustment failed");
      }

      // Update state in place
      setItems((prev) =>
        prev.map((it) => {
          if (it.id === activeItem.id) {
            const newStock = data.newStock;
            return {
              ...it,
              stock: newStock,
              stock_status:
                newStock === 0 ? "out_of_stock" : newStock <= it.threshold ? "low_stock" : "in_stock",
            };
          }
          return it;
        })
      );

      closeAdjustment();
    } catch (err: any) {
      setAdjustError(err.message || "Failed to submit adjustment");
    } finally {
      setAdjusting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory & Stock Control</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time SKU quantities, minimum stock safety thresholds, and immediate stock adjustments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200">
            Global Low-Stock Threshold: <strong className="text-slate-900">10 units</strong>
          </span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Item Name</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">Threshold</th>
                <th className="py-3.5 px-4">Health Status</th>
                <th className="py-3.5 px-4 text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading inventory records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {item.sku}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {item.category || "Unassigned"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 text-base">{item.stock}</span>
                      <span className="text-xs text-slate-400 ml-1">units</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      ≤ {item.threshold} units
                    </td>
                    <td className="py-3.5 px-4">
                      {item.stock_status === "out_of_stock" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          Out of Stock
                        </span>
                      )}
                      {item.stock_status === "low_stock" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Low Stock
                        </span>
                      )}
                      {item.stock_status === "in_stock" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openAdjustment(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Adjust</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Stock Adjustment</h3>
              </div>
              <button
                onClick={closeAdjustment}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <p className="font-semibold text-slate-900 text-sm truncate">{activeItem.name}</p>
                <div className="flex items-center gap-4 mt-1 font-mono text-slate-500">
                  <span>SKU: {activeItem.sku}</span>
                  <span>•</span>
                  <span>
                    Current Stock: <strong className="text-slate-800">{activeItem.stock}</strong> units
                  </span>
                </div>
              </div>

              {adjustError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
                  {adjustError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quantity Change (+/-) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50 (restock) or -2 (damage)"
                  value={change}
                  onChange={(e) => setChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Positive number adds stock; negative number deducts stock.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="restock">Restock (Received shipment)</option>
                  <option value="damage">Damage (Spoiled/broken during handling)</option>
                  <option value="correction">Correction (Audit recount fix)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Purchase order ref, supplier delivery slip #, or reason details..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={closeAdjustment}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-60"
                >
                  {adjusting ? "Updating..." : "Commit Stock Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
