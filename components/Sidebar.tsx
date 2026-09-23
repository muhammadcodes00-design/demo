"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  ShoppingCart, 
  Users,
  BookOpen,
  LogOut, 
  ShieldCheck 
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/accounting", label: "Accounting", icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
      setLoggingOut(false);
    }
  }

  return (
    <aside className="w-64 bg-[#1e293b] text-slate-200 flex flex-col min-h-screen shrink-0 border-r border-slate-700/50">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-700/60 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white leading-tight tracking-tight">InvortechDS</h1>
          <p className="text-xs text-slate-400 font-medium">Dental Supplies Admin</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-4 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & Logout Footer */}
      <div className="p-4 border-t border-slate-700/60 bg-slate-900/40">
        <div className="flex items-center justify-between mb-3">
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">InvortechDS Admin</p>
            <p className="text-[11px] text-slate-400 truncate">admins@invortechDS.com</p>
          </div>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Online"></span>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-rose-900/40 hover:text-rose-300 hover:border-rose-700/50 border border-slate-700 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </aside>
  );
}
