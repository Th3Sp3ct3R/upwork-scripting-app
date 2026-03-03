"use client";
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { mockTargets } from "@/lib/mock-data";
import type { AffinityTarget } from "@/lib/types";

const clusterColors: Record<string, string> = {
  Fitness: "#00b894",
  Tech: "#6c5ce7",
  Travel: "#74b9ff",
  Fashion: "#e17055",
  Food: "#fdcb6e",
};

export default function AffinityPage() {
  const [targets, setTargets] = useState<AffinityTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggressiveness, setAggressiveness] = useState(50);
  const [confidenceScore] = useState(78);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const loadTargets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAffinityTargets();
      setTargets(res.targets);
    } catch {
      setTargets(mockTargets);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTargets(); }, [loadTargets]);

  const clusters = [...new Set(targets.map(t => t.cluster))];
  const filtered = selectedCluster ? targets.filter(t => t.cluster === selectedCluster) : targets;

  const handleSliderChange = async (val: number) => {
    setAggressiveness(val);
    try { await api.adjustAffinity(val); } catch { /* mock mode */ }
  };

  // Gauge arc
  const gaugeAngle = (confidenceScore / 100) * 180;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-1">Affinity Engine</h1>
      <p className="text-muted text-sm mb-8">Understand and reach your ideal audience</p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Confidence Gauge */}
        <div className="card-base flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-4 self-start">🎯 Audience Confidence</h3>
          <div className="relative w-40 h-24 mb-2">
            <svg viewBox="0 0 200 110" className="w-full">
              <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke="#1e1e2e" strokeWidth="14" strokeLinecap="round" />
              <path
                d="M20,100 A80,80 0 0,1 180,100"
                fill="none"
                stroke="#6c5ce7"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${(gaugeAngle / 180) * 251} 251`}
              />
            </svg>
            <div className="absolute inset-0 flex items-end justify-center pb-0">
              <span className="text-3xl font-extrabold">{confidenceScore}%</span>
            </div>
          </div>
          <p className="text-xs text-muted">How well we understand your audience</p>
        </div>

        {/* Cluster Viz */}
        <div className="card-base">
          <h3 className="text-sm font-semibold mb-4">🧬 Audience Clusters</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedCluster(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!selectedCluster ? "bg-brand text-white" : "bg-dark text-muted hover:text-white"}`}
            >
              All
            </button>
            {clusters.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCluster(c === selectedCluster ? null : c)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedCluster === c ? "text-white" : "text-muted hover:text-white"}`}
                style={{ backgroundColor: selectedCluster === c ? clusterColors[c] : "#0a0a0f", borderColor: clusterColors[c], borderWidth: 1 }}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative h-36 bg-dark rounded-lg overflow-hidden">
            {targets.slice(0, 12).map((t, i) => (
              <div
                key={t.id}
                className="absolute rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer hover:scale-125 transition-transform"
                style={{
                  width: 20 + t.score * 25,
                  height: 20 + t.score * 25,
                  left: `${10 + (i % 4) * 23}%`,
                  top: `${10 + Math.floor(i / 4) * 30}%`,
                  backgroundColor: clusterColors[t.cluster] + "40",
                  border: `2px solid ${clusterColors[t.cluster]}`,
                  opacity: selectedCluster && t.cluster !== selectedCluster ? 0.2 : 1,
                }}
                title={`@${t.username} (${t.cluster})`}
              >
                {t.username.slice(5, 7)}
              </div>
            ))}
          </div>
        </div>

        {/* Optimization Slider */}
        <div className="card-base">
          <h3 className="text-sm font-semibold mb-4">⚡ Automation Aggressiveness</h3>
          <div className="flex justify-between text-xs text-muted mb-2">
            <span>Conservative</span>
            <span>Aggressive</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={aggressiveness}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full accent-brand"
          />
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-brand">{aggressiveness}%</span>
          </div>
          <div className="mt-4 space-y-2 text-xs text-muted">
            <div className="flex justify-between"><span>Actions/day</span><span className="text-gray-300">{Math.round(500 + aggressiveness * 15)}</span></div>
            <div className="flex justify-between"><span>Risk level</span><span className={aggressiveness > 70 ? "text-danger" : aggressiveness > 40 ? "text-warning" : "text-success"}>{aggressiveness > 70 ? "High" : aggressiveness > 40 ? "Medium" : "Low"}</span></div>
            <div className="flex justify-between"><span>Est. daily growth</span><span className="text-gray-300">+{Math.round(20 + aggressiveness * 0.8)}</span></div>
          </div>
        </div>
      </div>

      {/* Sparklines / Trend section */}
      <div className="card-base mb-8">
        <h3 className="text-sm font-semibold mb-4">📊 Engagement Trends</h3>
        <div className="space-y-0">
          {clusters.map(c => {
            const clusterTargets = targets.filter(t => t.cluster === c);
            const avgEng = clusterTargets.reduce((s, t) => s + Number(t.engagement), 0) / (clusterTargets.length || 1);
            const sparkData = Array.from({ length: 20 }, () => Math.random() * 5 + avgEng - 2);
            const max = Math.max(...sparkData);
            const min = Math.min(...sparkData);
            const range = max - min || 1;
            return (
              <div key={c} className="flex items-center gap-4 py-3 border-b border-card-border last:border-0">
                <span className="w-16 text-xs font-medium" style={{ color: clusterColors[c] }}>{c}</span>
                <div className="flex-1 h-8">
                  <svg viewBox="0 0 200 30" className="w-full h-full" preserveAspectRatio="none">
                    <polyline
                      points={sparkData.map((v, i) => `${i * 10.5},${28 - ((v - min) / range) * 24}`).join(" ")}
                      fill="none"
                      stroke={clusterColors[c]}
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <span className="w-12 text-right text-sm font-semibold">{avgEng.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Discovery Table */}
      <div className="card-base">
        <h3 className="text-sm font-semibold mb-4">🔍 Recommended Targets ({filtered.length})</h3>
        {loading ? (
          <div className="text-center py-10 text-muted">Loading targets...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted border-b border-card-border">
                  <th className="text-left py-2 font-medium">Username</th>
                  <th className="text-left py-2 font-medium">Cluster</th>
                  <th className="text-right py-2 font-medium">Affinity</th>
                  <th className="text-right py-2 font-medium">Engagement</th>
                  <th className="text-right py-2 font-medium">Followers</th>
                  <th className="text-left py-2 font-medium">Tags</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-card-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-medium">@{t.username}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: clusterColors[t.cluster] + "20", color: clusterColors[t.cluster] }}>
                        {t.cluster}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-dark rounded-full overflow-hidden">
                          <div className="h-full bg-brand rounded-full" style={{ width: `${t.score * 100}%` }} />
                        </div>
                        <span className="text-xs w-8">{(t.score * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-success">{t.engagement}%</td>
                    <td className="py-3 text-right text-muted">{t.followers.toLocaleString()}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        {t.tags.map(tag => (
                          <span key={tag} className="text-xs text-muted bg-dark px-2 py-0.5 rounded">#{tag}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
