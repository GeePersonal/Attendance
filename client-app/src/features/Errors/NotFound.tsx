import { Link, useLocation } from "react-router-dom";

function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-white/[0.04] rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-white/[0.02] rounded-full blur-[80px] pointer-events-none"></div>

      <div className="relative z-10 bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 max-w-2xl w-full text-center backdrop-blur-2xl shadow-2xl">
        <h1 className="text-8xl md:text-9xl font-extrabold tracking-tight bg-gradient-to-r from-white to-neutral-500 bg-clip-text text-transparent mb-4">404</h1>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Page not found</h2>
        <p className="text-neutral-400 text-lg md:text-xl font-light mb-10">
          Oops! The page you are looking for does not exist. It might have been moved or deleted.
        </p>
        <Link
          to={(location.state as any)?.from ?? "/login"}
          className="inline-block px-8 py-4 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all border border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          Take Me Back Home
        </Link>
      </div>
    </div>
  );
}
export default NotFound;
