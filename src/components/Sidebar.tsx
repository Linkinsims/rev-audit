"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Search,
  Settings,
  LogOut,
  TrendingDown,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/audit", label: "Audit", icon: Search },
  { href: "/insights", label: "Insights", icon: TrendingDown },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-background-secondary border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-primary rounded-lg flex items-center justify-center">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">RevAudit</h1>
            <p className="text-xs text-text-tertiary">Revenue Leakage Detection</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-150 ${
                    isActive
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-text-secondary hover:bg-background-hover hover:text-text-primary"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-md text-text-secondary hover:bg-background-hover hover:text-text-primary transition-all duration-150"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}