import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import agent from "../../app/api/agent";
import AppLoading from "../../app/components/AppLoading";
import { OverallAnalytics, DailyActivity } from "../../app/models/analytics";
import { format } from "date-fns";

export default function OverallAnalyticsPage() {
  const [data, setData] = useState<OverallAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const result = await agent.Analytics.getOverall();
        setData(result);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <AppLoading text="Loading analytics..." />;
  if (!data) return null;

  const maxAttendees = Math.max(...(data.dailySessionActivity.map((d) => d.attendeesRecorded)), 1);
  const maxSessions = Math.max(...(data.dailySessionActivity.map((d) => d.sessionsCreated)), 1);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-10 w-full">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link
            to="/user-profile/session-history"
            className="text-neutral-500 hover:text-white text-sm transition-colors"
          >
            ← Back to History
          </Link>
          <h1 className="text-3xl font-light text-white tracking-wide mt-2">Overall Analytics</h1>
          <p className="text-neutral-500 mt-1 text-sm tracking-wide">
            Aggregate view across all your sessions and classes
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Sessions" value={data.totalSessions} />
        <StatCard label="Active Sessions" value={data.activeSessions} accent="green" />
        <StatCard label="Expired Sessions" value={data.expiredSessions} accent="red" />
        <StatCard label="Total Classes" value={data.totalClasses} />
        <StatCard label="Total Attendees" value={data.totalAttendees} />
        <StatCard label="Avg / Session" value={data.averageAttendeesPerSession} />
      </div>

      {/* Last 7 / 30 days */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Sessions (7d)" value={data.sessionsLast7Days} />
        <StatCard label="Sessions (30d)" value={data.sessionsLast30Days} />
        <StatCard label="Attendees (7d)" value={data.attendeesLast7Days} />
        <StatCard label="Attendees (30d)" value={data.attendeesLast30Days} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Attendees Bar Chart */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-light text-lg mb-6">Daily Attendees (Last 30 Days)</h2>
          <BarChart data={data.dailySessionActivity} field="attendeesRecorded" max={maxAttendees} color="bg-white/70" />
        </div>
        {/* Daily Sessions Bar Chart */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-light text-lg mb-6">Daily Sessions Created (Last 30 Days)</h2>
          <BarChart data={data.dailySessionActivity} field="sessionsCreated" max={maxSessions} color="bg-white/40" />
        </div>
      </div>

      {/* Top Sessions */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-light text-lg mb-6">Top Sessions by Attendees</h2>
        {data.topSessionsByAttendees.length === 0 ? (
          <p className="text-neutral-500 text-sm">No sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {data.topSessionsByAttendees.map((s) => {
              const pct = Math.round((s.attendeesCount / (data.topSessionsByAttendees[0]?.attendeesCount || 1)) * 100);
              return (
                <div key={s.sessionId} className="flex items-center gap-4">
                  <Link
                    to={`/user-profile/session-details/${s.sessionId}`}
                    className="w-44 truncate text-sm text-neutral-300 hover:text-white transition-colors shrink-0"
                  >
                    {s.sessionName}
                  </Link>
                  <div className="flex-1 bg-white/5 rounded-full h-2">
                    <div
                      className="bg-white/60 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm text-neutral-400 shrink-0">{s.attendeesCount}</span>
                  <Link
                    to={`/user-profile/analytics/session/${s.sessionId}`}
                    className="text-xs text-neutral-500 hover:text-white transition-colors shrink-0"
                  >
                    Analytics →
                  </Link>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                      s.status === "Active"
                        ? "text-green-400 border-green-400/20 bg-green-400/10"
                        : "text-neutral-500 border-white/10 bg-white/5"
                    }`}
                  >
                    {s.status}
                  </span>
                  {s.className && (
                    <span className="text-xs text-neutral-500 shrink-0 max-w-[120px] truncate">{s.className}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "green" | "red";
}) {
  const valueColor =
    accent === "green"
      ? "text-green-400"
      : accent === "red"
      ? "text-red-400"
      : "text-white";
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
      <span className={`text-2xl font-light ${valueColor}`}>{value}</span>
      <span className="text-neutral-500 text-xs tracking-wide uppercase">{label}</span>
    </div>
  );
}

function BarChart({
  data,
  field,
  max,
  color,
}: {
  data: DailyActivity[];
  field: keyof DailyActivity;
  max: number;
  color: string;
}) {
  if (data.length === 0) {
    return <p className="text-neutral-500 text-sm">No data in the last 30 days.</p>;
  }
  return (
    <div className="flex items-end gap-1 h-32 w-full">
      {data.map((d) => {
        const val = d[field] as number;
        const pct = max > 0 ? Math.round((val / max) * 100) : 0;
        return (
          <div
            key={d.date}
            className="flex-1 flex flex-col items-center gap-1 group relative"
            title={`${d.date}: ${val}`}
          >
            <div className="w-full rounded-sm flex flex-col justify-end" style={{ height: "100%" }}>
              <div
                className={`${color} rounded-sm transition-all duration-500`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
            {/* Tooltip on hover */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-black/90 border border-white/10 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {format(new Date(d.date), "MMM d")}: {val}
            </div>
          </div>
        );
      })}
    </div>
  );
}
