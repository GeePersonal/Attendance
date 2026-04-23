import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Tooltip from "../components/Tooltip";
import agent from "../../app/api/agent";
import { User } from "../../app/models/user";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

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

  const tourReady = useRef(false);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      popoverClass: "my-driver-theme",
      steps: [
        { 
          popover: { 
            title: "Welcome to CountMeIn 🎉", 
            description: `Let's take a quick visual tour to help you get started with the application.<br/>
              <div class="mt-4 flex justify-center">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-bounce text-white">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>`, 
            align: "start" 
          } 
        },
        { 
          element: "#tour-nav-classes", 
          onHighlightStarted: () => { navigate("/user-profile/classes"); },
          popover: { 
            title: "1. Add a Class 📚", 
            description: `First, head to <strong>Classes</strong> to set up your courses.<br/><br/>
              <div class="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
                <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 mb-2">
                  <svg class="w-6 h-6 text-blue-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p class="text-sm">Click the <strong>+ Create Class</strong> button inside to start.</p>
              </div>`, 
            side: "bottom", align: "start" 
          } 
        },
        { 
          element: "#tour-nav-generate-qr-code", 
          onHighlightStarted: () => { navigate("/user-profile/generate-qr-code"); },
          popover: { 
            title: "2. Add a Session & Generate QR ⏱️", 
            description: `Next, go to <strong>Generate QR Code</strong> to start a new session for your class.<br/><br/>
              <div class="p-3 bg-white/5 rounded-lg border border-white/10 text-center">
                <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-500/20 mb-2 relative overflow-hidden">
                  <svg class="w-6 h-6 text-green-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="absolute inset-0 rounded-full border-2 border-green-400/50 animate-ping"></div>
                </div>
                <p class="text-sm">Select your class and click <strong>Create Session</strong> to generate the code.</p>
              </div>`, 
            side: "bottom", align: "start" 
          } 
        },
        { 
          popover: { 
            title: "3. Scanning the QR Code 📱", 
            description: `Attendees will scan the generated QR code with their phones.<br/><br/>
              <div class="flex justify-center mt-2 mb-2 p-2 relative">
                <div class="w-24 h-24 border-2 border-dashed border-white/30 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <svg class="w-12 h-12 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
                  </svg>
                  <div class="absolute top-0 left-0 w-full h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
              <p class="text-center text-sm">Their attendance is recorded automatically in real-time!</p>`, 
            align: "center" 
          } 
        },
        { 
          element: "#tour-nav-current-session", 
          onHighlightStarted: () => { navigate("/user-profile/current-session"); },
          popover: { 
            title: "Track Live Attendance 📊", 
            description: "Watch attendees join in real-time under <strong>Current Session</strong>.", 
            side: "bottom", align: "start" 
          } 
        },
        { 
          element: "#tour-nav-session-history", 
          onHighlightStarted: () => { navigate("/user-profile/session-history"); },
          popover: { 
            title: "Session History 📈", 
            description: "Review past sessions, pull up historical attendance records, and analyze detailed activity logs.", 
            side: "bottom", align: "start" 
          } 
        },
        { 
          element: "#tour-user-profile", 
          onHighlightStarted: () => { navigate("/user-profile/profile"); },
          popover: { title: "User Profile & Settings", description: "Manage your personal profile and easily log out from this menu.", side: "bottom", align: "end" } 
        },
      ]
    });
    driverObj.drive();
  };

  useEffect(() => {
    // Prevent double invocation in React Strict mode
    if (tourReady.current) return;
    tourReady.current = true;

    const hasSeenTour = localStorage.getItem("hasSeenTour");
    if (!hasSeenTour) {
      setTimeout(() => {
        startTour();
        localStorage.setItem("hasSeenTour", "true");
      }, 1000); // give the page a brief moment to render
    }
  }, []);

  if (!user) return null;

  const navLinks = [
    { name: "Current Session", path: "/user-profile/current-session", id: "tour-nav-current-session" },
    { name: "Generate QR Code", path: "/user-profile/generate-qr-code", id: "tour-nav-generate-qr-code" },
    { name: "Session History", path: "/user-profile/session-history", id: "tour-nav-session-history" },
    { name: "Classes", path: "/user-profile/classes", id: "tour-nav-classes" },
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
              <img src="/images/MyLogo.png" alt="Logo" className="h-24 w-auto" />
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex flex-1 items-center justify-center space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  id={link.id}
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
                id="tour-user-profile"
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

      {/* Support Icon */}
      <button
        onClick={() => navigate("/user-profile/support")}
        className="fixed bottom-20 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 group"
        title="Support & Contact"
      >
        {/* Support tool tip effect */}
        <div className="absolute right-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 px-3 py-1.5 rounded-lg text-xs tracking-wider whitespace-nowrap hidden md:block">
          Support
        </div>
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Floating Help Button */}
      <button
        onClick={() => startTour()}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 group"
        title="Start Guided Tour"
      >
        <div className="absolute right-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/10 px-3 py-1.5 rounded-lg text-xs tracking-wider whitespace-nowrap hidden md:block">
          Tour
        </div>
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
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
          @keyframes scan {
            0% { transform: translateY(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(96px); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
}