"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Plus, Search, Edit, Trash2, X, ChevronDown, ChevronRight } from "lucide-react";

interface Client {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  clientName: string;
}

interface ContractRule {
  id: string;
  contractId: string;
  type: string;
  name: string;
  isActive: boolean;
  priority: number;
  startDate: string | null;
  endDate: string | null;
}

function ContractsPageContent() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [rules, setRules] = useState<Record<string, ContractRule[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showContractModal, setShowContractModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const [contractForm, setContractForm] = useState({ clientId: "", name: "", description: "" });
  const [ruleForm, setRuleForm] = useState({
    name: "",
    type: "FLAT",
    priority: 0,
    condition: "{}",
    value: "{}",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      const [clientsRes, contractsRes] = await Promise.all([
        fetch("/api/clients").then((r) => r.json()),
        fetch("/api/contracts").then((r) => r.json()),
      ]);
      setClients(clientsRes);
      setContracts(contractsRes);

      const rulesObj: Record<string, ContractRule[]> = {};
      for (const c of contractsRes) {
        const rulesRes = await fetch(`/api/contracts/${c.id}/rules`).then((r) =>
          r.json()
        );
        rulesObj[c.id] = rulesRes;
      }
      setRules(rulesObj);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contractForm),
      });
      setShowContractModal(false);
      setContractForm({ clientId: "", name: "", description: "" });
      fetchData();
    } catch (error) {
      console.error("Failed to create contract:", error);
    }
  };

  const handleRuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/contracts/${selectedContractId}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...ruleForm,
          startDate: ruleForm.startDate || null,
          endDate: ruleForm.endDate || null,
        }),
      });
      setShowRuleModal(false);
      setSelectedContractId(null);
      setRuleForm({
        name: "",
        type: "FLAT",
        priority: 0,
        condition: "{}",
        value: "{}",
        startDate: "",
        endDate: "",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to create rule:", error);
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm("Delete this contract?")) return;
    try {
      await fetch(`/api/contracts/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Failed to delete contract:", error);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await fetch(`/api/rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchData();
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Delete this rule?")) return;
    try {
      await fetch(`/api/rules/${ruleId}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const toggleExpand = (contractId: string) => {
    setExpandedContracts((prev) => {
      const next = new Set(prev);
      if (next.has(contractId)) {
        next.delete(contractId);
      } else {
        next.add(contractId);
      }
      return next;
    });
  };

  const filteredContracts = contracts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-text-secondary">Loading contracts...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Contracts</h1>
          <p className="text-text-secondary mt-1">
            Define contract rules for revenue calculation
          </p>
        </div>
        <button
          onClick={() => setShowContractModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Contract
        </button>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredContracts.map((contract) => (
          <div key={contract.id} className="card">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleExpand(contract.id)}
            >
              <div className="flex items-center gap-3">
                {expandedContracts.has(contract.id) ? (
                  <ChevronDown className="w-5 h-5 text-text-tertiary" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-text-tertiary" />
                )}
                <div>
                  <h3 className="font-medium text-text-primary">{contract.name}</h3>
                  <p className="text-sm text-text-secondary">
                    Client: {contract.clientName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedContractId(contract.id);
                    setShowRuleModal(true);
                  }}
                  className="btn-secondary text-sm py-1 px-3"
                >
                  Add Rule
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteContract(contract.id);
                  }}
                  className="p-2 rounded-md text-text-secondary hover:text-accent-error hover:bg-background-hover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedContracts.has(contract.id) && (
              <div className="mt-4 pt-4 border-t border-border">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="text-left py-2 px-3">Rule</th>
                      <th className="text-left py-2 px-3">Type</th>
                      <th className="text-center py-2 px-3">Active</th>
                      <th className="text-center py-2 px-3">Priority</th>
                      <th className="text-right py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules[contract.id]?.map((rule) => (
                      <tr key={rule.id} className="table-row">
                        <td className="py-2 px-3 text-text-primary">
                          {rule.name}
                        </td>
                        <td className="py-2 px-3 text-text-secondary">
                          {rule.type}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            onClick={() => handleToggleRule(rule.id, rule.isActive)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              rule.isActive
                                ? "bg-green-900/30 text-green-400"
                                : "bg-red-900/30 text-red-400"
                            }`}
                          >
                            {rule.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="py-2 px-3 text-center text-text-secondary">
                          {rule.priority}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1 rounded text-text-secondary hover:text-accent-error hover:bg-background-hover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!rules[contract.id] || rules[contract.id].length === 0) && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-4 text-center text-text-tertiary"
                        >
                          No rules defined
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        {filteredContracts.length === 0 && (
          <div className="card text-center py-8 text-text-tertiary">
            No contracts yet. Create your first contract.
          </div>
        )}
      </div>

      {showContractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary border border-border rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-text-primary">Add Contract</h2>
              <button
                onClick={() => setShowContractModal(false)}
                className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-background-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleContractSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Client *
                </label>
                <select
                  value={contractForm.clientId}
                  onChange={(e) =>
                    setContractForm({ ...contractForm, clientId: e.target.value })
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
                  Contract Name *
                </label>
                <input
                  type="text"
                  value={contractForm.name}
                  onChange={(e) =>
                    setContractForm({ ...contractForm, name: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Description
                </label>
                <textarea
                  value={contractForm.description}
                  onChange={(e) =>
                    setContractForm({ ...contractForm, description: e.target.value })
                  }
                  className="input-field h-20"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowContractModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRuleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary border border-border rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-text-primary">Add Rule</h2>
              <button
                onClick={() => {
                  setShowRuleModal(false);
                  setSelectedContractId(null);
                }}
                className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-background-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRuleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, name: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Rule Type *
                  </label>
                  <select
                    value={ruleForm.type}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, type: e.target.value })
                    }
                    className="input-field"
                  >
                    <option value="FLAT">Flat Rate</option>
                    <option value="TIERED">Tiered Pricing</option>
                    <option value="MINIMUM">Minimum Charge</option>
                    <option value="DISCOUNT">Discount</option>
                    <option value="TIME_BASED_DISCOUNT">
                      Time-based Discount
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={ruleForm.priority}
                    onChange={(e) =>
                      setRuleForm({
                        ...ruleForm,
                        priority: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input-field"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={ruleForm.startDate}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, startDate: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={ruleForm.endDate}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, endDate: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Condition (JSON)
                </label>
                <textarea
                  value={ruleForm.condition}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, condition: e.target.value })
                  }
                  className="input-field h-24 font-mono text-sm"
                  placeholder='{"field": "units"}'
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Value (JSON)
                </label>
                <textarea
                  value={ruleForm.value}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, value: e.target.value })
                  }
                  className="input-field h-24 font-mono text-sm"
                  placeholder='{"rate": 100}'
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRuleModal(false);
                    setSelectedContractId(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContractsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ContractsPageContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}