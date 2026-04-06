"use client";

import { SessionProvider } from "next-auth/react";
import { Sidebar } from "./Sidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-background-primary">
        <Sidebar />
        <main className="ml-[280px] min-h-screen">{children}</main>
      </div>
    </SessionProvider>
  );
}