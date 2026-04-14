import { Link } from "react-router-dom";
import AppPaginations from "../../app/components/AppPaginations";
import AppTableHeader from "../../app/components/AppTableHeader";
import { useEffect, useState } from "react";
import agent from "../../app/api/agent";
import { Session } from "../../app/models/session";
import { Class } from "../../app/models/class";
import AppLoading from "../../app/components/AppLoading";
import { MetaData } from "../../app/models/pagination";
import { getAxiosParams } from "../../app/utils";
import { confirmAlert } from "react-confirm-alert";
import { format } from "date-fns";

function SessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(true);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [target, setTarget] = useState("");
  const [metaData, setMetaData] = useState<MetaData>();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await agent.Class.getClasses();
        setClasses(response.items);
      } catch (error) {
        console.log(error);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    getSessions();
  }, [selectedClassId]);

  const getSessions = async (params?: URLSearchParams) => {
    try {
      setLoading(true);
      const defaultParams = params ?? getAxiosParams({
        classId: selectedClassId || undefined,
        pageNumber: 1,
        pageSize: metaData?.pageSize ?? 9,
      });
      const response = await agent.Session.getSessions(defaultParams);
      setSessions(response.items);
      setMetaData(response.metaData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    confirmAlert({
      customUI: ({ onClose }) => {
        return (
          <div className="bg-black/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative">
            <h1 className="text-2xl text-white font-light mb-4">Confirm Deletion</h1>
            <p className="text-neutral-400 mb-8 font-light">Are you sure you want to delete this session? This action cannot be undone.</p>
            <div className="flex gap-4 justify-end">
              <button
                className="px-6 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-all bg-transparent"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-all font-medium border"
                onClick={async () => {
                  try {
                    setDeleteLoading(true);
                    setTarget(sessionId);
                    await agent.Session.deleteSession(sessionId);
                    getSessions();
                  } catch (error) {
                    console.log(error);
                  } finally {
                    setDeleteLoading(false);
                    setTarget("");
                    onClose();
                  }
                }}
              >
                Delete Session
              </button>
            </div>
          </div>
        );
      }
    });
  };

  const handleCloneSession = async (sessionId: string) => {
    try {
      setCloneLoading(true);
      setTarget(sessionId);
      await agent.Session.cloneSession(sessionId);
      getSessions();
    } catch (error) {
      console.log(error);
    } finally {
      setCloneLoading(false);
      setTarget("");
    }
  };

  const handlePageChange = async (page: number, pageSize?: number) => {
    const params = getAxiosParams({
      pageNumber: page,
      pageSize: pageSize || metaData!.pageSize,
      classId: selectedClassId || undefined,
    });

    try {
      setLoading(true);
      const response = await agent.Session.getSessions(params);
      setSessions(response.items);
      setMetaData(response.metaData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (search: string) => {
    const params = getAxiosParams({
      searchTerm: search,
      pageNumber: 1,
      pageSize: metaData!.pageSize,
      classId: selectedClassId || undefined,
    });

    try {
      setLoading(true);
      const response = await agent.Session.getSessions(params);
      setSessions(response.items);
      setMetaData(response.metaData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AppLoading />;

  return (
    <div className="w-full mx-auto px-4 md:px-8 py-8 animate-fade-in-up">
      
      <div className="mb-10 text-center md:text-left">
        <h2 className="text-4xl font-light tracking-tight text-white mb-2">History</h2>
        <p className="text-neutral-500 font-light max-w-2xl">Review past activity, track attendance numbers, and manage your session archives.</p>
      </div>

      {classes.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-neutral-500 text-sm font-light">Filter by class:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all appearance-none"
            style={{ colorScheme: "dark" }}
          >
            <option value="">All sessions</option>
            {classes.map((cls) => (
              <option key={cls.classId} value={cls.classId}>
                {cls.name}
              </option>
            ))}
          </select>
          {selectedClassId && (
            <button
              onClick={() => setSelectedClassId("")}
              className="text-neutral-500 hover:text-white transition-colors text-xs"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {metaData && (
        <div className="mb-6 bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-2xl p-4">
          <AppTableHeader
            onPageSizeChange={(pageSize) => handlePageChange(1, pageSize)}
            onSearch={(search) => handleSearch(search)}
            metaData={metaData!}
          />
        </div>
      )}

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-12 text-center text-neutral-500 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
            <div className="flex flex-col items-center justify-center space-y-4">
              <svg className="w-12 h-12 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>No sessions found. Generate your first QR Session to begin.</p>
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
                    <span>
                      {format(
                        new Date(session.sessionExpiresAt),
                        "MMM do, h:mm a"
                      )}
                    </span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider
                  ${session.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    session.status === 'Expired' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                    'bg-white/5 text-neutral-300 border border-white/10'}`}>
                  {session.status}
                </span>
              </div>

              {/* Card Body - Engagement */}
              <div className="flex items-center justify-between mb-8 mt-2 bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                <span className="text-neutral-500 font-light text-sm">Engagement</span>
                <div className="flex items-center">
                  <div className="flex -space-x-2 mr-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-black flex items-center justify-center shadow-sm">
                        <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                    </div>
                    {session.attendeesCount > 1 && (
                      <div className="w-8 h-8 rounded-full bg-neutral-800 border-2 border-black flex items-center justify-center shadow-sm">
                        <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="bg-white/10 text-white rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-white/20 shadow-lg">
                    {session.attendeesCount} {session.attendeesCount === 1 ? 'Attendee' : 'Attendees'}
                  </span>
                </div>
              </div>

              {/* Card Footer - Controls */}
              <div className="flex items-center justify-end gap-2 text-neutral-400 border-t border-white/5 pt-4 mt-auto">
                <Link
                  to={`/user-profile/session-details/${session.sessionId}`}
                  className="p-2.5 rounded-xl hover:bg-white/10 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50 tooltip-trigger group/btn"
                  title="View Roster"
                >
                  <svg className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </Link>
                <Link
                  to={`/user-profile/generate-qr-code/${session.sessionId}`}
                  className="p-2.5 rounded-xl hover:bg-white/10 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50 group/btn"
                  title="Edit Session"
                >
                  <svg className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </Link>
                <button
                  onClick={() => handleCloneSession(session.sessionId)}
                  disabled={cloneLoading && target == session.sessionId}
                  className="p-2.5 rounded-xl hover:bg-white/10 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50 group/btn"
                  title="Clone Session"
                >
                  {cloneLoading && target == session.sessionId ? (
                    <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteSession(session.sessionId)}
                  disabled={deleteLoading && target == session.sessionId}
                  className="p-2.5 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 group/btn"
                  title="Delete Archive"
                >
                  {deleteLoading && target == session.sessionId ? (
                    <div className="h-5 w-5 border-2 border-t-transparent border-red-500 rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5 group-hover/btn:-translate-y-0.5 group-hover/btn:rotate-3 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {metaData && (
        <div className="mt-8 flex justify-center">
          <div className="bg-white/5 border border-white/10 backdrop-blur-lg rounded-2xl p-2 inline-block">
            <AppPaginations
              metaData={metaData}
              onPageChange={(page) => handlePageChange(page)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
export default SessionHistory;
