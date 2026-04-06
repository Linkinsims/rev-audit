import type { Metadata } from "next";
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
        {children}
      </body>
    </html>
  );
}