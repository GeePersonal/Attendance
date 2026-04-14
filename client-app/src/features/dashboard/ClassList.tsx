import { Link } from "react-router-dom";
import AppPaginations from "../../app/components/AppPaginations";
import AppTableHeader from "../../app/components/AppTableHeader";
import { useEffect, useState } from "react";
import agent from "../../app/api/agent";
import { Class } from "../../app/models/class";
import AppLoading from "../../app/components/AppLoading";
import { MetaData } from "../../app/models/pagination";
import { getAxiosParams } from "../../app/utils";
import { confirmAlert } from "react-confirm-alert";
import { format } from "date-fns";

function ClassList() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [target, setTarget] = useState("");
  const [metaData, setMetaData] = useState<MetaData>();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async (params?: URLSearchParams) => {
    try {
      setLoading(true);
      const response = await agent.Class.getClasses(params);
      setClasses(response.items);
      setMetaData(response.metaData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="bg-black/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl relative">
          <h1 className="text-2xl text-white font-light mb-4">Confirm Deletion</h1>
          <p className="text-neutral-400 mb-8 font-light">
            Are you sure you want to delete this class? Sessions inside it will not be deleted.
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
                  setDeleteLoading(true);
                  setTarget(classId);
                  await agent.Class.deleteClass(classId);
                  fetchClasses();
                } catch (error) {
                  console.log(error);
                } finally {
                  setDeleteLoading(false);
                  setTarget("");
                  onClose();
                }
              }}
            >
              Delete Class
            </button>
          </div>
        </div>
      ),
    });
  };

  const handlePageChange = async (page: number, pageSize?: number) => {
    const params = getAxiosParams({ pageNumber: page, pageSize: pageSize || metaData!.pageSize });
    fetchClasses(params);
  };

  const handleSearch = async (search: string) => {
    const params = getAxiosParams({ searchTerm: search, pageNumber: 1, pageSize: metaData!.pageSize });
    fetchClasses(params);
  };

  if (loading) return <AppLoading />;

  return (
    <div className="w-full mx-auto px-4 md:px-8 py-8 animate-fade-in-up">
      <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-light tracking-tight text-white mb-2">Classes</h2>
          <p className="text-neutral-500 font-light max-w-2xl">
            Organise your sessions into classes to track attendance across multiple events.
          </p>
        </div>
        <Link
          to="/user-profile/create-class"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-200 transition-all whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Class
        </Link>
      </div>

      {metaData && (
        <div className="mb-6 bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-2xl p-4">
          <AppTableHeader
            onPageSizeChange={(pageSize) => handlePageChange(1, pageSize)}
            onSearch={handleSearch}
            metaData={metaData}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-12 text-center text-neutral-500 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
            <div className="flex flex-col items-center justify-center space-y-4">
              <svg className="w-12 h-12 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>No classes yet. Create your first class to start grouping sessions.</p>
            </div>
          </div>
        ) : (
          classes.map((cls, index) => (
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
                      {cls.name.length > 25 ? (
                        <span title={cls.name}>{cls.name.slice(0, 25)}...</span>
                      ) : (
                        cls.name
                      )}
                    </span>
                  </div>
                  {cls.description && (
                    <p className="text-neutral-500 text-sm font-light ml-5 line-clamp-2">
                      {cls.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="flex items-center justify-between mb-8 mt-2 bg-white/[0.02] rounded-2xl p-4 border border-white/5">
                <span className="text-neutral-500 font-light text-sm">Sessions</span>
                <span className="bg-white/10 text-white rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-white/20 shadow-lg">
                  {cls.sessionsCount} {cls.sessionsCount === 1 ? "Session" : "Sessions"}
                </span>
              </div>

              {/* Created At */}
              <div className="flex items-center text-neutral-500 gap-2 text-xs mb-4 ml-1">
                <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Created {format(new Date(cls.createdAt), "MMM do, yyyy")}</span>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-end gap-2 text-neutral-400 border-t border-white/5 pt-4 mt-auto">
                <Link
                  to={`/user-profile/classes/${cls.classId}`}
                  className="p-2.5 rounded-xl hover:bg-white/10 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50 group/btn"
                  title="View Sessions"
                >
                  <svg className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </Link>
                <Link
                  to={`/user-profile/create-class/${cls.classId}`}
                  className="p-2.5 rounded-xl hover:bg-white/10 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50 group/btn"
                  title="Edit Class"
                >
                  <svg className="w-5 h-5 group-hover/btn:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </Link>
                <button
                  onClick={() => handleDeleteClass(cls.classId)}
                  disabled={deleteLoading && target === cls.classId}
                  className="p-2.5 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all focus:outline-none focus:ring-2 focus:ring-red-500/50 group/btn"
                  title="Delete Class"
                >
                  {deleteLoading && target === cls.classId ? (
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
            <AppPaginations metaData={metaData} onPageChange={(page) => handlePageChange(page)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassList;
