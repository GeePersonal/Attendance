import { yupResolver } from "@hookform/resolvers/yup";
import { FieldValues, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { createClassSchema } from "./classFormSchema";
import { ClassFormValues } from "../../app/models/class";
import agent from "../../app/api/agent";
import { useEffect, useState } from "react";
import AppLoading from "../../app/components/AppLoading";

function CreateClassForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { id } = useParams<{ id: string }>();

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(createClassSchema),
  });

  useEffect(() => {
    if (id) {
      const fetchClass = async () => {
        try {
          setLoading(true);
          const existing = await agent.Class.getClass(id);
          if (existing) {
            reset({ name: existing.name, description: existing.description ?? "" });
          }
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      };
      fetchClass();
    }
  }, [id, reset]);

  const onSubmit = async (data: FieldValues) => {
    const formClass: ClassFormValues = {
      name: data.name,
      description: data.description || undefined,
    };

    try {
      setLoading(true);
      if (id) {
        await agent.Class.updateClass(id, formClass);
      } else {
        await agent.Class.createClass(formClass);
      }
      navigate("/user-profile/classes");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AppLoading />;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8 animate-fade-in-up">
      <div className="relative">
        <div className="absolute -inset-1 blur-[60px] bg-gradient-to-r from-neutral-800 to-black opacity-50 z-0"></div>

        <div className="relative z-10 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-3xl font-light tracking-tight text-white mb-2">
              {id ? "Update Class" : "Create Class"}
            </h2>
            <p className="text-neutral-400 text-sm font-light">
              {id
                ? "Update the details for this class."
                : "Create a class to group related sessions together."}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-neutral-300 text-xs uppercase tracking-wider font-semibold">
                Class Name
              </label>
              <input
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-light placeholder:text-neutral-600"
                type="text"
                placeholder="E.g. Computer Science 101"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-neutral-300 text-xs uppercase tracking-wider font-semibold flex items-center justify-between">
                <span>Description</span>
                <span className="text-neutral-500 font-normal normal-case">Optional</span>
              </label>
              <textarea
                rows={3}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-light placeholder:text-neutral-600 resize-none"
                placeholder="A brief description of this class..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl text-sm font-semibold text-black bg-white hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black focus:ring-offset-black transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{id ? "Save Changes" : "Create Class"}</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

export default CreateClassForm;
