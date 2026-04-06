"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Play, Search, ChevronRight, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

interface AuditResult {
  id: string;
  clientId: string;
  clientName: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  issueType: string;
  createdAt: string;
}

export default function AuditPage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const router = useRouter();
  const [results, setResults] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => { if (session) fetchResults(); }, [session, status]);

  const fetchResults = async () => {
    if (status !== "authenticated") return;
    try { const res = await fetch("/api/audit"); const data = await res.json(); setResults(data); }
    catch (error) { console.error("Failed to fetch:", error); }
    finally { setLoading(false); }
  };

  const handleRunAudit = async () => {
    setRunning(true);
    try { await fetch("/api/audit/run", { method: "POST" }); fetchResults(); }
    catch (error) { console.error("Failed to run audit:", error); }
    finally { setRunning(false); }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  const filteredResults = results.filter(r => (r.clientName.toLowerCase().includes(search.toLowerCase()) || r.issueType.toLowerCase().includes(search.toLowerCase())) && (filter === "all" || (filter === "issues" && r.issueType !== "OK") || r.issueType === filter));

  if (status === "loading" || loading) return <div className="min-h-screen bg-background-primary flex items-center justify-center"><div className="text-text-secondary">Loading...</div></div>;
  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-background-primary">
      <Sidebar />
      <main className="ml-[280px] p-8">
        <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-semibold text-text-primary">Audit</h1><p className="text-text-secondary mt-1">Run audit to detect revenue leakage</p></div><button onClick={handleRunAudit} disabled={running} className="btn-primary flex items-center gap-2">{running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}{running ? "Running..." : "Run Audit"}</button></div>
        <div className="flex gap-4 mb-6"><div className="flex-1"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" /><input type="text" placeholder="Search results..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" /></div></div><select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field w-48"><option value="all">All Issues</option><option value="UNDERCHARGE">Undercharging</option><option value="OVERCHARGE">Overcharging</option><option value="MISSED_BILLING">Missed Billing</option></select></div>
        <div className="card">
          <table className="w-full"><thead><tr className="table-header"><th className="text-left py-3 px-4">Client</th><th className="text-right py-3 px-4">Expected</th><th className="text-right py-3 px-4">Actual</th><th className="text-right py-3 px-4">Difference</th><th className="text-center py-3 px-4">Issue Type</th><th className="text-right py-3 px-4">Date</th><th className="text-right py-3 px-4"></th></tr></thead>
            <tbody>
              {filteredResults.map((result) => (
                <tr key={result.id} className="table-row cursor-pointer hover:bg-background-hover" onClick={() => router.push(`/audit/${result.id}`)}>
                  <td className="py-3 px-4 text-text-primary font-medium">{result.clientName}</td>
                  <td className="py-3 px-4 text-right font-mono text-text-primary">{formatCurrency(result.expectedAmount)}</td>
                  <td className="py-3 px-4 text-right font-mono text-text-primary">{formatCurrency(result.actualAmount)}</td>
                  <td className={`py-3 px-4 text-right font-mono ${result.difference > 0 ? "text-accent-error" : result.difference < 0 ? "text-accent-success" : "text-text-secondary"}`}>{result.difference !== 0 ? `${result.difference > 0 ? "+" : "-"}${formatCurrency(Math.abs(result.difference))}` : "-"}</td>
                  <td className="py-3 px-4 text-center"><span className={`badge ${result.issueType === "UNDERCHARGE" ? "badge-undercharge" : result.issueType === "OVERCHARGE" ? "badge-overcharge" : result.issueType === "MISSED_BILLING" ? "badge-missed" : "badge-ok"}`}>{result.issueType}</span></td>
                  <td className="py-3 px-4 text-right text-text-secondary">{new Date(result.createdAt).toLocaleDateString("en-ZA")}</td>
                  <td className="py-3 px-4 text-right"><ChevronRight className="w-4 h-4 text-text-tertiary" /></td>
                </tr>))}
              {filteredResults.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-text-tertiary">{search || filter !== "all" ? "No results match your filters" : "No audit results."}</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}