"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Plus, Search, Edit, Trash2, X } from "lucide-react";

export const dynamic = "force-dynamic";

interface Client {
  id: string;
  name: string;
  industry: string | null;
  createdAt: string;
}

function ClientsPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: "", industry: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session) {
      fetchClients();
    }
  }, [session]);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients";
      const method = editingClient ? "PUT" : "POST";

      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setShowModal(false);
      setEditingClient(null);
      setFormData({ name: "", industry: "" });
      fetchClients();
    } catch (error) {
      console.error("Failed to save client:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      fetchClients();
    } catch (error) {
      console.error("Failed to delete client:", error);
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({ name: client.name, industry: client.industry || "" });
    setShowModal(true);
  };

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-text-secondary">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Clients</h1>
          <p className="text-text-secondary mt-1">
            Manage your clients for revenue auditing
          </p>
        </div>
        <button
          onClick={() => {
            setEditingClient(null);
            setFormData({ name: "", industry: "" });
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search clients..."
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
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Industry</th>
              <th className="text-right py-3 px-4">Created</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr key={client.id} className="table-row">
                <td className="py-3 px-4 text-text-primary font-medium">
                  {client.name}
                </td>
                <td className="py-3 px-4 text-text-secondary">
                  {client.industry || "-"}
                </td>
                <td className="py-3 px-4 text-right text-text-secondary">
                  {new Date(client.createdAt).toLocaleDateString("en-ZA")}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(client)}
                      className="p-2 rounded-md text-text-secondary hover:text-accent-primary hover:bg-background-hover transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-2 rounded-md text-text-secondary hover:text-accent-error hover:bg-background-hover transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-tertiary">
                  {search ? "No clients found" : "No clients yet. Add your first client."}
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
                {editingClient ? "Edit Client" : "Add Client"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingClient(null);
                }}
                className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-background-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., Technology, Finance, Healthcare"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingClient(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Saving..." : editingClient ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ClientsPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}