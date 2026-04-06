import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "RevAudit - Revenue Leakage Detection",
  description: "Production-grade revenue leakage detection system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background-primary text-text-primary antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}