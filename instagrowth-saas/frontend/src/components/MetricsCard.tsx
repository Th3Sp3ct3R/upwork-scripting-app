"use client";

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
}

export default function MetricsCard({ title, value, change, icon }: MetricsCardProps) {
  return (
    <div className="card-base flex items-start justify-between">
      <div>
        <p className="text-muted text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {change !== undefined && (
          <p className={`text-sm mt-1 ${change >= 0 ? "text-success" : "text-danger"}`}>
            {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
          </p>
        )}
      </div>
      <div className="text-2xl">{icon}</div>
    </div>
  );
}
