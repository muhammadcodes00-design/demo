"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: string;
}

interface FormLine {
  account_id: string;
  debit: string;
  credit: string;
}

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<FormLine[]>([
    { account_id: "acc_rent", debit: "500", credit: "" },
    { account_id: "acc_cash", debit: "", credit: "500" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/accounting/trial-balance")
      .then((r) => r.json())
      .then((data) => {
        if (data.rows) {
          setAccounts(data.rows.map((r: any) => ({ id: r.id, name: r.name, type: r.type })));
        }
      })
      .catch(console.error);
  }, []);

  function handleLineChange(index: number, field: keyof FormLine, value: string) {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  }

  function addLine() {
    setLines([...lines, { account_id: accounts[0]?.id || "acc_cash", debit: "", credit: "" }]);
  }

  function removeLine(index: number) {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  }

  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.001 && totalDebit > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!memo.trim()) {
      setError("Please provide a memo/description for this entry.");
      return;
    }

    if (!isBalanced) {
      setError(`Entry is unbalanced: Debits ($${totalDebit.toFixed(2)}) must equal Credits ($${totalCredit.toFixed(2)}).`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        entry_date: entryDate,
        memo: memo.trim(),
        lines: lines.map((l) => ({
          account_id: l.account_id,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
        })),
      };

      const res = await fetch("/api/accounting/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post journal entry");
      }

      router.push("/accounting");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/accounting"
          className="text-sm font-medium text-slate-600 hover:text-action inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Accounting</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="pb-4 border-b border-slate-100">
          <h1 className="text-xl font-bold text-navy">New Manual Journal Entry</h1>
          <p className="text-xs text-slate-500 mt-1">
            Record manual financial adjustments. Server requires total debits to strictly equal total credits.
          </p>
        </div>

        {error && (
          <div className="my-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Entry Date</label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-action/30"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Memo / Purpose</label>
              <input
                type="text"
                required
                placeholder="e.g. Office utility expense, Director loan, Equipment depreciation..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-action/30"
              />
            </div>
          </div>

          {/* Line items table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase text-slate-500">Debits & Credits Lines</label>
              <button
                type="button"
                onClick={addLine}
                className="text-xs font-medium text-action hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Line</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3 text-right w-36">Debit ($)</th>
                    <th className="py-2.5 px-3 text-right w-36">Credit ($)</th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3">
                        <select
                          value={line.account_id}
                          onChange={(e) => handleLineChange(idx, "account_id", e.target.value)}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-action"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.debit}
                          onChange={(e) => {
                            handleLineChange(idx, "debit", e.target.value);
                            if (e.target.value) handleLineChange(idx, "credit", "");
                          }}
                          className="w-full text-right px-2 py-1.5 border border-slate-200 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-action"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={line.credit}
                          onChange={(e) => {
                            handleLineChange(idx, "credit", e.target.value);
                            if (e.target.value) handleLineChange(idx, "debit", "");
                          }}
                          className="w-full text-right px-2 py-1.5 border border-slate-200 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-action"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        {lines.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                    <td className="py-3 px-3 text-slate-600 uppercase text-xs">Total Amount</td>
                    <td className="py-3 px-3 text-right font-mono text-navy">${totalDebit.toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-mono text-navy">${totalCredit.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Invariant status banner */}
            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {isBalanced ? (
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Entry is balanced (difference: $0.00)
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Entry is unbalanced by ${difference.toFixed(2)}
                  </span>
                )}
              </div>
              <span className="text-slate-400">Lines: {lines.length}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Link
              href="/accounting"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !isBalanced}
              className="px-5 py-2 bg-action hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              {loading ? "Posting Entry..." : "Post Journal Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
