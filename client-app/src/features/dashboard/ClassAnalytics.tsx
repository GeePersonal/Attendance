import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import agent from "../../app/api/agent";
import AppLoading from "../../app/components/AppLoading";
import { ClassAnalytics, ClassAttendeeAnalytics, SessionAnalytics, SessionAttendeeDetail } from "../../app/models/analytics";
import { format, formatDistanceToNow } from "date-fns";

export default function ClassAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<keyof ClassAttendeeAnalytics>("attendancePercentage");
  const [sortAsc, setSortAsc] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [sessionAnalyticsCache, setSessionAnalyticsCache] = useState<Record<string, SessionAnalytics>>({});
  const [sessionAnalyticsLoading, setSessionAnalyticsLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const result = await agent.Analytics.getClass(id!);
        setData(result);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetch();
  }, [id]);

  if (loading) return <AppLoading text="Loading class analytics..." />;
  if (!data) return null;

  const handleSort = (field: keyof ClassAttendeeAnalytics) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const handleToggleSession = async (sessionId: string) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }
    setExpandedSessionId(sessionId);
    if (sessionAnalyticsCache[sessionId]) return;
    try {
      setSessionAnalyticsLoading(sessionId);
      const result = await agent.Analytics.getSession(sessionId);
      setSessionAnalyticsCache((prev) => ({ ...prev, [sessionId]: result }));
    } catch (error) {
      console.log(error);
    } finally {
      setSessionAnalyticsLoading(null);
    }
  };

  const filteredAttendees = data.attendeeBreakdown
    .filter((a) => {
      const term = search.toLowerCase();
      return (
        !term ||
        a.firstName.toLowerCase().includes(term) ||
        a.lastName.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term) ||
        (a.matNumber ?? "").toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const av = a[sortField] as any;
      const bv = b[sortField] as any;
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

  const rateColor = (pct: number) =>
    pct >= 75 ? "text-green-400" : pct >= 50 ? "text-yellow-400" : "text-red-400";
  const barColor = (pct: number) =>
    pct >= 75 ? "bg-green-500/70" : pct >= 50 ? "bg-yellow-500/70" : "bg-red-500/70";

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-10 w-full">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link
            to={`/user-profile/classes/${data.classId}`}
            className="text-neutral-500 hover:text-white text-sm transition-colors"
          >
            ← Back to Class
          </Link>
          <h1 className="text-3xl font-light text-white tracking-wide mt-2">{data.className}</h1>
          {data.description && <p className="text-neutral-500 mt-1 text-sm">{data.description}</p>}
          <p className="text-neutral-600 text-xs mt-1 tracking-wide uppercase">Class Analytics</p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Sessions" value={data.totalSessions} />
        <StatCard label="Unique Students" value={data.totalUniqueAttendees} />
        <StatCard label="Avg / Session" value={data.averageAttendeesPerSession} />
        <StatCard label="Best Session" value={data.maxAttendeesInSession} />
        <StatCard label="Lowest Session" value={data.minAttendeesInSession} />
        <StatCard
          label="Overall Rate"
          value={`${data.overallAttendanceRate}%`}
          accent={data.overallAttendanceRate >= 75 ? "green" : data.overallAttendanceRate >= 50 ? "yellow" : "red"}
        />
      </div>

      {/* ── ATTENDANCE REGISTER MATRIX ── */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-white font-light text-lg">Attendance Register</h2>
            <p className="text-neutral-500 text-xs mt-0.5">
              Each row = one student · Each column = one session · ✓ = present · — = absent
            </p>
          </div>
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 w-56"
          />
        </div>

        {filteredAttendees.length === 0 ? (
          <p className="text-neutral-500 text-sm p-6">No students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left" style={{ minWidth: `${240 + data.sessionBreakdown.length * 80}px` }}>
              <thead>
                <tr className="border-b border-white/10 text-neutral-500 text-xs uppercase tracking-widest">
                  {/* Student column */}
                  <th className="sticky left-0 z-10 bg-[#0a0a0a] py-3 px-4 min-w-[220px]">
                    <button onClick={() => handleSort("lastName")} className="flex items-center gap-1 hover:text-white transition-colors">
                      Student {sortField === "lastName" ? (sortAsc ? "↑" : "↓") : "↕"}
                    </button>
                  </th>
                  {/* Session columns */}
                  {data.sessionBreakdown.map((s, i) => (
                    <th key={s.sessionId} className="py-3 px-3 text-center min-w-[80px]">
                      <Link
                        to={`/user-profile/session-details/${s.sessionId}`}
                        className="hover:text-white transition-colors flex flex-col items-center gap-0.5"
                        title={s.sessionName}
                      >
                        <span>S{i + 1}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                            s.status === "Active"
                              ? "text-green-400 border-green-400/20 bg-green-400/10"
                              : "text-neutral-600 border-white/10"
                          }`}
                        >
                          {s.status === "Active" ? "Live" : format(new Date(s.createdAt), "d MMM")}
                        </span>
                      </Link>
                    </th>
                  ))}
                  {/* Summary columns */}
                  <th className="py-3 px-4 text-center">
                    <button onClick={() => handleSort("sessionsAttended")} className="flex items-center gap-1 hover:text-white transition-colors mx-auto">
                      Attended {sortField === "sessionsAttended" ? (sortAsc ? "↑" : "↓") : "↕"}
                    </button>
                  </th>
                  <th className="py-3 px-4 text-center">
                    <button onClick={() => handleSort("attendancePercentage")} className="flex items-center gap-1 hover:text-white transition-colors mx-auto">
                      Rate {sortField === "attendancePercentage" ? (sortAsc ? "↑" : "↓") : "↕"}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAttendees.map((a, ri) => {
                  const pct = a.attendancePercentage;
                  const attendedSet = new Set(a.attendedSessionIds);
                  return (
                    <tr key={ri} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name + details */}
                      <td className="sticky left-0 z-10 bg-[#0a0a0a] py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs text-white font-medium shrink-0">
                            {a.firstName.charAt(0)}{a.lastName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{a.firstName} {a.lastName}</p>
                            <p className="text-neutral-500 text-xs truncate">{a.email}</p>
                            {a.matNumber && <p className="text-neutral-600 text-xs">{a.matNumber}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Present/absent cells */}
                      {data.sessionBreakdown.map((s) => {
                        const present = attendedSet.has(s.sessionId);
                        return (
                          <td key={s.sessionId} className="py-3 px-3 text-center">
                            {present ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-500/15 border border-green-500/25 text-green-400 text-sm">
                                ✓
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/10 border border-red-500/15 text-red-900 text-xs">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                      {/* Count */}
                      <td className="py-3 px-4 text-center">
                        <span className="text-neutral-300 font-medium">
                          {a.sessionsAttended}
                          <span className="text-neutral-600 font-normal">/{a.totalSessions}</span>
                        </span>
                      </td>
                      {/* Rate bar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 justify-center min-w-[100px]">
                          <div className="w-16 bg-white/5 rounded-full h-1.5">
                            <div
                              className={`${barColor(pct)} h-1.5 rounded-full transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`${rateColor(pct)} text-xs font-medium w-10 text-right`}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer: per-session totals */}
              <tfoot>
                <tr className="border-t border-white/10 text-neutral-500 text-xs">
                  <td className="sticky left-0 z-10 bg-[#0a0a0a] py-3 px-4 uppercase tracking-widest font-medium">
                    Total Present
                  </td>
                  {data.sessionBreakdown.map((s) => (
                    <td key={s.sessionId} className="py-3 px-3 text-center text-white font-medium">
                      {s.attendeesCount}
                    </td>
                  ))}
                  <td className="py-3 px-4 text-center text-white font-medium">
                    {data.attendeeBreakdown.reduce((sum, a) => sum + a.sessionsAttended, 0)}
                  </td>
                  <td className="py-3 px-4 text-center text-neutral-400">
                    {data.overallAttendanceRate}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Session Breakdown — expandable inline analytics */}
      <div>
        <h2 className="text-white font-light text-lg mb-4">Sessions</h2>
        <div className="space-y-3">
          {data.sessionBreakdown.map((s, i) => {
            const pct = data.totalUniqueAttendees > 0
              ? Math.round((s.attendeesCount / data.totalUniqueAttendees) * 100)
              : 0;
            const isExpanded = expandedSessionId === s.sessionId;
            const sessionData = sessionAnalyticsCache[s.sessionId] ?? null;
            const isLoadingThis = sessionAnalyticsLoading === s.sessionId;

            return (
              <div key={s.sessionId} className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
                {/* Row header — click to expand */}
                <button
                  onClick={() => handleToggleSession(s.sessionId)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors text-left"
                >
                  <span className="text-neutral-600 text-xs w-8 shrink-0">S{i + 1}</span>
                  <span className="text-neutral-300 text-sm truncate flex-1 font-medium" title={s.sessionName}>
                    {s.sessionName}
                  </span>
                  <span className="text-neutral-600 text-xs shrink-0 hidden sm:block">
                    {format(new Date(s.createdAt), "d MMM yyyy")}
                  </span>
                  <div className="w-24 bg-white/5 rounded-full h-1.5 shrink-0 hidden md:block">
                    <div className="bg-white/50 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-neutral-400 text-xs shrink-0">
                    {s.attendeesCount} / {data.totalUniqueAttendees}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                    s.status === "Active"
                      ? "text-green-400 border-green-400/20 bg-green-400/10"
                      : "text-neutral-500 border-white/10 bg-white/5"
                  }`}>
                    {s.status}
                  </span>
                  <svg
                    className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded inline session analytics */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-6 space-y-6">
                    {isLoadingThis ? (
                      <div className="flex items-center justify-center py-8 gap-3 text-neutral-500 text-sm">
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Loading session analytics…
                      </div>
                    ) : sessionData ? (
                      <InlineSessionAnalytics data={sessionData} />
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: "green" | "yellow" | "red" }) {
  const color = accent === "green" ? "text-green-400" : accent === "yellow" ? "text-yellow-400" : accent === "red" ? "text-red-400" : "text-white";
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
      <span className={`text-2xl font-light ${color}`}>{value}</span>
      <span className="text-neutral-500 text-xs tracking-wide uppercase">{label}</span>
    </div>
  );
}

// ── Inline session analytics panel ───────────────────────────────────────────

function InlineSessionAnalytics({ data }: { data: SessionAnalytics }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof SessionAttendeeDetail>("joinOrder");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: keyof SessionAttendeeDetail) => {
    if (sortField === field) setSortAsc(a => !a);
    else { setSortField(field); setSortAsc(true); }
  };

  const filtered = data.attendees
    .filter(a => {
      const q = search.toLowerCase();
      return (
        a.firstName.toLowerCase().includes(q) ||
        a.lastName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.matNumber.toLowerCase().includes(q) ||
        (a.scanLocationName ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      return sortAsc
        ? String(av).localeCompare(String(bv), undefined, { numeric: true })
        : String(bv).localeCompare(String(av), undefined, { numeric: true });
    });

  const maxCount = data.attendeesOverTime.length > 0
    ? Math.max(...data.attendeesOverTime.map(d => d.cumulativeCount), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SmallStat label="Total attendees" value={data.totalAttendees} />
        <SmallStat
          label="Avg join interval"
          value={data.averageJoinIntervalMinutes > 0 ? `${data.averageJoinIntervalMinutes.toFixed(1)} min` : "—"}
        />
        <SmallStat label="Created" value={format(new Date(data.createdAt), "d MMM yyyy, HH:mm")} />
        <SmallStat
          label="Expires"
          value={data.sessionExpiresAt ? formatDistanceToNow(new Date(data.sessionExpiresAt), { addSuffix: true }) : "—"}
        />
      </div>

      {/* Charts row */}
      {(data.attendeesByScanLocation.length > 0 || data.attendeesOverTime.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Scan location breakdown */}
          {data.attendeesByScanLocation.length > 0 && (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-3">
              <p className="text-neutral-500 text-xs tracking-wide uppercase">By Scan Location</p>
              {data.attendeesByScanLocation.map(loc => (
                <div key={loc.location} className="space-y-1">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>{loc.location}</span>
                    <span>{loc.count} ({loc.percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-white/50 rounded-full" style={{ width: `${loc.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cumulative chart */}
          {data.attendeesOverTime.length > 0 && (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
              <p className="text-neutral-500 text-xs tracking-wide uppercase mb-3">Attendance Over Time</p>
              <div className="flex items-end gap-1 h-20">
                {data.attendeesOverTime.map((pt, idx) => {
                  const h = Math.max(4, Math.round((pt.cumulativeCount / maxCount) * 80));
                  return (
                    <div
                      key={idx}
                      className="flex-1 bg-white/25 hover:bg-white/50 rounded-sm transition-colors relative group"
                      style={{ height: `${h}px` }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black border border-white/10 rounded px-1.5 py-0.5 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        {pt.cumulativeCount} @ {format(new Date(pt.time), "HH:mm")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendee table */}
      {data.attendees.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-neutral-500 text-xs tracking-wide uppercase">Attendees ({data.attendees.length})</p>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search attendees…"
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white placeholder-neutral-600 outline-none focus:border-white/30 w-48"
            />
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-neutral-500 text-xs uppercase tracking-wide">
                  <InlineTh label="#" field="joinOrder" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                  <InlineTh label="Name" field="firstName" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                  <th className="px-4 py-3 text-left font-normal">Email</th>
                  <th className="px-4 py-3 text-left font-normal">MAT</th>
                  <th className="px-4 py-3 text-left font-normal">Location</th>
                  <InlineTh label="Joined" field="joinedAt" sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.email + a.joinOrder} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-neutral-500 text-xs">{a.joinOrder}</td>
                    <td className="px-4 py-3 text-neutral-300">{a.firstName} {a.lastName}</td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">{a.email}</td>
                    <td className="px-4 py-3 text-neutral-500 text-xs">{a.matNumber}</td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">{a.scanLocationName ?? "—"}</td>
                    <td className="px-4 py-3 text-neutral-500 text-xs whitespace-nowrap">
                      {format(new Date(a.joinedAt), "HH:mm:ss")}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-neutral-600 text-sm">No attendees match.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-white text-xl font-light">{value}</span>
      <span className="text-neutral-600 text-xs tracking-wide uppercase">{label}</span>
    </div>
  );
}

function InlineTh({
  label, field, sortField, sortAsc, onSort,
}: {
  label: string;
  field: keyof SessionAttendeeDetail;
  sortField: keyof SessionAttendeeDetail;
  sortAsc: boolean;
  onSort: (f: keyof SessionAttendeeDetail) => void;
}) {
  const active = sortField === field;
  return (
    <th
      className="px-4 py-3 text-left font-normal cursor-pointer select-none hover:text-white transition-colors"
      onClick={() => onSort(field)}
    >
      {label}{active ? (sortAsc ? " ↑" : " ↓") : ""}
    </th>
  );
}

