import { yupResolver } from "@hookform/resolvers/yup";
import { FieldValues, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { createSessionSchema } from "./sessionFormSchema";
import { Session, SessionFormValues } from "../../app/models/session";
import { Class } from "../../app/models/class";
import agent from "../../app/api/agent";
import { useEffect, useState, useRef } from "react";
import AppLoading from "../../app/components/AppLoading";

function GenerateQRCodeForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session>();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const {
    reset,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(createSessionSchema),
  });

  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await agent.Class.getClasses();
        setClasses(response.items);
      } catch (error) {
        console.log(error);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (id) {
      const getSession = async () => {
        try {
          setLoading(true);
          const getSession = await agent.Session.getSession(id);
          if (getSession) {
            const {
              sessionName,
              sessionExpiresAt,
              regenerateLinkToken,
              linkExpiryFreequency,
              classId,
            } = getSession;
            reset({
              sessionName,
              sessionExpiresAt: new Date(sessionExpiresAt)
                .toISOString()
                .slice(0, 16),
              regenerateLinkToken: !regenerateLinkToken,
              linkExpiryFreequency,
            });
            if (classId) setSelectedClassId(classId);
          }
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      };
      getSession();
    }
  }, [id, reset]);

  const onSubmit = async (data: FieldValues) => {
    const {
      sessionName,
      sessionExpiresAt,
      linkExpiryFreequency,
      regenerateLinkToken,
    } = data as SessionFormValues;

    let formSession: SessionFormValues = {
      sessionName,
      sessionExpiresAt,
      regenerateLinkToken: !regenerateLinkToken,
      linkExpiryFreequency,
      classId: selectedClassId || undefined,
    };

    try {
      setLoading(true);
      if (id) {
        const updatedSession = await agent.Session.updateSession(
          id,
          formSession
        );
        setSession(updatedSession);
      } else {
        const newSession = await agent.Session.createSession(formSession);
        setSession(newSession);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      navigate("/user-profile/current-session", { state: { session } });
    }
  };

  if (loading) return <AppLoading />;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8 animate-fade-in-up">
      <div className="relative">
        {/* Glow behind form */}
        <div className="absolute -inset-1 blur-[60px] bg-gradient-to-r from-neutral-800 to-black opacity-50 z-0"></div>

        <div className="relative z-10 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-light tracking-tight text-white mb-2">
              {id ? "Update Session" : "Create Session"}
            </h2>
            <p className="text-neutral-400 text-sm font-light">
              Configure the details for your secure attendance session.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-neutral-300 text-xs uppercase tracking-wider font-semibold">
                Session Name
              </label>
              <input
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-light placeholder:text-neutral-600"
                type="text"
                placeholder="E.g. Computer Science 101 - Week 4"
                {...register("sessionName")}
              />
              {errors.sessionName && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.sessionName.message}
                </p>
              )}
            </div>

            {classes.length > 0 && (
              <div className="space-y-2">
                <label className="block text-neutral-300 text-xs uppercase tracking-wider font-semibold flex items-center justify-between">
                  <span>Class</span>
                  <span className="text-neutral-500 font-normal normal-case">Optional</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-light text-left flex justify-between items-center"
                  >
                    <span className={selectedClassId ? "text-white" : "text-neutral-400"}>
                      {selectedClassId 
                        ? classes.find((c) => c.classId === selectedClassId)?.name 
                        : "No class"}
                    </span>
                    <svg
                      className={`w-4 h-4 text-neutral-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-20 w-full mt-2 bg-[#121212] border border-white/10 rounded-xl shadow-2xl py-1 max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClassId("");
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${!selectedClassId ? "text-white bg-white/10" : "text-neutral-300 font-light"}`}
                      >
                        No class
                      </button>
                      {classes.map((cls) => (
                        <button
                          key={cls.classId}
                          type="button"
                          onClick={() => {
                            setSelectedClassId(cls.classId);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${selectedClassId === cls.classId ? "text-white bg-white/10" : "text-neutral-300 font-light"}`}
                        >
                          {cls.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-neutral-300 text-xs uppercase tracking-wider font-semibold">
                Expires at
              </label>
              {/* Note: Webkit datetime-local styling requires some specific rules for dark mode, using color-scheme dark fixes calendar icon color */}
              <input
                style={{ colorScheme: "dark" }}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-light placeholder:text-neutral-600"
                type="datetime-local"
                {...register("sessionExpiresAt")}
                defaultValue={new Date(Date.now() + 2 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 16)}
              />
              {errors.sessionExpiresAt && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.sessionExpiresAt.message}
                </p>
              )}
            </div>

            {!watch("regenerateLinkToken") && (
              <div className="space-y-2">
                <label className="block text-neutral-300 text-xs uppercase tracking-wider font-semibold flex items-center justify-between">
                  <span>Regenerate after (seconds)</span>
                  <span className="text-neutral-500 font-normal normal-case">Optional</span>
                </label>
                <input
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-light placeholder:text-neutral-600"
                  type="number"
                  placeholder="30"
                  {...register("linkExpiryFreequency")}
                  defaultValue={30}
                />
                {errors.linkExpiryFreequency && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.linkExpiryFreequency.message}
                  </p>
                )}
              </div>
            )}

            <div className="pt-2">
              <label className="group flex items-center cursor-pointer relative">
                <div className="relative flex items-center">
                  <input
                    className="peer sr-opacity-0 w-5 h-5 opacity-0 absolute"
                    type="checkbox"
                    {...register("regenerateLinkToken")}
                  />
                  <div className="w-6 h-6 border-2 border-white/20 rounded bg-white/5 peer-checked:bg-white peer-checked:border-white transition-all flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-black opacity-0 peer-checked:opacity-100 transition-opacity"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span className="ml-3 text-neutral-300 font-light text-sm select-none group-hover:text-white transition-colors">
                  Static QR Code (Do not auto-regenerate token)
                </span>
              </label>
            </div>

            {watch("regenerateLinkToken") && (
              <div
                className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-4 mt-4"
                role="alert"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-sm text-neutral-300 font-light">
                  <span className="font-semibold text-white">Recommendation:</span> It is highly advised to allow token regeneration to prevent link sharing and ensure physical attendance.
                </div>
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-2xl text-sm font-semibold text-black bg-white hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-black transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{id ? "Save Changes" : "Generate Session"}</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
export default GenerateQRCodeForm;
