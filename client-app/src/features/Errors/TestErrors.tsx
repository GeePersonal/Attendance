import axios from "axios";
import { useState } from "react";
import ValidationError from "./ValidationError";

function TestErrors() {
  const baseUrl = import.meta.env.VITE_API_URL;
  const [errors, setErrors] = useState<[] | undefined>(undefined);

  function handleNotFound() {
    axios
      .get(baseUrl + "/buggy/not-found")
      .catch((err) => console.log(err.response));
  }

  function handleBadRequest() {
    axios
      .get(baseUrl + "/buggy/bad-request")
      .catch((err) => console.log(err.response));
  }

  function handleServerError() {
    axios
      .get(baseUrl + "/buggy/server-error")
      .catch((err) => console.log(err.response));
  }

  function handleUnauthorised() {
    axios.get(baseUrl + "/buggy/unauthorised").catch((err) => console.log(err));
  }

  function handleValidationError() {
    axios
      .post(baseUrl + "/buggy/validation-error", {})
      .catch((err) => setErrors(err));
  }

  return (
    <div className="w-full mx-auto px-4 md:px-8 py-8 animate-fade-in-up">
      <div className="mb-10 text-center md:text-left">
        <h2 className="text-4xl font-light tracking-tight text-white mb-2">Error Testing</h2>
        <p className="text-neutral-500 font-light max-w-2xl">Use these buttons to trigger different API errors.</p>
      </div>

      <div className="glass-panel p-6 sm:p-8 md:p-10 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl relative overflow-hidden group">
        {/* Subtle highlight effect on top edge */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={handleNotFound}
            type="button"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-light"
          >
            Not Found
          </button>
          <button
            onClick={handleBadRequest}
            type="button"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-light"
          >
            Bad request
          </button>
          <button
            onClick={handleServerError}
            type="button"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-light"
          >
            Server error
          </button>
          <button
            onClick={handleUnauthorised}
            type="button"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-light"
          >
            Not authorized
          </button>
          <button
            onClick={handleValidationError}
            type="button"
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-light"
          >
            Validation Error
          </button>
        </div>
      </div>

      <div className="mt-8 max-w-2xl mx-auto">
        {errors && <ValidationError errors={errors} />}
      </div>
    </div>
  );
}

export default TestErrors;
