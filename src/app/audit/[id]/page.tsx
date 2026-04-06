"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

interface AuditDetail {
  id: string;
  clientId: string;
  clientName: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  issueType: string;
  details: { calculations: Array<{ ruleId: string; ruleName: string; ruleType: string; applied: boolean; expectedAmount: number; details: Record<string, unknown> }>; billingDate: string; units: number | null; };
  createdAt: string;
}

export default function AuditDetailPage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const router = useRouter();
  const params = useParams();
  const [detail, setDetail] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => { if (session && params.id) fetchDetail(); }, [session, status, params.id]);

  const fetchDetail = async () => {
    try { const res = await fetch(`/api/audit/${params.id}`); if (res.ok) { const data = await res.json(); setDetail(data); } }
    catch (error) { console.error("Failed to fetch:", error); }
    finally { setLoading(false); }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  if (status === "loading" || loading) return <div className="min-h-screen bg-background-primary flex items-center justify-center"><div className="text-text-secondary">Loading...</div></div>;
  if (status === "unauthenticated") return null;
  if (!detail) return <div className="min-h-screen bg-background-primary"><Sidebar /><main className="ml-[280px] p-8"><div className="text-center py-12 text-text-tertiary">Audit result not found</div></main></div>;

  return (
    <div className="min-h-screen bg-background-primary">
      <Sidebar />
      <main className="ml-[280px] p-8">
        <button onClick={() => router.push("/audit")} className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6"><ArrowLeft className="w-4 h-4" />Back to Audit Results</button>
        <div className="mb-6"><h1 className="text-2xl font-semibold text-text-primary">Audit Detail</h1><p className="text-text-secondary mt-1">{detail.clientName} - {new Date(detail.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</p></div>
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="card"><p className="text-text-secondary text-sm mb-2">Expected Amount</p><p className="text-2xl font-semibold font-mono text-text-primary">{formatCurrency(detail.expectedAmount)}</p></div>
          <div className="card"><p className="text-text-secondary text-sm mb-2">Actual Amount</p><p className="text-2xl font-semibold font-mono text-text-primary">{formatCurrency(detail.actualAmount)}</p></div>
          <div className="card"><p className="text-text-secondary text-sm mb-2">Difference</p><p className={`text-2xl font-semibold font-mono ${detail.difference > 0 ? "text-accent-error" : detail.difference < 0 ? "text-accent-success" : "text-text-secondary"}`}>{detail.difference !== 0 ? `${detail.difference > 0 ? "+" : "-"}${formatCurrency(Math.abs(detail.difference))}` : "No difference"}</p></div>
        </div>
        <div className="card mb-6"><h2 className="text-lg font-medium text-text-primary mb-4">Issue Analysis</h2><div className="flex items-center gap-4"><span className={`badge ${detail.issueType === "UNDERCHARGE" ? "badge-undercharge" : detail.issueType === "OVERCHARGE" ? "badge-overcharge" : detail.issueType === "MISSED_BILLING" ? "badge-missed" : "badge-ok"}`}>{detail.issueType}</span><span className="text-text-secondary">{detail.issueType === "UNDERCHARGE" && "Client was charged less than expected"}{detail.issueType === "OVERCHARGE" && "Client was charged more than expected"}{detail.issueType === "MISSED_BILLING" && "Billing record was not found"}{detail.issueType === "OK" && "No issues detected"}</span></div></div>
        {detail.details?.calculations && detail.details.calculations.length > 0 && (<div className="card"><h2 className="text-lg font-medium text-text-primary mb-4">Rules Applied</h2><div className="space-y-4">{detail.details.calculations.map((calc, index) => (<div key={index} className="p-4 rounded-md bg-background-tertiary border border-border"><div className="flex items-center justify-between mb-2"><div><p className="font-medium text-text-primary">{calc.ruleName}</p><p className="text-sm text-text-secondary">{calc.ruleType}</p></div><p className="font-mono text-text-primary">{formatCurrency(calc.expectedAmount)}</p></div>{calc.details && Object.keys(calc.details).length > 0 && <div className="mt-3 pt-3 border-t border-border"><p className="text-xs text-text-tertiary mb-1">Calculation Details:</p><pre className="text-xs font-mono text-text-secondary overflow-x-auto">{JSON.stringify(calc.details, null, 2)}</pre></div>}</div>))}</div></div>)}
        {(!detail.details?.calculations || detail.details.calculations.length === 0) && <div className="card"><p className="text-text-tertiary text-center py-4">No rules were applied</p></div>}
      </main>
    </div>
  );
}