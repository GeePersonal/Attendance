import { useEffect, useState } from "react";
import agent from "../../app/api/agent";
import { Link, useNavigate } from "react-router-dom";
import { AttendanceLinkToken, Attendee } from "../../app/models/attendance";
import { toast } from "react-toastify";
import AppLoading from "../../app/components/AppLoading";

declare var google: any;

function Home() {
  const navigate = useNavigate();
  const [sessionInfo, setSessionInfo] = useState({
    sessionName: "",
    sessionId: "",
    host: "",
    expired: false,
    linkToken: "",
  });

  const [loading, setLoading] = useState(false);
  const [attendee, setAttendee] = useState<Attendee>();
  const [saved, setSaved] = useState(false);
  const [scanLocationName, setScanLocationName] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      console.log('[Location] Requesting geolocation...');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log('[Location] Coordinates captured:', { latitude, longitude });
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
              { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || '';
            const country = addr.country || '';
            const name = [city, country].filter(Boolean).join(', ') || data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            console.log('[Location] Resolved name:', name);
            setScanLocationName(name);
          } catch (err) {
            console.warn('[Location] Reverse geocoding failed:', err);
            setScanLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        },
        (err) => {
          console.warn('[Location] Failed to get location:', err.code, err.message);
          setScanLocationName(null);
        }
      );
    } else {
      console.warn('[Location] Geolocation not supported by this browser');
    }
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const linkToken = queryParams.get("linkToken");
    if (linkToken && linkToken?.split(".").length === 3) {
      localStorage.setItem("linkToken", JSON.stringify(linkToken));
      navigate("/");
    }
  }, [
    window.location.search,
    localStorage,
    agent.Attendance,
    setSessionInfo,
    setAttendee,
    setLoading,
    navigate,
  ]);

  useEffect(() => {
    const linkJwtToken: string = JSON.parse(localStorage.getItem("linkToken")!);
    if (!linkJwtToken || linkJwtToken.split(".").length !== 3) return;

    const decodedLinkToken: AttendanceLinkToken = JSON.parse(
      atob(linkJwtToken.split(".")[1])
    );

    setSessionInfo({
      sessionName: decodedLinkToken.unique_name,
      sessionId: decodedLinkToken.nameid,
      host: decodedLinkToken.given_name,
      expired: decodedLinkToken.exp * 1000 < Date.now(),
      linkToken: JSON.parse(localStorage.getItem("linkToken")!),
    });
  }, [
    localStorage,
    window.location.search,
    navigate,
    agent.Attendance,
    setSessionInfo,
    setAttendee,
    setLoading,
    navigate,
  ]);

  if (typeof google === "undefined") {
    return (
      <AppLoading text="App loading... If this is taking too long, please refresh!" />
    );
  }

  //google login
  useEffect(() => {
    google.accounts.id.initialize({
      client_id:
        "242008212164-j9kpnto3c30m8fn4u5vh7cj9q7koq5ph.apps.googleusercontent.com",
      callback: createAttendee,
    });

    google.accounts.id.renderButton(
      document.getElementById("buttonDiv"),
      {
        theme: "outline",
        size: "large",
        text: "continue_with",
        type: "standard",
        shape: "rectangular",
        width: "350",
        height: "50",
        longtitle: true,
        onsuccess: createAttendee,
        onfailure: (error: any) => {
          console.log(error);
        },
      } // customization attributes
    );

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed()) {
        console.log("Prompt was not displayed");
      } else if (notification.isSkippedMoment()) {
        console.log("Prompt was skipped");
      } else if (notification.isDismissedMoment()) {
        console.log("Prompt was dismissed");
      }
    });
  }, [createAttendee]);

  async function createAttendee(response: any) {
    try {
      setLoading(true);
      console.log('[Location] Sending to API - locationName:', scanLocationName);
      const newAttendee = await agent.Attendance.createAttendee(
        sessionInfo.sessionId,
        response.credential,
        sessionInfo.linkToken,
        scanLocationName
      );

      setAttendee(newAttendee);
      toast.success("You have successfully registered for this session!");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  function exitPageOnSave() {
    localStorage.removeItem("linkToken");
    setSaved(true);
  }

  if (loading) return <AppLoading />;

  if (saved) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white/[0.04] rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-white/[0.02] rounded-full blur-[80px] pointer-events-none"></div>
      <div className="relative z-10 bg-white/5 border border-white/10 rounded-3xl p-10 max-w-md w-full backdrop-blur-2xl shadow-2xl flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">You're All Set!</h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Your attendance has been saved. You can safely close this tab.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white/[0.04] rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-white/[0.02] rounded-full blur-[80px] pointer-events-none"></div>

      <div className="relative z-10 bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 max-w-md w-full backdrop-blur-2xl shadow-2xl">
        <div className="flex justify-center mb-8">
          <img src="/images/MyLogo.png" alt="Logo" className="w-30 h-20 opacity-90" />
        </div>

        <h1 className="text-2xl font-bold text-center text-white mb-6 tracking-tight">
          Hello there, Welcome!
        </h1>
        
        {attendee ? (
          <div
            className="flex bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4 text-sm text-green-400"
            role="alert"
          >
            <svg
              className="w-5 h-5 flex-shrink-0 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              ></path>
            </svg>
            <div>
              <span className="font-semibold text-green-300 block mb-1">
                {`${attendee.firstName} ${attendee.lastName} (${attendee.matNumber})`}
              </span>{" "}
              You have successfully registered for the '
              <span className="text-white font-medium">{sessionInfo.sessionName}</span>' session, hosted by <span className="text-white font-medium">{sessionInfo.host}</span>.
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-400 text-center leading-relaxed mt-4 mb-8 font-light">
            By continuing with Google, your name, email and MATNumber
            will be sent to the '<span className="text-white font-medium">{sessionInfo.sessionName}</span>' session, hosted by{" "}
            <span className="text-white font-medium">{sessionInfo.host}</span>, for registration purposes only.
          </p>
        )}

        {attendee ? (
          <div className="flex justify-center w-full my-4">
            <button
              onClick={exitPageOnSave}
              className="w-full py-3.5 px-6 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 border border-white/10 transition-all text-sm tracking-wide uppercase"
            >
              Save To Exit Page
            </button>
          </div>
        ) : (
          <div className="flex justify-center w-full my-4">
            <div
              id="buttonDiv"
              className="w-full flex justify-center [&>div]:!w-full [&_iframe]:!w-full overflow-hidden rounded-xl bg-white/5 border border-white/10 p-1"
            >
              {/* Google Button renders here */}
            </div>
          </div>
        )}

        {!attendee && sessionInfo.expired && (
          <div className="mt-8 space-y-4">
            <div
              className="flex bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-sm text-yellow-400"
              role="alert"
            >
              <svg
                className="w-5 h-5 flex-shrink-0 mr-3 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <div>
                <span className="font-semibold block mb-1 text-yellow-300">Invalid Link!</span> 
                This link is either expired or was not meant for you. Please re scan the QR code or contact the session host.
              </div>
            </div>
            <button className="w-full py-3.5 px-6 rounded-xl bg-white/5 text-neutral-300 font-medium hover:bg-white/10 hover:text-white border border-white/10 transition-all text-sm tracking-wide uppercase">
              Scan QR Code Again
            </button>
          </div>
        )}
        
        <p className="text-neutral-500 text-sm text-center mt-8 font-light">
          Interested in Hosting a Session?{" "}
          <Link
            to="/login"
            className="text-white hover:text-neutral-300 font-medium ml-1 transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
export default Home;
