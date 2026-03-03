"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { mockAccounts, mockAudits } from "@/lib/mock-data";
import type { Account, ProfileAudit } from "@/lib/types";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [audits] = useState<ProfileAudit[]>(mockAudits);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getAccounts();
        setAccounts(res.accounts);
      } catch {
        setAccounts(mockAccounts);
      }
      setLoading(false);
    })();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Disconnect this account?")) return;
    setDeleting(id);
    try {
      await api.deleteAccount(id);
      setAccounts(accounts.filter(a => a.id !== id));
    } catch {
      setAccounts(accounts.filter(a => a.id !== id));
    }
    setDeleting(null);
  };

  const statusConfig = {
    online: { color: "bg-success", label: "Online", textColor: "text-success" },
    offline: { color: "bg-muted", label: "Offline", textColor: "text-muted" },
    "2fa_needed": { color: "bg-danger", label: "2FA Needed", textColor: "text-danger" },
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-muted text-sm">Manage your connected Instagram accounts</p>
        </div>
        <button className="btn-primary text-sm">+ Add Account</button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted">Loading accounts...</div>
      ) : (
        <div className="grid gap-4 mb-8">
          {accounts.map((acc) => {
            const st = statusConfig[acc.status];
            return (
              <div key={acc.id} className="card-base flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-brand/20 flex items-center justify-center text-xl font-bold text-brand-light flex-shrink-0">
                  {acc.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold">@{acc.username}</p>
                    <span className={`flex items-center gap-1 text-xs ${st.textColor}`}>
                      <span className={`w-2 h-2 rounded-full ${st.color}`} />
                      {st.label}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted">
                    <span>{acc.followers.toLocaleString()} followers</span>
                    <span>{acc.following.toLocaleString()} following</span>
                    <span>{acc.posts} posts</span>
                  </div>
                  {acc.lastSync && (
                    <p className="text-xs text-muted mt-1">Last sync: {new Date(acc.lastSync).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-xs rounded-lg border border-card-border text-muted hover:border-brand hover:text-brand transition-colors">
                    ↻ Refresh
                  </button>
                  <button className="px-3 py-1.5 text-xs rounded-lg border border-card-border text-muted hover:border-brand hover:text-brand transition-colors">
                    ⚙ Settings
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    disabled={deleting === acc.id}
                    className="px-3 py-1.5 text-xs rounded-lg border border-card-border text-muted hover:border-danger hover:text-danger transition-colors disabled:opacity-50"
                  >
                    {deleting === acc.id ? "..." : "✕ Disconnect"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile Audit Timeline */}
      <div className="card-base">
        <h3 className="text-sm font-semibold mb-6">📋 Profile Audit Timeline</h3>
        <div className="relative pl-8">
          <div className="absolute left-[7px] top-0 bottom-0 w-0.5 bg-card-border" />
          {audits.map((a, i) => (
            <div key={i} className="relative mb-6 last:mb-0">
              <div className="absolute -left-8 top-1 w-3.5 h-3.5 rounded-full border-2 border-brand bg-dark" />
              <p className="text-xs text-muted">{new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              <div className="mt-1">
                {a.type === "follower_delta" && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{(a.delta ?? 0) >= 0 ? "📈" : "📉"}</span>
                    <span className={`font-semibold ${(a.delta ?? 0) >= 0 ? "text-success" : "text-danger"}`}>
                      {(a.delta ?? 0) >= 0 ? "+" : ""}{a.delta} followers
                    </span>
                  </div>
                )}
                {a.type === "bio_change" && (
                  <div className="bg-dark rounded-lg p-3 mt-1 font-mono text-xs leading-relaxed">
                    <p className="text-danger line-through">{a.before}</p>
                    <p className="text-success">{a.after}</p>
                  </div>
                )}
                {a.type === "name_change" && (
                  <div className="bg-dark rounded-lg p-3 mt-1 font-mono text-xs">
                    <p className="text-danger line-through">{a.before}</p>
                    <p className="text-success">{a.after}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
