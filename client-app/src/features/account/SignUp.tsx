import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { signupFormSchema } from "./accountFormSchema";
import agent from "../../app/api/agent";

function SignUp() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(signupFormSchema),
  });
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async ({
    firstName,
    lastName,
    email,
    password,
  }: FieldValues) => {
    try {
      console.log("submitting ", { firstName, lastName, email, password });
      await agent.Account.register({ firstName, lastName, email, password });
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 md:px-8 relative overflow-x-hidden overflow-y-auto py-10 sm:py-12 md:py-16">
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
            <span className="text-white/70 text-xs font-medium tracking-wide uppercase">Join The Future</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight gradient-text">
            Join Us
          </h1>
          <p className="text-neutral-400 text-base md:text-lg leading-relaxed mt-4 sm:mt-6 font-light">
            Create your account and start tracking attendance effortlessly.
            Built for University of The Gambia lecturers and students.
          </p>
          <div className="mt-8 sm:mt-10 flex items-center gap-4 border-l-2 border-white/20 pl-4 py-1">
            <span className="text-neutral-300 text-xs sm:text-sm tracking-widest uppercase font-semibold">Register. Create. Manage.</span>
          </div>
        </div>

        {/* Right side - card */}
        <div className="w-full max-w-md lg:ml-auto">
          {/* Mobile branding header */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight gradient-text">Join Us</h1>
            <p className="text-neutral-400 text-sm mt-3">Register. Create. Manage.</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden group">
            {/* Subtle highlight effect on top edge */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

            {/* Header */}
            <div className="mb-8 md:mb-10 text-center lg:text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-neutral-400 text-xs sm:text-sm">
                Fill in your details to get started
              </p>
            </div>

            {/* Sign Up form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] sm:text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">First Name</label>
                  <input
                    {...register("firstName")}
                    className="w-full text-sm text-white placeholder-neutral-600 px-4 sm:px-5 py-3.5 sm:py-4 bg-black/40 border border-white/10 rounded-2xl focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all appearance-none"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-red-400 text-xs mt-1.5 pl-1">
                      {errors.firstName?.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] sm:text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">Last Name</label>
                  <input
                    {...register("lastName")}
                    className="w-full text-sm text-white placeholder-neutral-600 px-4 sm:px-5 py-3.5 sm:py-4 bg-black/40 border border-white/10 rounded-2xl focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all appearance-none"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-xs mt-1.5 pl-1">
                      {errors.lastName?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] sm:text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">Email</label>
                <input
                  {...register("email")}
                  className="w-full text-sm text-white placeholder-neutral-600 px-4 sm:px-5 py-3.5 sm:py-4 bg-black/40 border border-white/10 rounded-2xl focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all appearance-none"
                  type="email"
                  inputMode="email"
                  pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1.5 pl-1">
                    {errors.email?.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] sm:text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">Password</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    placeholder="��������"
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

              <div className="space-y-1.5">
                <label className="block text-[10px] sm:text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">Confirm Password</label>
                <div className="relative">
                  <input
                    {...register("confirmPassword")}
                    placeholder="��������"
                    type={showPassword ? "text" : "password"}
                    className="w-full text-sm text-white placeholder-neutral-600 px-4 sm:px-5 py-3.5 sm:py-4 bg-black/40 border border-white/10 rounded-2xl focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all pr-[70px] appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-4 sm:px-5 flex items-center outline-none group/btn2"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 group-hover/btn2:text-white transition-colors">
                      {showPassword ? "Hide" : "Show"}
                    </span>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1.5 pl-1">
                    {errors.confirmPassword?.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full relative overflow-hidden bg-white text-black font-bold text-xs sm:text-sm tracking-wide uppercase rounded-2xl py-3.5 sm:py-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] mt-6 sm:mt-8 group/btn3"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn3:animate-[shimmer_1.5s_infinite]"></div>
                <div className="relative flex items-center justify-center gap-3">
                  {isSubmitting ? (
                    <div className="h-4 w-4 sm:h-5 sm:w-5 border-2 border-black/20 border-t-black animate-spin rounded-full"></div>
                  ) : (
                    <span>Create Secure Account</span>
                  )}
                </div>
              </button>

              <div className="pt-4 sm:pt-5 text-center">
                <p className="text-xs sm:text-sm font-medium text-neutral-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-white hover:text-neutral-300 font-bold transition-colors underline decoration-white/30 underline-offset-4"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </form>

            <div className="mt-6 sm:mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-neutral-600 text-[9px] sm:text-[10px] font-medium tracking-widest uppercase">
                � {new Date().getFullYear()} Gibril Crookes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
