import QRCode from "react-qr-code";
import agent from "../../app/api/agent";
import { useEffect, useState } from "react";
import { Session } from "../../app/models/session";
import { useLocation } from "react-router-dom";
import AppLoading from "../../app/components/AppLoading";
import { format } from "date-fns";

export default function CurrentSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { state } = useLocation();
  let refreshTokenTimeout: any = null;

  const [hostURL, setHostURL] = useState("");

  useEffect(() => {
    const baseUrl = window.location.origin;
    setHostURL(baseUrl);
  }, [window.location.search, window.location.origin, state]);

  const copyToClipboard = () => {
    if (session?.linkToken) {
      navigator.clipboard.writeText(hostURL + "?linkToken=" + session?.linkToken);
    } else {
      navigator.clipboard.writeText(hostURL);
    }
    setIsCopied(true);
  };

  useEffect(() => {
    if (session && session.regenerateLinkToken) {
      refreshLinkTokenTimer(session);
    }
    return () => {
      stopRefreshTokenTimer();
    };
  }, [session]);

  const refreshLinkToken = async () => {
    stopRefreshTokenTimer();
    try {
      const result = await agent.Session.refreshLinkToken(session?.sessionId!);
      if (result) {
        setSession(result);
        refreshLinkTokenTimer(result);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const refreshLinkTokenTimer = (sessionObj: Session) => {
    refreshTokenTimeout = setTimeout(
      refreshLinkToken,
      sessionObj.linkExpiryFreequency * 1000 - 2000
    );
  };

  const stopRefreshTokenTimer = () => {
    if (refreshTokenTimeout) clearTimeout(refreshTokenTimeout);
  };

  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  useEffect(() => {
    const getCurrentSession = async () => {
      try {
        setLoading(true);
        const currentSession = await agent.Session.getCurrentSession();
        setSession(currentSession);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    if (state && state.session) {
      setSession(state.session);
    } else {
      getCurrentSession();
    }
  }, [state]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center w-full">
         <div className="w-8 h-8 border-2 border-black/20 border-t-black animate-spin rounded-full"></div>
      </div>
    );
  }

  const qrValue = hostURL + (session?.linkToken ? "?linkToken=" + session?.linkToken : "");

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-0">
      {/* Premium Black & White Card */}
      <div className="bg-black text-white rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-neutral-800 group">
        
        {/* Subtle decorative glow for dimension */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/[0.04] rounded-full blur-[100px] pointer-events-none transition-all duration-1000 group-hover:bg-white/[0.06]"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/[0.03] rounded-full blur-[80px] pointer-events-none transition-all duration-1000 group-hover:bg-white/[0.04]"></div>

        {/* Animated subtle grid overlay inside the card to tie into the theme */}
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        {session ? (
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-16">
            
            {/* Left: Info Section */}
            <div className="flex-1 flex flex-col justify-center text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 w-fit mx-auto md:mx-0 mb-6 shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]"></span>
                <span className="text-white text-xs font-bold tracking-widest uppercase">Live Session</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-400">
                {session.sessionName}
              </h2>
              
              <div className="flex flex-col gap-2 mt-2 pt-6 border-t border-white/10">
                <p className="text-xs tracking-widest uppercase font-semibold text-neutral-500">Session Expiry</p>
                <div className="flex items-baseline gap-3 justify-center md:justify-start">
                  <p className="text-xl sm:text-2xl font-light text-neutral-200">
                    {format(new Date(session.sessionExpiresAt), "MMMM do, yyyy")}
                  </p>
                  <span className="text-lg font-bold text-white bg-white/10 px-3 py-1 rounded-lg border border-white/5">
                    {format(new Date(session.sessionExpiresAt), "h:mm a")}
                  </span>
                </div>
              </div>

              <div className="mt-8 mb-4 hidden md:block">
                <p className="text-sm text-neutral-400 font-medium tracking-wide">
                  Students can scan the QR code to log their attendance instantly.
                </p>
              </div>
            </div>

            {/* Right: QR Code & Actions */}
            <div className="flex flex-col items-center shrink-0 w-full md:w-auto relative">
              {/* QR Container */}
              <div className="bg-white p-5 sm:p-7 rounded-[2rem] shadow-[0_0_40px_rgba(255,255,255,0.15)] relative group/qr transition-transform duration-500 hover:scale-[1.02]">
                <div className="w-48 h-48 sm:w-64 sm:h-64 transition-opacity duration-300">
                  <QRCode
                    className="w-full h-full object-cover"
                    value={qrValue}
                    level="H"
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                  />
                </div>
                
                {/* Futuristic Scanner Corners Decoration */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-black rounded-tl-2xl -translate-x-2 -translate-y-2 opacity-0 group-hover/qr:opacity-100 group-hover/qr:-translate-x-3 group-hover/qr:-translate-y-3 transition-all duration-300"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-black rounded-tr-2xl translate-x-2 -translate-y-2 opacity-0 group-hover/qr:opacity-100 group-hover/qr:translate-x-3 group-hover/qr:-translate-y-3 transition-all duration-300"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-black rounded-bl-2xl -translate-x-2 translate-y-2 opacity-0 group-hover/qr:opacity-100 group-hover/qr:-translate-x-3 group-hover/qr:translate-y-3 transition-all duration-300"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-black rounded-br-2xl translate-x-2 translate-y-2 opacity-0 group-hover/qr:opacity-100 group-hover/qr:translate-x-3 group-hover/qr:translate-y-3 transition-all duration-300"></div>
              </div>

              {/* Action Button */}
              <button
                onClick={copyToClipboard}
                className="mt-8 w-full max-w-[16rem] group/btn relative overflow-hidden rounded-2xl bg-white text-black py-4 px-6 font-bold text-sm tracking-wider uppercase transition-all duration-300 hover:bg-neutral-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                <span className="relative flex items-center justify-center gap-2">
                  {isCopied ? (
                    <>
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Link
                    </>
                  )}
                </span>
              </button>
            </div>

          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]">
               <svg className="w-10 h-10 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-500">
              No Active Session
            </h2>
            <p className="text-neutral-400 max-w-md mx-auto text-base">
              It looks like you don't have a session running right now. Head over to the generator to start one.
            </p>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </div>
  );
}
