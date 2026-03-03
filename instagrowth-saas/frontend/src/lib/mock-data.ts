import { Account, Metric, AffinityTarget, AgentDuty, ProfileAudit } from "./types";

export const mockAccounts: Account[] = [
  { id: "1", username: "growthgod", status: "online", followers: 12450, following: 890, posts: 342, lastSync: "2026-03-03T13:00:00Z" },
  { id: "2", username: "brand_studio", status: "offline", followers: 5200, following: 412, posts: 128, lastSync: "2026-03-02T09:00:00Z" },
  { id: "3", username: "side_hustle", status: "2fa_needed", followers: 980, following: 220, posts: 45, lastSync: "2026-03-01T15:00:00Z" },
];

export const mockMetrics: Metric[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 1, 2 + i);
  return {
    date: d.toISOString().split("T")[0],
    followers: 11000 + Math.floor(i * 48 + Math.random() * 80),
    likes: 200 + Math.floor(Math.random() * 150),
    comments: 30 + Math.floor(Math.random() * 40),
    follows: 10 + Math.floor(Math.random() * 20),
  };
});

const clusters = ["Fitness", "Tech", "Travel", "Fashion", "Food"];
const tags = [["gym", "health"], ["coding", "startup"], ["wanderlust", "explore"], ["ootd", "style"], ["foodie", "recipe"]];

export const mockTargets: AffinityTarget[] = Array.from({ length: 20 }, (_, i) => {
  const ci = i % 5;
  return {
    id: `t${i}`,
    username: `user_${["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "theta", "iota", "kappa", "lambda", "mu", "nu", "xi", "omicron", "pi", "rho", "sigma", "tau", "upsilon", "phi"][i]}`,
    score: +(0.65 + Math.random() * 0.3).toFixed(2),
    cluster: clusters[ci],
    engagement: +(1.5 + Math.random() * 5).toFixed(1),
    followers: 500 + Math.floor(Math.random() * 50000),
    tags: tags[ci],
  };
});

export const mockDuties: AgentDuty[] = [
  { id: "d1", type: "follow", target: "user_alpha", status: "pending", scheduledAt: "2026-03-03T14:00:00Z", expectedOutcome: "High affinity (0.92), likely follow-back" },
  { id: "d2", type: "like", target: "user_beta", status: "pending", scheduledAt: "2026-03-03T14:05:00Z", expectedOutcome: "Engagement boost, story view expected" },
  { id: "d3", type: "comment", target: "user_gamma", status: "approved", scheduledAt: "2026-03-03T13:30:00Z", expectedOutcome: "Community building, shared audience", details: "Great shot! Love the composition 📸" },
  { id: "d4", type: "follow", target: "user_delta", status: "running", scheduledAt: "2026-03-03T13:00:00Z", expectedOutcome: "Niche alignment, mutual growth" },
  { id: "d5", type: "unfollow", target: "user_epsilon", status: "completed", completedAt: "2026-03-03T12:00:00Z", expectedOutcome: "Ratio optimization" },
  { id: "d6", type: "story_view", target: "user_zeta", status: "completed", completedAt: "2026-03-03T11:30:00Z", expectedOutcome: "Visibility, DM opportunity" },
  { id: "d7", type: "like", target: "user_theta", status: "failed", scheduledAt: "2026-03-03T12:30:00Z", expectedOutcome: "Rate limit hit, retrying in 1h" },
  { id: "d8", type: "follow", target: "user_iota", status: "paused", scheduledAt: "2026-03-03T15:00:00Z", expectedOutcome: "Awaiting cooldown period" },
];

export const mockAudits: ProfileAudit[] = [
  { date: "2026-03-03", type: "follower_delta", delta: 47 },
  { date: "2026-03-02", type: "bio_change", before: "Digital creator 🎨", after: "Digital creator 🎨 | Growth hacking" },
  { date: "2026-03-01", type: "follower_delta", delta: 32 },
  { date: "2026-02-28", type: "name_change", before: "Growth God", after: "Growth God ⚡" },
  { date: "2026-02-27", type: "follower_delta", delta: -5 },
];
