import { Outlet } from "react-router-dom";
import ScrollToTop from "./app/layout/ScrollToTop";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";

const App = () => {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <ScrollToTop />
      <div className="flex-grow">
        <Outlet />
      </div>
      <ToastContainer position={toast.POSITION.BOTTOM_RIGHT} />
      
      {/* Global Footer */}
      <footer className="w-full py-6 mt-auto text-center text-neutral-500 text-sm font-light">
        <p>&copy; {new Date().getFullYear()} All rights reserved. Powered by <span className="font-medium text-neutral-300">Gibril Crookes</span>.</p>
      </footer>
    </div>
  );
};

export default App;
