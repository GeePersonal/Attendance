import { Link, useParams } from "react-router-dom";
import AppPaginations from "../../app/components/AppPaginations";
import Tooltip from "../../app/components/Tooltip";
import { useEffect, useState } from "react";
import agent from "../../app/api/agent";
import { Class } from "../../app/models/class";
import { Session } from "../../app/models/session";
import AppLoading from "../../app/components/AppLoading";
import { MetaData } from "../../app/models/pagination";
import { getAxiosParams } from "../../app/utils";
import { confirmAlert } from "react-confirm-alert";
import { format } from "date-fns";
import { ClassAnalytics, ClassAttendeeAnalytics } from "../../app/models/analytics";

type Tab = "sessions" | "analytics";

function ClassDetails() {
  const { id } = useParams<{ id: string }>();
  const [classInfo, setClassInfo] = useState<Class>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [metaData, setMetaData] = useState<MetaData>();
  const [loading, setLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("sessions");
  const [analyticsData, setAnalyticsData] = useState<ClassAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsFetched, setAnalyticsFetched] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClassInfo();
      fetchSessions();
    }
  }, [id]);

  const fetchClassInfo = async () => {
    try {
      const data = await agent.Class.getClass(id!);
      setClassInfo(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (activeTab === "analytics" && id && !analyticsFetched) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id]);

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const result = await agent.Analytics.getClass(id!);
      setAnalyticsData(result);
      setAnalyticsFetched(true);
    } catch (error) {
      console.log(error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchSessions = async (params?: URLSearchParams) => {
    try {
      setLoading(true);
      const defaultParams = params ?? getAxiosParams({ classId: id, pageNumber: 1, pageSize: 9 });
      const response = await agent.Session.getSessions(defaultParams);
      setSessions(response.items);
      setMetaData(response.metaData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    const params = getAxiosParams({ classId: id, pageNumber: page, pageSize: pageSize || metaData!.pageSize });
    fetchSessions(params);
  };

  const handleRemoveSession = (sessionId: string, sessionName: string) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="bg-black/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative">
          <h1 className="text-2xl text-white font-light mb-4">Remove Session</h1>
          <p className="text-neutral-400 mb-8 font-light">
            Remove <span className="text-white font-medium">"{sessionName}"</span> from this class? The session will not be deleted.
          </p>
          <div className="flex gap-4 justify-end">
            <button
              className="px-6 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all bg-transparent"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all font-medium"
              onClick={async () => {
                try {
                  setRemoveTarget(sessionId);
                  await agent.Class.removeSessionFromClass(id!, sessionId);
                  fetchSessions();
                  fetchClassInfo();
                } catch (error) {
                  console.log(error);
                } finally {
                  setRemoveTarget("");
                  onClose();
                }
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ),
    });
  };

  if (loading && !classInfo) return <AppLoading />;

  return (
    <div className="w-full mx-auto px-4 md:px-8 py-8 animate-fade-in-up">
      {/* Back button */}
      <Link
        to="/user-profile/classes"
        className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="text-sm font-light">All Classes</span>
      </Link>

      {/* Class header card */}
      {classInfo && (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-white/40"></div>
                <h2 className="text-3xl font-light tracking-tight text-white">{classInfo.name}</h2>
              </div>
              {classInfo.description && (
                <p className="text-neutral-400 font-light mt-1 ml-5.5 max-w-xl">{classInfo.description}</p>
              )}
              <p className="text-neutral-600 text-xs mt-3 ml-0.5">
                Created {format(new Date(classInfo.createdAt), "MMMM do, yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3 text-center">
                <span className="block text-2xl font-light text-white">{classInfo.sessionsCount}</span>
                <span className="text-neutral-500 text-xs uppercase tracking-wider">Sessions</span>
              </div>
              <Tooltip label="Edit Class">
                <Link
                  to={`/user-profile/create-class/${classInfo.classId}`}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </Link>
              </Tooltip>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white/[0.03] border border-white/10 rounded-2xl p-1 w-fit">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all ${
            activeTab === "sessions"
              ? "bg-white/10 text-white border border-white/10"
              : "text-neutral-500 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Sessions
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all ${
            activeTab === "analytics"
              ? "bg-white/10 text-white border border-white/10"
              : "text-neutral-500 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Analytics
        </button>
      </div>

      {/* ── Sessions Tab ── */}
      {activeTab === "sessions" && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-light text-white tracking-wide">Sessions</h3>
            <Link
              to={`/user-profile/generate-qr-code`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 text-sm hover:bg-white/10 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Session
            </Link>
          </div>

          {loading ? (
            <AppLoading />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 py-12 text-center text-neutral-500 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <svg className="w-12 h-12 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p>No sessions in this class yet.</p>
                    </div>
                  </div>
            ) : (
              sessions.map((session, index) => (
                <div
                  key={index}
                  className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl hover:bg-white/[0.04] transition-all group flex flex-col justify-between"
                >
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-white/60 transition-colors"></div>
                        <span className="font-medium text-white tracking-wide text-lg">
                          {session.sessionName.length > 25 ? (
                            <span title={session.sessionName}>{session.sessionName.slice(0, 25)}...</span>
                          ) : (
                            session.sessionName
                          )}
                        </span>
                      </div>
                      <div className="flex items-center text-neutral-400 gap-2 text-sm mt-1">
                        <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{format(new Date(session.sessionExpiresAt), "MMM do, h:mm a")}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider
                      ${session.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                      {session.status}
                    </span>
                  </div>

                  {/* Attendees */}
                  <div className="flex items-center justify-between mb-8 mt-2 bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                    <span className="text-neutral-500 font-light text-sm">Engagement</span>
                    <span className="bg-white/10 text-white rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-white/20 shadow-lg">
                      {session.attendeesCount} {session.attendeesCount === 1 ? "Attendee" : "Attendees"}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-2 text-neutral-400 border-t border-white/5 pt-4 mt-auto">
                    <Tooltip label="View Roster">
                      <Link
                        to={`/user-profile/session-details/${session.sessionId}`}
                        className="p-2.5 rounded-xl hover:bg-white/10 hover:text-white transition-all group/btn"
                      >
                        <svg className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Link>
                    </Tooltip>
                    <Tooltip label="Remove from Class">
                      <button
                        onClick={() => handleRemoveSession(session.sessionId, session.sessionName)}
                        disabled={removeTarget === session.sessionId}
                        className="p-2.5 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all group/btn"
                      >
                        {removeTarget === session.sessionId ? (
                          <div className="h-5 w-5 border-2 border-t-transparent border-red-500 rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                          </svg>
                        )}
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ))
            )}
          </div>

          {metaData && (
            <div className="mt-8 flex justify-center">
              <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-2 inline-block">
                <AppPaginations metaData={metaData} onPageChange={(page) => handlePageChange(page)} />
              </div>
            </div>
          )}
        </>
      )}
        </>
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === "analytics" && (
        <ClassAnalyticsTab data={analyticsData} loading={analyticsLoading} />
      )}
    </div>
  );
}

// ── Class Analytics Tab ──────────────────────────────────────────────────────

function ClassAnalyticsTab({ data, loading }: { data: ClassAnalytics | null; loading: boolean }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof ClassAttendeeAnalytics>("attendancePercentage");
  const [sortAsc, setSortAsc] = useState(false);

  if (loading) return <AppLoading />;
  if (!data) return null;

  const handleSort = (field: keyof ClassAttendeeAnalytics) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
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
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
          <span className="text-2xl font-light text-white">{data.totalSessions}</span>
          <span className="text-neutral-500 text-xs tracking-wide uppercase">Total Sessions</span>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
          <span className="text-2xl font-light text-white">{data.totalUniqueAttendees}</span>
          <span className="text-neutral-500 text-xs tracking-wide uppercase">Unique Attendees</span>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
          <span className="text-2xl font-light text-white">{data.averageAttendeesPerSession}</span>
          <span className="text-neutral-500 text-xs tracking-wide uppercase">Avg / Session</span>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
          <span className="text-2xl font-light text-white">{data.maxAttendeesInSession}</span>
          <span className="text-neutral-500 text-xs tracking-wide uppercase">Best Session</span>
        </div>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-1">
          <span className={`text-2xl font-light ${rateColor(data.overallAttendanceRate)}`}>{data.overallAttendanceRate}%</span>
          <span className="text-neutral-500 text-xs tracking-wide uppercase">Overall Rate</span>
        </div>
      </div>

      {/* Attendee Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-white font-light text-lg">Attendee Attendance</h2>
            <p className="text-neutral-500 text-xs mt-0.5">
              All attendees across all sessions · sorted by attendance rate
            </p>
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
          <p className="text-neutral-500 text-sm p-6">No attendees found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-white/10 text-neutral-500 text-xs uppercase tracking-widest">
                  <th className="py-3 px-4 font-normal">Student</th>
                  <th className="py-3 px-4 font-normal">Email</th>
                  <th className="py-3 px-4 font-normal">MAT Number</th>
                  <th
                    className="py-3 px-4 font-normal cursor-pointer select-none hover:text-white transition-colors"
                    onClick={() => handleSort("sessionsAttended")}
                  >
                    Sessions Attended {sortField === "sessionsAttended" ? (sortAsc ? "↑" : "↓") : "↕"}
                  </th>
                  <th
                    className="py-3 px-4 font-normal cursor-pointer select-none hover:text-white transition-colors"
                    onClick={() => handleSort("attendancePercentage")}
                  >
                    Attendance % {sortField === "attendancePercentage" ? (sortAsc ? "↑" : "↓") : "↕"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAttendees.map((a, i) => {
                  const pct = a.attendancePercentage;
                  return (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs text-white font-medium shrink-0">
                            {a.firstName.charAt(0)}{a.lastName.charAt(0)}
                          </div>
                          <span className="text-white font-medium">{a.firstName} {a.lastName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-500 text-xs">{a.email}</td>
                      <td className="py-3 px-4 text-neutral-500 text-xs">{a.matNumber || "—"}</td>
                      <td className="py-3 px-4">
                        <span className="text-neutral-300 font-medium">
                          {a.sessionsAttended}
                          <span className="text-neutral-600 font-normal"> / {a.totalSessions}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-white/5 rounded-full h-1.5">
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
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassDetails;
