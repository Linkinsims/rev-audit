"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TrendingDown, AlertTriangle, Users, PieChart, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface Insight { type: string; message: string; value?: number; }
interface IssueBreakdown { type: string; count: number; total: number; }

export default function InsightsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [breakdown, setBreakdown] = useState<IssueBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => { if (session) fetchData(); }, [session, status]);

  const fetchData = async () => {
    if (status !== "authenticated") return;
    try { const [insightsRes, breakdownRes] = await Promise.all([fetch("/api/dashboard/insights").then(r => r.json()), fetch("/api/insights/breakdown").then(r => r.json())]); setInsights(insightsRes); setBreakdown(breakdownRes); }
    catch (error) { console.error("Failed to fetch:", error); }
    finally { setLoading(false); }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  if (status === "loading" || loading) return <div className="min-h-screen bg-background-primary flex items-center justify-center"><div className="text-text-secondary">Loading...</div></div>;
  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-background-primary">
      <Sidebar />
      <main className="ml-[280px] p-8">
        <div className="mb-8"><h1 className="text-2xl font-semibold text-text-primary">Insights</h1><p className="text-text-secondary mt-1">Revenue leakage analysis and recommendations</p></div>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="card"><div className="flex items-center gap-3 mb-4"><div className="p-2 rounded-md bg-accent-warning/10"><TrendingDown className="w-5 h-5 text-accent-warning" /></div><h2 className="text-lg font-medium text-text-primary">Key Insights</h2></div><div className="space-y-4">{insights.map((insight, index) => (<div key={index} className="p-4 rounded-md bg-background-tertiary border border-border"><p className="text-text-primary">{insight.message}</p>{insight.value !== undefined && <p className="text-xl font-semibold font-mono text-accent-warning mt-2">{formatCurrency(insight.value)}</p>}</div>))}{insights.length === 0 && <p className="text-text-tertiary">No insights available yet.</p>}</div></div>
          <div className="card"><div className="flex items-center gap-3 mb-4"><div className="p-2 rounded-md bg-accent-primary/10"><PieChart className="w-5 h-5 text-accent-primary" /></div><h2 className="text-lg font-medium text-text-primary">Issue Breakdown</h2></div><div className="space-y-3">{breakdown.map((item) => (<div key={item.type} className="flex items-center justify-between p-3 rounded-md bg-background-tertiary"><div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${item.type === "UNDERCHARGE" ? "bg-accent-error" : item.type === "OVERCHARGE" ? "bg-accent-purple" : "bg-accent-warning"}`} /><span className="text-text-primary">{item.type}</span></div><div className="text-right"><span className="font-mono text-text-primary mr-3">{formatCurrency(item.total)}</span><span className="text-text-secondary text-sm">({item.count} records)</span></div></div>))}{breakdown.length === 0 && <p className="text-text-tertiary">No issue data available.</p>}</div></div>
        </div>
        <div className="card"><div className="flex items-center gap-3 mb-4"><div className="p-2 rounded-md bg-accent-success/10"><Users className="w-5 h-5 text-accent-success" /></div><h2 className="text-lg font-medium text-text-primary">Recommendations</h2></div><div className="space-y-3"><div className="flex items-start gap-3 p-4 rounded-md bg-background-tertiary border border-border"><ArrowRight className="w-5 h-5 text-accent-success mt-0.5" /><div><p className="font-medium text-text-primary">Review undercharging patterns</p><p className="text-sm text-text-secondary mt-1">Identify clients being undercharged and update billing systems</p></div></div><div className="flex items-start gap-3 p-4 rounded-md bg-background-tertiary border border-border"><AlertTriangle className="w-5 h-5 text-accent-warning mt-0.5" /><div><p className="font-medium text-text-primary">Monitor discount expirations</p><p className="text-sm text-text-secondary mt-1">Set reminders for expiring discounts to avoid revenue loss</p></div></div><div className="flex items-start gap-3 p-4 rounded-md bg-background-tertiary border border-border"><TrendingDown className="w-5 h-5 text-accent-error mt-0.5" /><div><p className="font-medium text-text-primary">Focus on top leaking clients</p><p className="text-sm text-text-secondary mt-1">Address the top clients causing the most leakage</p></div></div></div></div>
      </main>
    </div>
  );
}