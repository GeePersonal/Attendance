import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import agent from "../../app/api/agent";
import AppLoading from "../../app/components/AppLoading";
import { SessionAnalytics, AttendanceOverTime, SessionAttendeeDetail } from "../../app/models/analytics";
import { format, formatDistanceToNow } from "date-fns";

export default function SessionAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SessionAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof SessionAttendeeDetail>("joinOrder");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const result = await agent.Analytics.getSession(id!);
        setData(result);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetch();
  }, [id]);

  if (loading) return <AppLoading text="Loading session analytics..." />;
  if (!data) return null;

  const isActive = data.status === "Active";
  const maxCumulative = Math.max(...data.attendeesOverTime.map((t) => t.cumulativeCount), 1);

  const handleSort = (field: keyof SessionAttendeeDetail) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const filteredAttendees = data.attendees
    .filter((a) => {
      const term = search.toLowerCase();
      return (
        !term ||
        a.firstName.toLowerCase().includes(term) ||
        a.lastName.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term) ||
        (a.matNumber ?? "").toLowerCase().includes(term) ||
        (a.scanLocationName ?? "").toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const av = a[sortField] as any;
      const bv = b[sortField] as any;
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link
            to={`/user-profile/session-details/${data.sessionId}`}
            className="text-neutral-500 hover:text-white text-sm transition-colors"
          >
            ← Back to Session
          </Link>
          <h1 className="text-3xl font-light text-white tracking-wide mt-2">{data.sessionName}</h1>
          {data.className && (
            <p className="text-neutral-500 text-sm mt-1">
              Class:{" "}
              <Link to={`/user-profile/classes/${data.classId}`} className="text-neutral-300 hover:text-white transition-colors">
                {data.className}
              </Link>
            </p>
          )}
        </div>
        <span className={`self-start text-xs px-3 py-1.5 rounded-full border mt-1 ${
          isActive ? "text-green-400 border-green-400/20 bg-green-400/10" : "text-neutral-500 border-white/10 bg-white/5"
        }`}>
          {data.status}
        </span>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
          <span className="text-3xl font-light text-white">{data.totalAttendees}</span>
          <span className="text-neutral-500 text-xs tracking-wide uppercase">Total Attendees</span>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
          <span className="text-2xl font-light text-white">
            {data.averageJoinIntervalMinutes > 0 ? `${data.averageJoinIntervalMinutes} min` : "—"}
          </span>
          <span className="text-neutral-500 text-xs tracking-wide uppercase">Avg Join Interval</span>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
          <span className="text-lg font-light text-white">{format(new Date(data.createdAt), "d MMM yyyy, HH:mm")}</span>
          <span className="text-neutral-500 text-xs tracking-wide uppercase">Created</span>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
          <span className="text-lg font-light text-white">
            {isActive
              ? `Expires ${formatDistanceToNow(new Date(data.sessionExpiresAt), { addSuffix: true })}`
              : format(new Date(data.sessionExpiresAt), "d MMM yyyy, HH:mm")}
          </span>
          <span className={`text-xs tracking-wide uppercase mt-0.5 ${isActive ? "text-green-500" : "text-neutral-500"}`}>
            {isActive ? "Session Active" : "Expired"}
          </span>
        </div>
      </div>

      {/* ── Charts side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scan Location Breakdown */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-light text-base mb-5">Attendees by Scan Location</h2>
          {data.attendeesByScanLocation.length === 0 ? (
            <p className="text-neutral-500 text-sm">No location data.</p>
          ) : (
            <div className="space-y-4">
              {data.attendeesByScanLocation.map((loc) => (
                <div key={loc.location}>
                  <div className="flex justify-between text-sm text-neutral-300 mb-1">
                    <span className="truncate max-w-[200px]">{loc.location}</span>
                    <span className="text-neutral-500 shrink-0 ml-2">{loc.count} · {loc.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <div className="bg-white/60 h-1.5 rounded-full" style={{ width: `${loc.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cumulative Attendance Over Time */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-light text-base mb-5">Cumulative Attendance Over Time</h2>
          {data.attendeesOverTime.length === 0 ? (
            <p className="text-neutral-500 text-sm">No attendance data yet.</p>
          ) : (
            <CumulativeChart data={data.attendeesOverTime} max={maxCumulative} />
          )}
        </div>
      </div>

      {/* ── Full Attendee Table ── */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-white font-light text-base">All Attendees</h2>
            <p className="text-neutral-500 text-xs mt-0.5">{data.totalAttendees} {data.totalAttendees === 1 ? "person" : "people"} attended this session</p>
          </div>
          <input
            type="text"
            placeholder="Search attendees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 w-56"
          />
        </div>

        {filteredAttendees.length === 0 ? (
          <p className="text-neutral-500 text-sm p-6">{data.totalAttendees === 0 ? "No attendees yet." : "No results match your search."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10 text-neutral-500 text-xs uppercase tracking-widest">
                  <SortTh label="#" field="joinOrder" current={sortField} asc={sortAsc} onClick={handleSort} />
                  <SortTh label="Name" field="lastName" current={sortField} asc={sortAsc} onClick={handleSort} />
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">MAT Number</th>
                  <th className="py-3 px-4">Scan Location</th>
                  <SortTh label="Joined At" field="joinedAt" current={sortField} asc={sortAsc} onClick={handleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAttendees.map((a, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-neutral-600 w-10">{a.joinOrder}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs text-white font-medium shrink-0">
                          {a.firstName.charAt(0)}{a.lastName.charAt(0)}
                        </div>
                        <span className="text-white font-medium">{a.firstName} {a.lastName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-neutral-400">{a.email}</td>
                    <td className="py-3 px-4 text-neutral-400">{a.matNumber || "—"}</td>
                    <td className="py-3 px-4">
                      {a.scanLocationName ? (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300">{a.scanLocationName}</span>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-400 whitespace-nowrap">
                      {format(new Date(a.joinedAt), "HH:mm:ss")}
                      <span className="text-neutral-600 ml-1.5 text-xs">{format(new Date(a.joinedAt), "d MMM")}</span>
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function CumulativeChart({ data, max }: { data: AttendanceOverTime[]; max: number }) {
  return (
    <div className="flex items-end gap-0.5 h-28 w-full">
      {data.map((point, i) => {
        const pct = max > 0 ? Math.round((point.cumulativeCount / max) * 100) : 0;
        return (
          <div key={i} className="flex-1 flex items-end group relative h-full">
            <div className="w-full bg-white/50 rounded-sm" style={{ height: `${Math.max(pct, 2)}%` }} />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-black/90 border border-white/10 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
              {format(new Date(point.time), "HH:mm")} · {point.cumulativeCount}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SortTh({
  label, field, current, asc, onClick,
}: {
  label: string;
  field: keyof SessionAttendeeDetail;
  current: keyof SessionAttendeeDetail;
  asc: boolean;
  onClick: (f: keyof SessionAttendeeDetail) => void;
}) {
  const active = current === field;
  return (
    <th className="py-3 px-4 cursor-pointer select-none hover:text-white transition-colors" onClick={() => onClick(field)}>
      <span className="flex items-center gap-1">{label}<span className="text-[10px]">{active ? (asc ? "↑" : "↓") : "↕"}</span></span>
    </th>
  );
}

