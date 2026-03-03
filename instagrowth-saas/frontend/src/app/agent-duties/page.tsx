"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { mockDuties } from "@/lib/mock-data";
import type { AgentDuty } from "@/lib/types";

type Tab = "pending" | "active" | "history";

const typeIcons: Record<string, string> = {
  follow: "👤",
  like: "❤️",
  comment: "💬",
  unfollow: "👋",
  story_view: "👁️",
};

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-warning/20", text: "text-warning", label: "Pending" },
  approved: { bg: "bg-brand/20", text: "text-brand-light", label: "Approved" },
  running: { bg: "bg-success/20", text: "text-success", label: "Running" },
  paused: { bg: "bg-muted/20", text: "text-muted", label: "Paused" },
  completed: { bg: "bg-success/10", text: "text-success", label: "Completed" },
  failed: { bg: "bg-danger/20", text: "text-danger", label: "Failed" },
};

export default function AgentDutiesPage() {
  const [duties, setDuties] = useState<AgentDuty[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getAgentDuties();
        setDuties(res.duties);
      } catch {
        setDuties(mockDuties);
      }
      setLoading(false);
    })();
  }, []);

  const handleApprove = async (id: string) => {
    setActing(id);
    try { await api.approveDuty(id); } catch { /* mock */ }
    setDuties(duties.map(d => d.id === id ? { ...d, status: "approved" } : d));
    setActing(null);
  };

  const handleDeny = async (id: string) => {
    setActing(id);
    try { await api.denyDuty(id); } catch { /* mock */ }
    setDuties(duties.map(d => d.id === id ? { ...d, status: "paused" } : d));
    setActing(null);
  };

  const filtered = duties.filter(d => {
    if (tab === "pending") return d.status === "pending";
    if (tab === "active") return ["approved", "running"].includes(d.status);
    return ["completed", "failed", "paused"].includes(d.status);
  });

  const pendingCount = duties.filter(d => d.status === "pending").length;
  const activeCount = duties.filter(d => ["approved", "running"].includes(d.status)).length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Agent Duties</h1>
          <p className="text-muted text-sm">Review and manage automated actions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setDuties(duties.map(d => d.status === "pending" ? { ...d, status: "approved" } : d)); }}
            className="btn-primary text-sm py-2"
            disabled={pendingCount === 0}
          >
            ✓ Approve All ({pendingCount})
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-lg p-1 mb-6 w-fit">
        {([
          ["pending", `Pending (${pendingCount})`],
          ["active", `Active (${activeCount})`],
          ["history", "History"],
        ] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${tab === t ? "bg-brand text-white" : "text-muted hover:text-white"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted">Loading duties...</div>
      ) : filtered.length === 0 ? (
        <div className="card-base text-center py-16">
          <p className="text-4xl mb-4">{tab === "pending" ? "🎉" : tab === "active" ? "😴" : "📋"}</p>
          <p className="text-muted">{tab === "pending" ? "No pending tasks! All caught up." : tab === "active" ? "No active tasks running." : "No history yet."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const st = statusConfig[d.status];
            const isExpanded = expanded === d.id;
            return (
              <div key={d.id} className="card-base">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{typeIcons[d.type] || "⚙️"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm capitalize">{d.type.replace("_", " ")}</p>
                      <span className="text-muted">→</span>
                      <p className="text-sm text-brand-light">@{d.target}</p>
                    </div>
                    <p className="text-xs text-muted">{d.expectedOutcome}</p>
                    {d.scheduledAt && (
                      <p className="text-xs text-muted mt-0.5">
                        Scheduled: {new Date(d.scheduledAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`${st.bg} ${st.text} text-xs px-2.5 py-1 rounded-full font-medium`}>
                      {d.status === "running" && <span className="inline-block w-1.5 h-1.5 bg-success rounded-full animate-pulse mr-1.5 align-middle" />}
                      {st.label}
                    </span>
                    {d.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(d.id)}
                          disabled={acting === d.id}
                          className="px-3 py-1.5 text-xs rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors disabled:opacity-50"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleDeny(d.id)}
                          disabled={acting === d.id}
                          className="px-3 py-1.5 text-xs rounded-lg bg-danger/20 text-danger hover:bg-danger/30 transition-colors disabled:opacity-50"
                        >
                          ✕ Deny
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : d.id)}
                      className="text-muted hover:text-white transition-colors text-sm"
                    >
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-card-border grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-muted mb-1">Task ID</p>
                      <p className="font-mono">{d.id}</p>
                    </div>
                    <div>
                      <p className="text-muted mb-1">Type</p>
                      <p className="capitalize">{d.type.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-muted mb-1">Target</p>
                      <p>@{d.target}</p>
                    </div>
                    <div>
                      <p className="text-muted mb-1">Expected Outcome</p>
                      <p>{d.expectedOutcome}</p>
                    </div>
                    {d.details && (
                      <div className="col-span-2">
                        <p className="text-muted mb-1">Details</p>
                        <p className="bg-dark p-2 rounded">{d.details}</p>
                      </div>
                    )}
                    {d.completedAt && (
                      <div>
                        <p className="text-muted mb-1">Completed</p>
                        <p>{new Date(d.completedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
