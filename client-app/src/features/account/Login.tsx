import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { loginFormSchema } from "./accountFormSchema";
import agent from "../../app/api/agent";
import { User } from "../../app/models/user";
import AppLoading from "../../app/components/AppLoading";

declare let google: any;

function Login() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(loginFormSchema),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>();

  function storeUser(user: User) {
    const claims = JSON.parse(atob(user.token.split(".")[1]));
    const roles = typeof claims.role === "string" ? [claims.role] : claims.role;
    localStorage.setItem("user", JSON.stringify({ ...user, roles }));
    navigate("/user-profile");
  }

  const onSubmit = async ({ email, password }: FieldValues) => {
    try {
      const user = await agent.Account.login({ email, password });
      storeUser(user);
    } catch (error) {
      console.log(error);
      setError("Invalid email or password");
    }
  };

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
      callback: googleLogin,
    });

    google.accounts.id.renderButton(
      document.getElementById("buttonDiv"),
      {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "continue_with",
        shape: "pill",
        width: "100%", // Let it scale via CSS container
        longtitle: true,
        onsuccess: googleLogin,
        onfailure: (error: any) => {
          console.log(error);
        },
      }
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
  }, [navigate, window.location.search]);

  const googleLogin = async (response: any) => {
    try {
      const user = await agent.Account.googleLogin(response.credential);
      storeUser(user);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 md:px-8 relative overflow-hidden py-10 sm:py-12 md:py-16">
      <style>
        {`
          .animated-grid {
            position: absolute;
            width: 250%;
            height: 250%;
            top: -75%;
            left: -75%;
            background-size: 40px 40px;
            background-image: 
              linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px);
            transform: perspective(800px) rotateX(60deg);
            z-index: 0;
            pointer-events: none;
            -webkit-mask-image: linear-gradient(to bottom, transparent 20%, black 90%);
            mask-image: linear-gradient(to bottom, transparent 20%, black 90%);
          }
          @media (min-width: 768px) {
            .animated-grid {
              background-size: 50px 50px;
              width: 200%;
              height: 200%;
              top: -50%;
              left: -50%;
            }
          }
          .glass-panel {
            background: rgba(10, 10, 10, 0.75);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
          }
          .gradient-text {
            background: linear-gradient(135deg, #ffffff 0%, #a3a3a3 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}
      </style>

      {/* Grid Background */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-transparent to-black/60 z-10"></div>
         <div className="animated-grid"></div>
      </div>

      {/* Glow Effects */}
      <div className="absolute top-0 right-0 sm:right-1/4 w-64 md:w-96 h-64 md:h-96 bg-white/[0.04] rounded-full blur-[100px] md:blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 sm:left-1/4 w-64 md:w-96 h-64 md:h-96 bg-white/[0.02] rounded-full blur-[80px] md:blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 max-w-6xl w-full">
        {/* Left side - branding */}
        <div className="hidden lg:flex flex-col flex-1 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit mb-6 sm:mb-8 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span className="text-white/70 text-xs font-medium tracking-wide uppercase">Attendance Reimagined</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight gradient-text">
            Count Me In
          </h1>
          <p className="text-neutral-400 text-base md:text-lg leading-relaxed mt-4 sm:mt-6 font-light">
            Revolutionize attendance tracking. Designed for University of The
            Gambia lecturers &mdash; students scan, attendance logs. Simple, fair,
            effortless.
          </p>
          <div className="mt-8 sm:mt-10 flex items-center gap-4 border-l-2 border-white/20 pl-4 py-1">
            <span className="text-neutral-300 text-xs sm:text-sm tracking-widest uppercase font-semibold">Scan. Attend. Done.</span>
          </div>
        </div>

        {/* Right side - card */}
        <div className="w-full max-w-md lg:ml-auto">
          {/* Mobile branding header */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight gradient-text">Count Me In</h1>
            <p className="text-neutral-400 text-sm mt-3">Attendance Reimagined</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden group">
            {/* Subtle highlight effect on top edge */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

            {/* Header */}
            <div className="mb-8 md:mb-10 text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-neutral-400 text-xs sm:text-sm">
                Enter your details to access your account
              </p>
            </div>

            {/* Google sign-in */}
            <div
              id="buttonDiv"
              className="w-full flex items-center justify-center mb-6 sm:mb-8 [&>div]:!w-full drop-shadow-md hover:drop-shadow-xl transition-all duration-300 overflow-hidden rounded-full"
            ></div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6 sm:mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10"></div>
              <span className="text-[10px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wider">Or email</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10"></div>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] sm:text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">Email</label>
                <input
                  className="w-full text-sm text-white placeholder-neutral-600 px-4 sm:px-5 py-3.5 sm:py-4 bg-black/40 border border-white/10 rounded-2xl focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all appearance-none"
                  type="email"
                  inputMode="email"
                  pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1.5 pl-1">
                    {errors.email?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] sm:text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">Password</label>
                  <a href="#" className="text-xs text-neutral-500 hover:text-white transition-colors">Forgot?</a>
                </div>
                <div className="relative">
                  <input
                    {...register("password")}
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    className="w-full text-sm text-white placeholder-neutral-600 px-4 sm:px-5 py-3.5 sm:py-4 bg-black/40 border border-white/10 rounded-2xl focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all pr-[70px] appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-4 sm:px-5 flex items-center outline-none group/btn"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 group-hover/btn:text-white transition-colors">
                      {showPassword ? "Hide" : "Show"}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1.5 pl-1">
                    {errors.password?.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2 mt-4">
                  <span className="text-red-300 text-xs sm:text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full relative overflow-hidden bg-white text-black font-bold text-xs sm:text-sm tracking-wide uppercase rounded-2xl py-3.5 sm:py-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] mt-6 sm:mt-8 group/btn2"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn2:animate-[shimmer_1.5s_infinite]"></div>
                <div className="relative flex items-center justify-center gap-3">
                  {isSubmitting ? (
                    <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-black/20 border-t-black animate-spin rounded-full"></div>
                  ) : (
                    <span>Sign In Securely</span>
                  )}
                </div>
              </button>

              <div className="pt-4 sm:pt-5 text-center">
                <p className="text-xs sm:text-sm font-medium text-neutral-500">
                  New here?{" "}
                  <Link
                    to="/signup"
                    className="text-white hover:text-neutral-300 font-bold transition-colors underline decoration-white/30 underline-offset-4"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-6 sm:mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-neutral-600 text-[9px] sm:text-[10px] font-medium tracking-widest uppercase">
                &copy; {new Date().getFullYear()} Gibril Crookes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
