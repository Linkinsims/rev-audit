"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Upload, Plus, Search, Edit, Trash2, X, FileText } from "lucide-react";
import Papa from "papaparse";

interface Client {
  id: string;
  name: string;
}

interface BillingRecord {
  id: string;
  clientId: string;
  clientName: string;
  amountCharged: number;
  units: number | null;
  description: string | null;
  billingDate: string;
}

function BillingPageContent() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [records, setRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BillingRecord | null>(null);
  const [formData, setFormData] = useState({
    clientId: "",
    amountCharged: "",
    units: "",
    description: "",
    billingDate: new Date().toISOString().split("T")[0],
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [clientsRes, recordsRes] = await Promise.all([
        fetch("/api/clients").then((r) => r.json()),
        fetch("/api/billing").then((r) => r.json()),
      ]);
      setClients(clientsRes);
      setRecords(recordsRes);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRecord
        ? `/api/billing/${editingRecord.id}`
        : "/api/billing";
      const method = editingRecord ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setShowModal(false);
      setEditingRecord(null);
      setFormData({
        clientId: "",
        amountCharged: "",
        units: "",
        description: "",
        billingDate: new Date().toISOString().split("T")[0],
      });
      fetchData();
    } catch (error) {
      console.error("Failed to save billing record:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this billing record?")) return;
    try {
      await fetch(`/api/billing/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Failed to delete billing record:", error);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsed = results.data as Record<string, string>[];
          for (const row of parsed) {
            const clientName = row.client || row.Client || row.client_name;
            const client = clients.find(
              (c) => c.name.toLowerCase() === clientName?.toLowerCase()
            );

            if (!client) continue;

            await fetch("/api/billing", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientId: client.id,
                amountCharged: parseFloat(row.amount || row.amountCharged || row.Amount || row.amount_charged || "0"),
                units: parseFloat(row.units || row.Units || row.units || "0") || null,
                description: row.description || row.Description || row.description || "",
                billingDate: row.date || row.Date || row.billing_date || row.billingDate || new Date().toISOString().split("T")[0],
              }),
            });
          }
          fetchData();
        } catch (error) {
          console.error("Failed to process CSV:", error);
        } finally {
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      },
      error: (error) => {
        console.error("CSV parse error:", error);
        setUploading(false);
      },
    });
  };

  const openEditModal = (record: BillingRecord) => {
    setEditingRecord(record);
    setFormData({
      clientId: record.clientId,
      amountCharged: record.amountCharged.toString(),
      units: record.units?.toString() || "",
      description: record.description || "",
      billingDate: record.billingDate.split("T")[0],
    });
    setShowModal(true);
  };

  const filteredRecords = records.filter(
    (r) =>
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-text-secondary">Loading billing records...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Billing</h1>
          <p className="text-text-secondary mt-1">
            Manage billing records and upload CSV data
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleCSVUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload CSV"}
          </button>
          <button
            onClick={() => {
              setEditingRecord(null);
              setFormData({
                clientId: "",
                amountCharged: "",
                units: "",
                description: "",
                billingDate: new Date().toISOString().split("T")[0],
              });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Record
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search billing records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              <th className="text-left py-3 px-4">Client</th>
              <th className="text-right py-3 px-4">Amount (ZAR)</th>
              <th className="text-right py-3 px-4">Units</th>
              <th className="text-left py-3 px-4">Description</th>
              <th className="text-right py-3 px-4">Date</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id} className="table-row">
                <td className="py-3 px-4 text-text-primary font-medium">
                  {record.clientName}
                </td>
                <td className="py-3 px-4 text-right font-mono text-text-primary">
                  {new Intl.NumberFormat("en-ZA", {
                    style: "currency",
                    currency: "ZAR",
                  }).format(record.amountCharged)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-text-secondary">
                  {record.units ?? "-"}
                </td>
                <td className="py-3 px-4 text-text-secondary">
                  {record.description || "-"}
                </td>
                <td className="py-3 px-4 text-right text-text-secondary">
                  {new Date(record.billingDate).toLocaleDateString("en-ZA")}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(record)}
                      className="p-2 rounded-md text-text-secondary hover:text-accent-primary hover:bg-background-hover transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="p-2 rounded-md text-text-secondary hover:text-accent-error hover:bg-background-hover transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-text-tertiary">
                  {search
                    ? "No billing records found"
                    : "No billing records yet. Upload CSV or add manually."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary border border-border rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-text-primary">
                {editingRecord ? "Edit Billing Record" : "Add Billing Record"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingRecord(null);
                }}
                className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-background-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Client *
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) =>
                    setFormData({ ...formData, clientId: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="">Select client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Amount Charged (ZAR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amountCharged}
                  onChange={(e) =>
                    setFormData({ ...formData, amountCharged: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Units
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.units}
                  onChange={(e) =>
                    setFormData({ ...formData, units: e.target.value })
                  }
                  className="input-field"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Billing Date *
                </label>
                <input
                  type="date"
                  value={formData.billingDate}
                  onChange={(e) =>
                    setFormData({ ...formData, billingDate: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="input-field"
                  placeholder="Optional description"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRecord(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  {editingRecord ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <BillingPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}