import { useNavigate } from "react-router-dom";
import { User } from "../../app/models/user";

export default function UserProfile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}") as User;

  if (!user || !user.displayName) {
    return null; // Will be handled by the layout redirect if unauthorized
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6">
      {/* Profile Card */}
      <div className="bg-neutral-950 text-white rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] border border-neutral-800 flex flex-col items-center">
        
        {/* Glow Effects */}
        <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] bg-white/[0.04] rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/[0.03] rounded-full blur-[80px] pointer-events-none"></div>

        {/* Profile Avatar Image */}
        <div className="relative group w-32 h-32 md:w-40 md:h-40 mb-8 mx-auto z-10 transition-transform duration-500 hover:scale-105">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all duration-500"></div>
          <img
            src={user.profileImageUrl || "/images/person.png"}
            alt={user.displayName}
            className="w-full h-full object-cover rounded-full border-4 border-neutral-900 shadow-[0_0_0_2px_rgba(255,255,255,0.2)] md:shadow-[0_0_0_4px_rgba(255,255,255,0.2)] relative z-10 block"
          />
        </div>

        {/* User Identity */}
        <div className="relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] mx-auto backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            <span className="text-white/80 text-[10px] font-bold tracking-widest uppercase">Verified Account</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-4 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
            {user.displayName}
          </h1>

          <div className="flex flex-col gap-1 items-center bg-black/40 border border-white/5 rounded-2xl py-4 px-8 shadow-inner my-8 w-fit mx-auto">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-neutral-500">Primary Email</span>
            <span className="text-sm font-medium tracking-wide text-neutral-300">
              {user.email || "No email available"}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="relative z-10 w-full max-w-sm mx-auto mt-8 px-4 flex flex-col gap-4">
          <button
            onClick={() => navigate("/user-profile/current-session")}
            className="w-full py-4 px-6 rounded-2xl bg-white text-black font-bold uppercase tracking-wider text-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
          >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
            Active Session
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-4 px-6 rounded-2xl bg-red-500/10 text-red-500 font-bold uppercase tracking-wider text-sm border border-red-500/20 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 mt-4"
          >
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
             </svg>
            Sign Out Securely
          </button>
        </div>
      </div>
    </div>
  );
}
