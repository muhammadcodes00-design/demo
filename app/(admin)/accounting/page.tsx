"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  PlusCircle, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  Scale, 
  DollarSign,
  Filter
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: string;
}

interface JournalLine {
  id: string;
  account_id: string;
  account_name: string;
  debit: number;
  credit: number;
}

interface JournalEntry {
  id: string;
  entry_date: string;
  source: "auto" | "manual";
  source_reference: string | null;
  memo: string;
  lines: JournalLine[];
}

interface LedgerRow {
  id: string;
  entry_date: string;
  memo: string;
  source: string;
  debit: number;
  credit: number;
  balance: number;
}

interface TrialBalanceRow {
  id: string;
  name: string;
  type: string;
  total_debit: number;
  total_credit: number;
}

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<"journal" | "ledger" | "trial" | "balance">("journal");
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // Journal tab state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalFrom, setJournalFrom] = useState("");
  const [journalTo, setJournalTo] = useState("");
  const [loadingJournal, setLoadingJournal] = useState(false);

  // Ledger tab state
  const [selectedAccountId, setSelectedAccountId] = useState("acc_cash");
  const [ledgerData, setLedgerData] = useState<{ account: Account; rows: LedgerRow[] } | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Trial Balance state
  const [trialBalance, setTrialBalance] = useState<{
    rows: TrialBalanceRow[];
    sumDebit: number;
    sumCredit: number;
    balanced: boolean;
  } | null>(null);
  const [loadingTrial, setLoadingTrial] = useState(false);

  // Balance Sheet state
  const [asOfDate, setAsOfDate] = useState("");
  const [balanceSheet, setBalanceSheet] = useState<{
    assets: TrialBalanceRow[];
    liabilities: TrialBalanceRow[];
    equity: TrialBalanceRow[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    balanced: boolean;
  } | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Fetch accounts list for dropdowns
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

  // Fetch data depending on active tab
  useEffect(() => {
    if (activeTab === "journal") {
      setLoadingJournal(true);
      const params = new URLSearchParams();
      if (journalFrom) params.append("from", journalFrom);
      if (journalTo) params.append("to", journalTo);
      fetch(`/api/accounting/journal?${params.toString()}`)
        .then((r) => r.json())
        .then(setJournalEntries)
        .finally(() => setLoadingJournal(false));
    } else if (activeTab === "ledger") {
      if (!selectedAccountId) return;
      setLoadingLedger(true);
      fetch(`/api/accounting/ledger/${selectedAccountId}`)
        .then((r) => r.json())
        .then(setLedgerData)
        .finally(() => setLoadingLedger(false));
    } else if (activeTab === "trial") {
      setLoadingTrial(true);
      fetch("/api/accounting/trial-balance")
        .then((r) => r.json())
        .then(setTrialBalance)
        .finally(() => setLoadingTrial(false));
    } else if (activeTab === "balance") {
      setLoadingBalance(true);
      const query = asOfDate ? `?date=${asOfDate}` : "";
      fetch(`/api/accounting/balance-sheet${query}`)
        .then((r) => r.json())
        .then(setBalanceSheet)
        .finally(() => setLoadingBalance(false));
    }
  }, [activeTab, journalFrom, journalTo, selectedAccountId, asOfDate]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-action flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5 text-action" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Accounting & General Ledger</h1>
            <p className="text-xs text-slate-500">
              Double-entry books, automated journal hooks, trial balance, and balance sheet.
            </p>
          </div>
        </div>
        <Link
          href="/accounting/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-action hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Manual Entry</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto">
        {[
          { key: "journal", label: "General Journal", icon: BookOpen },
          { key: "ledger", label: "General Ledger", icon: FileSpreadsheet },
          { key: "trial", label: "Trial Balance", icon: Scale },
          { key: "balance", label: "Balance Sheet", icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-action text-action font-semibold"
                  : "border-transparent text-slate-500 hover:text-navy hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General Journal */}
      {activeTab === "journal" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Filter</span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={journalFrom}
                  onChange={(e) => setJournalFrom(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-action"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={journalTo}
                  onChange={(e) => setJournalTo(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-action"
                />
                {(journalFrom || journalTo) && (
                  <button
                    onClick={() => { setJournalFrom(""); setJournalTo(""); }}
                    className="text-xs text-action hover:underline font-medium ml-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">{journalEntries.length} posted entries</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {loadingJournal ? (
              <div className="p-8 text-center text-slate-400 text-sm">Loading journal entries...</div>
            ) : journalEntries.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No journal entries found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {journalEntries.map((entry) => {
                  const entryDebit = entry.lines.reduce((s, l) => s + (l.debit || 0), 0);
                  const entryCredit = entry.lines.reduce((s, l) => s + (l.credit || 0), 0);
                  const isBalanced = Math.abs(entryDebit - entryCredit) < 0.01;

                  return (
                    <div key={entry.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-navy bg-slate-100 px-2 py-1 rounded">
                            {entry.entry_date}
                          </span>
                          <span
                            className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                              entry.source === "auto"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {entry.source}
                          </span>
                          <span className="font-semibold text-slate-800 text-sm">{entry.memo}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {entry.source_reference && <span className="mr-3">{entry.source_reference}</span>}
                          <span>ID: {entry.id}</span>
                        </div>
                      </div>

                      {/* Line Items */}
                      <table className="w-full text-xs text-left mt-2">
                        <thead>
                          <tr className="text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-100">
                            <th className="py-1 px-2">Account</th>
                            <th className="py-1 px-2 text-right w-28">Debit</th>
                            <th className="py-1 px-2 text-right w-28">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {entry.lines.map((l) => (
                            <tr key={l.id}>
                              <td className={`py-1.5 px-2 ${l.credit > 0 ? "pl-8 text-slate-600" : "font-medium text-slate-800"}`}>
                                {l.account_name}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                                {l.debit > 0 ? `$${l.debit.toFixed(2)}` : "—"}
                              </td>
                              <td className="py-1.5 px-2 text-right font-mono text-slate-700">
                                {l.credit > 0 ? `$${l.credit.toFixed(2)}` : "—"}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t border-slate-100 font-bold bg-slate-50/50">
                            <td className="py-1 px-2 text-slate-500">Totals</td>
                            <td className="py-1 px-2 text-right font-mono text-slate-800">${entryDebit.toFixed(2)}</td>
                            <td className="py-1 px-2 text-right font-mono text-slate-800">${entryCredit.toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: General Ledger */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Account:</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-navy focus:outline-none focus:ring-2 focus:ring-action/30"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
            {ledgerData && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Net Balance:</span>
                <span className="text-sm font-bold font-mono text-navy">
                  ${(ledgerData.rows[ledgerData.rows.length - 1]?.balance || 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Memo</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Debit</th>
                  <th className="py-3 px-4 text-right">Credit</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingLedger ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading ledger data...</td></tr>
                ) : !ledgerData || ledgerData.rows.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-slate-400">No transactions recorded for this account.</td></tr>
                ) : (
                  ledgerData.rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{row.entry_date}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{row.memo}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          row.source === "auto" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                        }`}>
                          {row.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {row.debit > 0 ? `$${row.debit.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {row.credit > 0 ? `$${row.credit.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-navy">
                        ${row.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Trial Balance */}
      {activeTab === "trial" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-navy">Trial Balance Verification</h2>
              <p className="text-xs text-slate-500">All account balances compiled. Debits and Credits must balance.</p>
            </div>
            {trialBalance && (
              <div className="flex items-center gap-2">
                {trialBalance.balanced ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Books are Balanced
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5" /> Out of Balance
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Debit Total</th>
                  <th className="py-3 px-4 text-right">Credit Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingTrial ? (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400">Loading trial balance...</td></tr>
                ) : !trialBalance || trialBalance.rows.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400">No account activity found.</td></tr>
                ) : (
                  <>
                    {trialBalance.rows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-800">{row.name}</td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-semibold uppercase text-slate-500">{row.type}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {row.total_debit > 0 ? `$${row.total_debit.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {row.total_credit > 0 ? `$${row.total_credit.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                      <td colSpan={2} className="py-3.5 px-4 text-navy uppercase text-xs">
                        Grand Totals
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-navy">
                        ${trialBalance.sumDebit.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-navy">
                        ${trialBalance.sumCredit.toFixed(2)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Balance Sheet */}
      {activeTab === "balance" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">As of Date:</label>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-action"
              />
              {asOfDate && (
                <button onClick={() => setAsOfDate("")} className="text-xs text-action hover:underline font-medium">
                  Current
                </button>
              )}
            </div>
            {balanceSheet && (
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  balanceSheet.balanced
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-rose-100 text-rose-800 border border-rose-200"
                }`}
              >
                {balanceSheet.balanced ? "Assets = Liabilities + Equity" : "Identity Mismatch"}
              </span>
            )}
          </div>

          {loadingBalance ? (
            <div className="p-8 text-center text-slate-400 text-sm">Calculating balance sheet...</div>
          ) : !balanceSheet ? (
            <div className="p-8 text-center text-slate-400 text-sm">No data available.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assets Column */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-navy pb-3 border-b border-slate-100 flex items-center justify-between">
                    <span>Assets</span>
                    <span className="text-xs font-normal text-slate-400">Debit normal balance</span>
                  </h3>
                  <div className="divide-y divide-slate-100 mt-2">
                    {balanceSheet.assets.map((a) => {
                      const net = a.total_debit - a.total_credit;
                      return (
                        <div key={a.id} className="py-2.5 flex items-center justify-between text-sm">
                          <span className="text-slate-700">{a.name}</span>
                          <span className="font-mono font-medium text-navy">${net.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="pt-4 mt-6 border-t-2 border-slate-200 flex items-center justify-between font-bold">
                  <span className="text-navy uppercase text-xs">Total Assets</span>
                  <span className="text-lg font-mono text-action">${balanceSheet.totalAssets.toFixed(2)}</span>
                </div>
              </div>

              {/* Liabilities & Equity Column */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  {/* Liabilities */}
                  <h3 className="text-base font-bold text-navy pb-3 border-b border-slate-100 flex items-center justify-between">
                    <span>Liabilities</span>
                    <span className="text-xs font-normal text-slate-400">Credit normal balance</span>
                  </h3>
                  <div className="divide-y divide-slate-100 mt-2">
                    {balanceSheet.liabilities.map((l) => {
                      const net = l.total_credit - l.total_debit;
                      return (
                        <div key={l.id} className="py-2.5 flex items-center justify-between text-sm">
                          <span className="text-slate-700">{l.name}</span>
                          <span className="font-mono font-medium text-navy">${net.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="py-2 flex items-center justify-between text-xs font-semibold text-slate-500 pt-3 border-t border-slate-100">
                    <span>Total Liabilities</span>
                    <span className="font-mono">${balanceSheet.totalLiabilities.toFixed(2)}</span>
                  </div>

                  {/* Equity */}
                  <h3 className="text-base font-bold text-navy pb-3 border-b border-slate-100 flex items-center justify-between mt-6">
                    <span>Owner&apos;s Equity</span>
                    <span className="text-xs font-normal text-slate-400">Credit normal balance</span>
                  </h3>
                  <div className="divide-y divide-slate-100 mt-2">
                    {balanceSheet.equity.map((e) => {
                      const net = e.total_credit - e.total_debit;
                      return (
                        <div key={e.id} className="py-2.5 flex items-center justify-between text-sm">
                          <span className="text-slate-700">{e.name}</span>
                          <span className="font-mono font-medium text-navy">${net.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="py-2 flex items-center justify-between text-xs font-semibold text-slate-500 pt-3 border-t border-slate-100">
                    <span>Total Equity</span>
                    <span className="font-mono">${balanceSheet.totalEquity.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t-2 border-slate-200 flex items-center justify-between font-bold">
                  <span className="text-navy uppercase text-xs">Total Liabilities & Equity</span>
                  <span className="text-lg font-mono text-action">
                    ${(balanceSheet.totalLiabilities + balanceSheet.totalEquity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
