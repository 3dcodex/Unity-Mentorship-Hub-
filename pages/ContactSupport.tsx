
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ContactSupport: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => navigate('/help'), 3000);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto py-8 sm:py-6 sm:py-10 md:py-16 md:py-24 text-center space-y-4 sm:space-y-6 md:space-y-8 animate-in zoom-in duration-500">
        <div className="size-24 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-green-100">
          <span className="material-symbols-outlined text-2xl sm:text-3xl md:text-5xl font-black">send_and_archive</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">Message Received!</h1>
          <p className="text-gray-500 font-medium text-base sm:text-lg leading-relaxed">
            Thank you for reaching out. Our support team has been notified and we typically respond within 24 hours.
          </p>
        </div>
        <p className="text-xs font-bold text-gray-300 uppercase tracking-widest animate-pulse">Redirecting back to Help Center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header className="flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm hover:text-primary transition-all group">
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
        </button>
        <div>
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">Contact Support</h1>
          <p className="text-gray-500 font-medium">We're here to help you navigate your mentorship journey.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12">
        {/* Form Section */}
        <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/50 p-10 md:p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 space-y-6 sm:space-y-8 md:space-y-10">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Subject Category</label>
                <select className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer">
                  <option>General Inquiry</option>
                  <option>Account & Login Issues</option>
                  <option>Mentorship Matching</option>
                  <option>Technical Support</option>
                  <option>DEI & Safety Report</option>
                  <option>Partnership Requests</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Urgency</label>
                <select className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 appearance-none cursor-pointer">
                  <option>Low - Just a question</option>
                  <option>Medium - Affecting my experience</option>
                  <option>High - Urgent issue</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Subject</label>
              <input type="text" required placeholder="Brief summary of your request" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/10" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">How can we help?</label>
              <textarea rows={6} required placeholder="Please provide as much detail as possible..." className="w-full bg-gray-50 border-none rounded-2xl p-6 text-sm font-medium focus:ring-4 focus:ring-primary/10 resize-none" />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Attachments (Optional)</label>
              <div className="border-2 border-dashed border-gray-100 rounded-[24px] p-4 sm:p-6 md:p-8 text-center space-y-2 hover:bg-gray-50 transition-colors cursor-pointer group">
                <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">cloud_upload</span>
                <p className="text-xs font-bold text-gray-400">Click to upload or drag and drop screenshots</p>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  SENDING REQUEST...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span>
                  SUBMIT SUPPORT REQUEST
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info Section */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6 md:space-y-8">
          <section className="bg-gray-900 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-10 text-white space-y-4 sm:space-y-6 md:space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <span className="material-symbols-outlined text-[150px]">support_agent</span>
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black">Direct Contact</h3>
              <p className="text-gray-400 text-sm font-medium">Prefer email or socials? You can reach us here as well.</p>
            </div>
            
            <div className="space-y-4 relative z-10">
              <ContactMethod icon="mail" label="Support Email" value="help@unitymentor.com" />
              <ContactMethod icon="public" label="Community Forum" value="unity-hub.community" />
              <ContactMethod icon="alternate_email" label="Twitter / X" value="@UnityMentorHub" />
            </div>
          </section>

          <section className="bg-blue-50 rounded-2xl sm:rounded-3xl md:rounded-[40px] p-10 border border-blue-100 space-y-6">
            <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">lightbulb</span>
              Quick Tip
            </h3>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              Check our <button onClick={() => navigate('/help')} className="text-primary font-black hover:underline">FAQ section</button> before submitting. 70% of common questions are answered there instantly!
            </p>
            <div className="pt-4 border-t border-blue-100">
               <div className="flex items-center gap-4 text-primary">
                  <div className="size-7 sm:size-9 md:size-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-base sm:text-base sm:text-lg md:text-xl">verified</span>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase">Average Response Time</p>
                    <p className="text-base sm:text-lg font-black">Under 24 Hours</p>
                  </div>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const ContactMethod: React.FC<{ icon: string, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 group cursor-pointer">
    <div className="size-7 sm:size-9 md:size-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-primary transition-all">
      <span className="material-symbols-outlined text-base sm:text-lg">{icon}</span>
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  </div>
);

export default ContactSupport;
