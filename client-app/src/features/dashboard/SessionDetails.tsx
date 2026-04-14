import { Link, useParams } from "react-router-dom";
import AppPaginations from "../../app/components/AppPaginations";
import AppTableHeader from "../../app/components/AppTableHeader";
import { useEffect, useState } from "react";
import { SessionAttendees } from "../../app/models/session";
import AppLoading from "../../app/components/AppLoading";
import agent from "../../app/api/agent";
import { MetaData } from "../../app/models/pagination";
import { getAxiosParams } from "../../app/utils";
import { formatDistanceToNow, format } from "date-fns";
import autoTable from "jspdf-autotable";
import jsPDF from "jspdf";

function SessionDetails() {
  const [sessionDetails, setSessionDetails] = useState<SessionAttendees>();
  const [metaData, setMetaData] = useState<MetaData>();
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState("Excel");

  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const sesstionAttendees = async () => {
      try {
        setLoading(true);
        const response = await agent.Attendance.getAttendees(id!);
        setSessionDetails(response.items as unknown as SessionAttendees);
        setMetaData(response.metaData);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    sesstionAttendees();
  }, [id]);

  const handlePageChange = async (page: number, pageSize?: number) => {
    const params = getAxiosParams({
      pageNumber: page,
      pageSize: pageSize || metaData!.pageSize,
    });

    try {
      setLoading(true);
      const response = await agent.Attendance.getAttendees(id!, params);
      setSessionDetails(response.items as unknown as SessionAttendees);
      setMetaData(response.metaData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchTerm: string) => {
    const params = getAxiosParams({
      pageNumber: 1,
      pageSize: metaData!.pageSize,
      searchTerm,
    });

    try {
      setLoading(true);
      const response = await agent.Attendance.getAttendees(id!, params);
      setSessionDetails(response.items as unknown as SessionAttendees);
      setMetaData(response.metaData);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (exportType: string) => {
    try {
      setLoading(true);
      if (exportType === "Excel") {
        const response = await agent.Attendance.exportToCSV(id!);
        const url = URL.createObjectURL(new Blob([response]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", sessionDetails?.sessionName! + ".csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const attendees = await agent.Attendance.getAllSessionAttendees(id!);

        const doc = new jsPDF();

        autoTable(doc, {
          headStyles: { fillColor: "#616161" },
          head: [["First Name", "Last Name", "Email", "MATNumber"]],
          body: attendees.map((attendee) => [
            attendee.firstName,
            attendee.lastName,
            attendee.email,
            attendee.matNumber,
          ]),
        });

        doc.save(sessionDetails?.sessionName! + ".pdf");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AppLoading />;

  return (
    <div
      className="container mx-auto px-4 py-8 w-full xl:w-10/12 max-w-6xl transition-all duration-300 animate-fade-in-up"
      style={{ minHeight: "calc(100vh - 6rem)" }}
    >
      {/* Back Navigation */}
      <div className="mb-6">
        <Link
          to="/user-profile/session-history"
          className="inline-flex items-center text-sm font-light text-neutral-400 hover:text-white transition-colors group"
        >
          <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Sessions
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-light text-white tracking-tight">
              {sessionDetails?.sessionName}
            </h1>
            <span className={`px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-full ${
              sessionDetails?.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              sessionDetails?.status === 'Expired' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              'bg-white/5 text-neutral-300 border border-white/10'
            }`}>
              {sessionDetails?.status}
            </span>
          </div>
          <p className="text-neutral-500 font-light">Session Details & Attendees Overview</p>
        </div>

        <div className="flex flex-col items-start md:items-end p-4 bg-white/[0.02] border border-white/5 rounded-2xl w-full md:w-auto">
          <div className="flex items-center text-white font-medium mb-1">
            <svg className="w-4 h-4 mr-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {sessionDetails &&
              format(new Date(sessionDetails.sessionExpiresAt), "MMMM do, h:mm a")
            }
          </div>
          <p className="text-sm font-light text-neutral-400 flex items-center">
            <svg className="w-4 h-4 mr-1.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {sessionDetails?.status !== "Expired" ? "Expires in " : "Expired "}
            <span className={`ml-1 font-medium ${sessionDetails?.status === 'Expired' ? 'text-red-400' : 'text-neutral-300'}`}>
              {sessionDetails &&
                formatDistanceToNow(new Date(sessionDetails.sessionExpiresAt), {
                  addSuffix: sessionDetails.status === "Expired",
                })
              }
            </span>
          </p>
        </div>
      </div>

      {/* Controls / Search & Page Size */}
      <div className="mb-6 bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-2xl p-4">
        {metaData && (
          <AppTableHeader
            onPageSizeChange={(pageSize) => handlePageChange(1, pageSize)}
            onSearch={(search) => handleSearch(search)}
            metaData={metaData}
          />
        )}
      </div>

      {/* Attendees Section */}
      <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden mb-8 shadow-2xl">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="min-w-max w-full table-auto text-left">
            <thead>
              <tr className="bg-white/5 text-neutral-400 uppercase text-xs font-light tracking-wider border-b border-white/10">
                <th className="py-4 px-6 font-medium">First Name</th>
                <th className="py-4 px-6 font-medium">Last Name</th>
                <th className="py-4 px-6 font-medium">Email</th>
                <th className="py-4 px-6 font-medium text-center">MATNumber</th>
                <th className="py-4 px-6 font-medium text-center">Joined At</th>
              </tr>
            </thead>
            <tbody className="text-neutral-300 text-sm font-light">
              {sessionDetails?.attendees?.map((attendee, index) => (
                <tr
                  key={index}
                  className="border-b border-white/5 hover:bg-white/[0.04] transition-colors duration-150"
                >
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center font-medium text-xs mr-3">
                        {attendee.firstName.charAt(0)}{attendee.lastName.charAt(0)}
                      </div>
                      <span className="font-medium text-white">{attendee.firstName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="font-medium text-white">{attendee.lastName}</span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    <span className="text-neutral-400 flex items-center">
                      <svg className="w-4 h-4 mr-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {attendee.email}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 text-neutral-300 border border-white/10">
                      {attendee.matNumber}
                    </span>
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center text-neutral-400">
                      <svg className="w-4 h-4 mr-1.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs">
                        {formatDistanceToNow(new Date(attendee.createdAt))} ago
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {(!sessionDetails?.attendees || sessionDetails.attendees.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-neutral-500">
                      <svg className="w-14 h-14 mb-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-light text-white">No attendees yet</p>
                      <p className="text-sm mt-1">Waiting for participants to join the session.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden flex flex-col p-4 space-y-4">
          {sessionDetails?.attendees?.map((attendee, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center font-medium text-sm mr-3">
                    {attendee.firstName.charAt(0)}{attendee.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-base leading-tight">{attendee.firstName} {attendee.lastName}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-medium bg-white/10 text-neutral-300 border border-white/10">
                      MAT: {attendee.matNumber}
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                <div className="flex items-center text-xs text-neutral-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate">{attendee.email}</span>
                </div>
                <div className="flex items-center text-xs text-neutral-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Joined {formatDistanceToNow(new Date(attendee.createdAt))} ago</span>
                </div>
              </div>
            </div>
          ))}
          
          {(!sessionDetails?.attendees || sessionDetails.attendees.length === 0) && (
            <div className="py-12 text-center flex flex-col items-center justify-center text-neutral-500">
              <svg className="w-12 h-12 mb-3 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-base font-light text-white">No attendees yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-black/40 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-2xl mb-8">
        <div className="w-full md:w-auto overflow-x-auto min-w-[250px]">
          {metaData && (
            <AppPaginations
              metaData={metaData}
              onPageChange={(page) => handlePageChange(page)}
            />
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center sm:space-x-4 bg-white/[0.02] p-2 sm:p-2 sm:pl-4 rounded-2xl w-full md:w-auto border border-white/5">
          <span className="text-sm font-medium text-neutral-400 mb-2 sm:mb-0 mr-auto sm:mr-0 pl-1">Export Data</span>
          <div className="flex items-center w-full sm:w-auto space-x-2">
            <select
              onChange={(e) => setExportType(e.target.value)}
              value={exportType}
              className="bg-white/5 border border-white/10 text-white rounded-xl text-sm h-10 px-4 pr-10 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all appearance-none flex-1 cursor-pointer"
              style={{
                colorScheme: 'dark',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23a3a3a3' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              <option value="Excel" className="bg-neutral-900">Excel (.csv)</option>
              <option value="PDF" className="bg-neutral-900">PDF (.pdf)</option>
            </select>
            <button
              onClick={() => handleExport(exportType)}
              className="flex items-center justify-center px-5 h-10 bg-white text-black text-sm font-medium rounded-xl hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all active:scale-95 whitespace-nowrap"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default SessionDetails;
