
import React from 'react';
import PublicHeader from '../components/PublicHeader';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const SafeSpaces: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PublicHeader />
      <main className="flex-1 animate-in fade-in duration-700">
        <section className="py-8 sm:py-12 md:py-20 px-6 bg-gradient-to-b from-green-50 to-white text-center">
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
            <div className="inline-flex px-4 py-2 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest">Trust & Safety</div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl md:text-6xl font-black text-gray-900 leading-tight">Safe Spaces</h1>
            <p className="text-base sm:text-base sm:text-lg md:text-xl text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto">
              We cultivate environments where every identity is celebrated and every voice is respected. Safety is not a feature; it's our foundation.
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-6 sm:py-10 md:py-16 md:py-24 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20">
            <div className="space-y-6 sm:space-y-8 md:space-y-12">
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">Zero-Tolerance Policy</h2>
                <p className="text-base sm:text-lg text-gray-500 font-medium leading-relaxed">
                  Harassment, discrimination, or any form of hate speech is strictly prohibited. We use a combination of AI monitoring and human moderation to keep our community safe.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                 <Guideline icon="verified_user" title="Vetted Community" desc="Every mentor and member undergoes an identity verification process." />
                 <Guideline icon="lock" title="Private Sessions" desc="Mentorship discussions are encrypted and strictly confidential." />
                 <Guideline icon="campaign" title="Anonymized Reporting" desc="Report any issues anonymously to our Safety Board for immediate review." />
              </div>
            </div>
            <div className="bg-gray-900 rounded-[48px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 text-white space-y-6 sm:space-y-8 md:space-y-10 flex flex-col justify-center">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight">The Unity Safe Seal</h3>
              <p className="text-gray-400 font-medium text-base sm:text-lg leading-relaxed">
                Organizations and student groups that meet our DEI and safety standards are awarded the Unity Safe Seal, making them easy to identify in our directory.
              </p>
              <div className="p-4 sm:p-6 md:p-8 border-2 border-green-500/20 rounded-xl sm:rounded-2xl md:rounded-[32px] bg-green-500/5 flex items-center gap-6">
                 <span className="material-symbols-outlined text-green-500 text-6xl">verified</span>
                 <div>
                    <p className="text-base sm:text-base sm:text-lg md:text-xl font-black">Trusted Space</p>
                    <p className="text-sm font-bold opacity-60">Verified by UnityMentor Hub Board</p>
                 </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-6 sm:py-10 md:py-16 md:py-24 bg-gray-50 px-6">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 md:space-y-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black">Ready to join our community?</h2>
            <p className="text-gray-500 font-medium text-base sm:text-lg">By joining, you agree to uphold our Community Standards and champion an environment of mutual respect.</p>
            <button className="bg-primary text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
              <Link to="/signup" className="bg-primary dark:bg-blue-600 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-2xl text-xs sm:text-sm font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                Agree & Sign Up
              </Link>
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const Guideline: React.FC<{ icon: string, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="flex gap-6 p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
    <div className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
       <span className="material-symbols-outlined">{icon}</span>
    </div>
    <div className="space-y-1">
      <h4 className="text-base sm:text-lg font-black text-gray-900">{title}</h4>
      <p className="text-sm text-gray-500 font-medium">{desc}</p>
    </div>
  </div>
);

export default SafeSpaces;
