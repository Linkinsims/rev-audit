"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
} from "lucide-react";

interface DashboardMetrics {
  totalLeakage: number;
  undercharging: number;
  overcharging: number;
  missedBilling: number;
  activeClients: number;
  totalAudits: number;
}

interface TopClient {
  id: string;
  name: string;
  leakage: number;
}

interface RecentAudit {
  id: string;
  clientName: string;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  issueType: string;
  createdAt: string;
}

interface Insight {
  type: string;
  message: string;
  value?: number;
}

function DashboardContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalLeakage: 0,
    undercharging: 0,
    overcharging: 0,
    missedBilling: 0,
    activeClients: 0,
    totalAudits: 0,
  });
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [recentAudits, setRecentAudits] = useState<RecentAudit[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, topClientsRes, auditsRes, insightsRes] =
        await Promise.all([
          fetch("/api/dashboard/metrics").then((r) => r.json()),
          fetch("/api/dashboard/top-clients").then((r) => r.json()),
          fetch("/api/dashboard/recent-audits").then((r) => r.json()),
          fetch("/api/dashboard/insights").then((r) => r.json()),
        ]);

      setMetrics(metricsRes);
      setTopClients(topClientsRes);
      setRecentAudits(auditsRes);
      setInsights(insightsRes);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-text-secondary">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Revenue leakage detection overview
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-secondary text-sm">Total Leakage</span>
            <TrendingDown className="w-5 h-5 text-accent-error" />
          </div>
          <p className="text-2xl font-semibold font-mono text-accent-error">
            {formatCurrency(metrics.totalLeakage)}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-secondary text-sm">Undercharging</span>
            <ArrowDownRight className="w-5 h-5 text-accent-warning" />
          </div>
          <p className="text-2xl font-semibold font-mono text-accent-warning">
            {formatCurrency(metrics.undercharging)}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-secondary text-sm">Overcharging</span>
            <ArrowUpRight className="w-5 h-5 text-accent-purple" />
          </div>
          <p className="text-2xl font-semibold font-mono text-accent-purple">
            {formatCurrency(metrics.overcharging)}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-secondary text-sm">Missed Billing</span>
            <AlertTriangle className="w-5 h-5 text-accent-error" />
          </div>
          <p className="text-2xl font-semibold font-mono text-accent-error">
            {formatCurrency(metrics.missedBilling)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="card col-span-2">
          <h2 className="text-lg font-medium text-text-primary mb-4">
            Top Leaking Clients
          </h2>
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left py-3 px-4">Client</th>
                <th className="text-right py-3 px-4">Leakage</th>
                <th className="text-right py-3 px-4">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {topClients.map((client, index) => (
                <tr key={client.id} className="table-row">
                  <td className="py-3 px-4 text-text-primary">{client.name}</td>
                  <td className="py-3 px-4 text-right font-mono text-accent-error">
                    {formatCurrency(client.leakage)}
                  </td>
                  <td className="py-3 px-4 text-right text-text-secondary">
                    {metrics.totalLeakage > 0
                      ? ((client.leakage / metrics.totalLeakage) * 100).toFixed(1)
                      : 0}
                    %
                  </td>
                </tr>
              ))}
              {topClients.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-8 text-center text-text-tertiary"
                  >
                    No client data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-text-primary mb-4">
            Insights
          </h2>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="p-3 rounded-md bg-background-tertiary border border-border"
              >
                <p className="text-sm text-text-primary">{insight.message}</p>
                {insight.value !== undefined && (
                  <p className="text-lg font-semibold font-mono text-accent-warning mt-1">
                    {formatCurrency(insight.value)}
                  </p>
                )}
              </div>
            ))}
            {insights.length === 0 && (
              <p className="text-text-tertiary text-sm">
                No insights available yet. Run an audit to generate insights.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-medium text-text-primary mb-4">
          Recent Audit Results
        </h2>
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left py-3 px-4">Client</th>
              <th className="text-right py-3 px-4">Expected</th>
              <th className="text-right py-3 px-4">Actual</th>
              <th className="text-right py-3 px-4">Difference</th>
              <th className="text-center py-3 px-4">Issue Type</th>
              <th className="text-right py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {recentAudits.map((audit) => (
              <tr
                key={audit.id}
                className="table-row cursor-pointer hover:bg-background-hover"
                onClick={() => router.push(`/audit/${audit.id}`)}
              >
                <td className="py-3 px-4 text-text-primary">{audit.clientName}</td>
                <td className="py-3 px-4 text-right font-mono text-text-primary">
                  {formatCurrency(audit.expectedAmount)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-text-primary">
                  {formatCurrency(audit.actualAmount)}
                </td>
                <td
                  className={`py-3 px-4 text-right font-mono ${
                    audit.difference > 0
                      ? "text-accent-error"
                      : "text-accent-success"
                  }`}
                >
                  {formatCurrency(Math.abs(audit.difference))}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`badge ${
                      audit.issueType === "UNDERCHARGE"
                        ? "badge-undercharge"
                        : audit.issueType === "OVERCHARGE"
                        ? "badge-overcharge"
                        : "badge-missed"
                    }`}
                  >
                    {audit.issueType}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-text-secondary">
                  {formatDate(audit.createdAt)}
                </td>
              </tr>
            ))}
            {recentAudits.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-tertiary">
                  No audit results yet. Run an audit to see results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}