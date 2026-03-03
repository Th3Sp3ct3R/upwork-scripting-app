"use client";
import { useState, useEffect, useCallback } from "react";
import MetricsCard from "@/components/MetricsCard";
import { api } from "@/lib/api";
import { mockMetrics, mockDuties } from "@/lib/mock-data";
import type { Metric, AgentDuty } from "@/lib/types";

type Range = "7" | "30" | "90";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [duties, setDuties] = useState<AgentDuty[]>([]);
  const [range, setRange] = useState<Range>("30");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([api.getMetrics(range), api.getAgentDuties()]);
      setMetrics(mRes.metrics);
      setDuties(dRes.duties);
    } catch {
      const days = parseInt(range);
      setMetrics(mockMetrics.slice(-days));
      setDuties(mockDuties);
    }
    setLoading(false);
  }, [range]);

  useEffect(() => { loadData(); }, [loadData]);

  const latest = metrics[metrics.length - 1];
  const prev = metrics[metrics.length - 2];
  const followerGrowth = latest && prev ? (((latest.followers - prev.followers) / prev.followers) * 100) : 0;
  const totalLikes = metrics.reduce((s, m) => s + m.likes, 0);
  const totalComments = metrics.reduce((s, m) => s + m.comments, 0);
  const totalFollows = metrics.reduce((s, m) => s + m.follows, 0);

  const maxFollowers = Math.max(...metrics.map(m => m.followers), 1);
  const minFollowers = Math.min(...metrics.map(m => m.followers), 0);
  const fRange = maxFollowers - minFollowers || 1;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted text-sm">Your growth at a glance</p>
        </div>
        <div className="flex gap-1 bg-card rounded-lg p-1">
          {(["7", "30", "90"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${range === r ? "bg-brand text-white" : "text-muted hover:text-white"}`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricsCard title="Followers" value={latest?.followers?.toLocaleString() ?? "—"} change={+followerGrowth.toFixed(1)} icon="👥" />
        <MetricsCard title="Likes" value={totalLikes.toLocaleString()} icon="❤️" />
        <MetricsCard title="Comments" value={totalComments.toLocaleString()} icon="💬" />
        <MetricsCard title="New Follows" value={totalFollows.toLocaleString()} icon="➕" />
      </div>

      {/* Chart */}
      <div className="card-base mb-8">
        <h3 className="text-sm font-semibold mb-4">📈 Follower Growth</h3>
        {loading ? (
          <div className="h-48 flex items-center justify-center text-muted">Loading chart...</div>
        ) : (
          <div className="relative h-48">
            <svg viewBox={`0 0 ${metrics.length * 20} 200`} className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6c5ce7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6c5ce7" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`M0,200 ${metrics.map((m, i) => `L${i * 20},${200 - ((m.followers - minFollowers) / fRange) * 180}`).join(" ")} L${(metrics.length - 1) * 20},200 Z`}
                fill="url(#chartGrad)"
              />
              <polyline
                points={metrics.map((m, i) => `${i * 20},${200 - ((m.followers - minFollowers) / fRange) * 180}`).join(" ")}
                fill="none"
                stroke="#6c5ce7"
                strokeWidth="2"
              />
            </svg>
            <div className="flex justify-between text-xs text-muted mt-2">
              <span>{metrics[0]?.date}</span>
              <span>{metrics[metrics.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </div>

      {/* Agent Activity */}
      <div className="card-base">
        <h3 className="text-sm font-semibold mb-4">🤖 Agent Activity Log</h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {duties.map((d) => (
            <div key={d.id} className="flex items-center gap-3 p-3 bg-dark rounded-lg">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                d.status === "running" ? "bg-success animate-pulse" :
                d.status === "completed" ? "bg-success" :
                d.status === "pending" ? "bg-warning" :
                d.status === "failed" ? "bg-danger" : "bg-muted"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  <span className="capitalize">{d.type.replace("_", " ")}</span> → @{d.target}
                </p>
                <p className="text-xs text-muted">{d.expectedOutcome}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                d.status === "running" ? "bg-success/20 text-success" :
                d.status === "completed" ? "bg-success/10 text-success" :
                d.status === "pending" ? "bg-warning/20 text-warning" :
                d.status === "failed" ? "bg-danger/20 text-danger" :
                "bg-muted/20 text-muted"
              }`}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
