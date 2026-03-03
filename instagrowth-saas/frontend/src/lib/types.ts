export interface Account {
  id: string;
  username: string;
  avatar?: string;
  status: "online" | "offline" | "2fa_needed";
  followers: number;
  following: number;
  posts: number;
  lastSync?: string;
}

export interface Metric {
  date: string;
  followers: number;
  likes: number;
  comments: number;
  follows: number;
}

export interface AffinityTarget {
  id: string;
  username: string;
  avatar?: string;
  score: number;
  cluster: string;
  engagement: number;
  followers: number;
  tags: string[];
}

export interface AgentDuty {
  id: string;
  type: "follow" | "like" | "comment" | "unfollow" | "story_view";
  target: string;
  status: "pending" | "approved" | "running" | "paused" | "completed" | "failed";
  scheduledAt?: string;
  completedAt?: string;
  expectedOutcome?: string;
  details?: string;
}

export interface ProfileAudit {
  date: string;
  type: "bio_change" | "follower_delta" | "avatar_change" | "name_change";
  before?: string;
  after?: string;
  delta?: number;
}

export interface VibeAnalysis {
  aesthetic: string;
  audience: string;
  contentStyle: string;
  growthPotential: number;
  recommendations: string[];
}
