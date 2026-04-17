import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Tooltip from "../components/Tooltip";
import agent from "../../app/api/agent";
import { User } from "../../app/models/user";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      navigate("/login");
    }
  }, [navigate]);

  let refreshTokenTimeout: any;

  useEffect(() => {
    if (user) {
      refreshTokenTimer(user);
    }
    return () => {
      stopRefreshTokenTimer();
    };
  }, [user]);

  const refreshToken = async () => {
    stopRefreshTokenTimer();
    try {
      const refreshedUser = await agent.Account.refreshAppUserToken();
      if (refreshedUser) {
        localStorage.setItem("user", JSON.stringify(refreshedUser));
        setUser(refreshedUser);
        refreshTokenTimer(refreshedUser);
      }
    } catch (error) {
      console.log(error);
      navigate("/login");
    }
  };

  function refreshTokenTimer(u: User) {
    const jwtToken = JSON.parse(atob(u.token.split(".")[1]));
    const expires = new Date(jwtToken.exp * 1000);
    const timeout = expires.getTime() - (Date.now() - 5 * 1000 * 60);
    refreshTokenTimeout = setTimeout(refreshToken, timeout);
  }

  function stopRefreshTokenTimer() {
    clearTimeout(refreshTokenTimeout);
  }

  if (!user) return null;

  const navLinks = [
    { name: "Current Session", path: "/user-profile/current-session" },
    { name: "Generate QR Code", path: "/user-profile/generate-qr-code" },
    { name: "Session History", path: "/user-profile/session-history" },
    { name: "Classes", path: "/user-profile/classes" },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 overflow-x-hidden flex flex-col">
      {/* Decorative top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-32 bg-white/[0.03] blur-[100px] pointer-events-none z-0"></div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl transition-all duration-300">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Brand */}
            <div className="flex-shrink-0 flex items-center gap-3 cursor-pointer" onClick={() => navigate("/user-profile")}>
              <img src="/images/MyLogo.png" alt="Logo" className="h-16 w-auto" />
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex flex-1 items-center justify-center space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-5 py-2.5 rounded-full text-sm font-medium tracking-wide uppercase transition-all duration-200 relative group ` +
                    (isActive
                      ? "text-white bg-white/10"
                      : "text-neutral-400 hover:text-white hover:bg-white/5")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative z-10">{link.name}</span>
                      {isActive && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            {/* Right section: User Profile Hook & Hamburger */}
            <div className="flex items-center flex-shrink-0 gap-3">
              <NavLink 
                to="/user-profile/profile"
                className={({ isActive }) => 
                  `flex items-center gap-3 p-1.5 sm:pr-4 rounded-full border transition-all duration-300 ${
                    isActive ? "border-white/40 bg-white/10" : "border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5"
                  }`
                }
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.1)] border border-white/20">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="hidden sm:block text-sm font-medium text-neutral-300 tracking-wide">
                  {user.displayName}
                </span>
              </NavLink>

              {/* Hamburger Button (Mobile only) */}
              <Tooltip label={isMobileMenuOpen ? "Close Menu" : "Open Menu"} position="bottom">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                    )}
                  </svg>
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Mobile Hamburger Dropdown Menu */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out border-white/10 bg-black/95 backdrop-blur-3xl ${
            isMobileMenuOpen ? "border-t max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col space-y-2 px-6 py-5">
             {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-5 py-3 rounded-2xl text-sm font-bold tracking-widest uppercase transition-all duration-200 flex items-center border ${
                      isActive
                        ? "text-black bg-white border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        : "text-neutral-400 border-transparent hover:text-white hover:bg-white/5"
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 pt-[100px] md:pt-28 pb-12 w-full max-w-7xl mx-auto flex flex-col items-center">
        {/* Page Transition Wrapper */}
        <div className="w-full flex-grow animate-[fadeIn_0.5s_ease-out]">
          <Outlet />
        </div>
      </main>
      
      <style>
        {`
          .scbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}