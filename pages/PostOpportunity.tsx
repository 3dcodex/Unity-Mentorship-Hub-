
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PostOpportunity: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      alert("Opportunity submitted for review!");
      navigate('/career');
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header>
        <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">Post an Opportunity</h1>
        <p className="text-gray-500 font-medium">Share internships, jobs, or volunteer roles with our community.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] p-10 border border-gray-100 shadow-xl space-y-6 sm:space-y-8 md:space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
          <Input label="Job Title" placeholder="e.g. Junior Web Developer" />
          <Input label="Company" placeholder="e.g. Stellar Tech" />
          <Input label="Location" placeholder="e.g. Remote / Toronto" />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Job Type</label>
            <select className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 appearance-none">
              <option>Internship</option>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Volunteer</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Description</label>
          <textarea rows={6} className="w-full bg-gray-50 border-none rounded-2xl p-6 text-sm font-medium focus:ring-2 focus:ring-primary/20" placeholder="Tell us about the role and why it's a great fit for diverse talent..." />
        </div>

        <div className="pt-8 flex justify-end gap-4">
          <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 text-gray-500 font-black">Cancel</button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-primary text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Opportunity'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Input: React.FC<{ label: string, placeholder: string }> = ({ label, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
    <input type="text" placeholder={placeholder} className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all" />
  </div>
);

export default PostOpportunity;
