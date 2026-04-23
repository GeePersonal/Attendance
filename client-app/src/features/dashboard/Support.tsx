import React, { useState, useRef, useEffect } from 'react';

export default function Support() {
  const [formData, setFormData] = useState({
    subject: '',
    email: '',
    message: '',
    category: 'support' // options: support, feature_request
  });
  const [submitted, setSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = [
    { id: 'support', name: 'General Support / Contact' },
    { id: 'feature_request', name: 'Feature Request / Suggestion' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission as there isn't a dedicated endpoint for this at the moment
    // In real app, we might fire an API call here.
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      alert("Thanks for your message! If you need immediate assistance, please email gibril.alafia@gmail.com directly.");
      setFormData({ subject: '', email: '', message: '', category: 'support' });
    }, 1000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8 animate-fade-in-up mt-8">
      <div className="relative">
        <div className="absolute -inset-1 blur-[60px] bg-gradient-to-r from-neutral-800 to-black opacity-50 z-0"></div>

        <div className="relative z-10 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl">
          <div className="mb-8 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-3xl font-light tracking-tight text-white mb-1">
                Support & Contact
              </h2>
              <p className="text-neutral-400 text-sm font-light">
                Need help or have a suggestion? Fill out the form below. For immediate assistance, email <a href="mailto:gibril.alafia@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">gibril.alafia@gmail.com</a>.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-neutral-300 text-xs uppercase tracking-wider font-semibold">
                Category
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-light text-left flex justify-between items-center"
                >
                  <span className="text-white">
                    {categories.find(c => c.id === formData.category)?.name}
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
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, category: c.id });
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/10 ${
                          formData.category === c.id ? "text-white bg-white/10" : "text-neutral-300 font-light"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-neutral-300 text-xs uppercase tracking-wider font-semibold">
                Your Email
              </label>
              <input
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-light placeholder:text-neutral-600"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-neutral-300 text-xs uppercase tracking-wider font-semibold">
                Subject
              </label>
              <input
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-light placeholder:text-neutral-600"
                type="text"
                placeholder="What is this regarding?"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-neutral-300 text-xs uppercase tracking-wider font-semibold">
                Message
              </label>
              <textarea
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all font-light placeholder:text-neutral-600 min-h-[150px]"
                placeholder="How can we help?"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitted}
              className="w-full bg-white text-black hover:bg-neutral-200 transition-colors rounded-xl px-4 py-4 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitted ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
