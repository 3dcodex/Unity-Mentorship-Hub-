
import React from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

const AccessibleResources: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <PublicHeader />
      <main className="flex-1 animate-in fade-in duration-700">
        <section className="py-8 sm:py-12 md:py-20 px-6 bg-gradient-to-b from-indigo-50 to-white">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 md:space-y-8">
            <div className="inline-flex px-4 py-2 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest">Accessibility First</div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl md:text-6xl font-black text-gray-900 leading-tight">Accessible Resources</h1>
            <p className="text-base sm:text-base sm:text-lg md:text-xl text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto">
              We believe knowledge should have no barriers. Every tool and guide is designed with WCAG compliance and universal design principles.
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-6 sm:py-10 md:py-16 md:py-24 px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-6 sm:p-4 sm:p-6 md:p-8 md:p-12">
            <FeatureBlock 
              icon="format_size" 
              title="Readability" 
              desc="We use Lexend, a font specifically designed to improve reading proficiency and reduce visual stress for diverse readers." 
            />
            <FeatureBlock 
              icon="text_to_speech" 
              title="Screen Reader Optimized" 
              desc="Every button, image, and link is aria-labeled and semantic to ensure a seamless experience for visually impaired users." 
            />
            <FeatureBlock 
              icon="palette" 
              title="High Contrast" 
              desc="Our color palette ensures text is always legible, meeting AAA contrast standards for maximum readability." 
            />
          </div>
        </section>

        <section className="py-8 sm:py-6 sm:py-10 md:py-16 md:py-24 bg-gray-50 px-6">
          <div className="max-w-5xl mx-auto bg-white rounded-[48px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 md:p-20 shadow-xl border border-gray-100 flex flex-col md:flex-row items-center gap-4 sm:gap-8 md:gap-16">
            <div className="flex-1 space-y-4 sm:space-y-6 md:space-y-8">
              <h2 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">Resource Library</h2>
              <p className="text-gray-500 font-medium text-base sm:text-lg leading-relaxed">
                Our library includes hundreds of guides, all available in multiple formats including audio summaries and simplified text versions for neurodivergent learners.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-gray-700 font-black">
                   <span className="material-symbols-outlined text-indigo-600">check_circle</span>
                   Multi-format downloads (PDF, MP3, Braille-Ready)
                </div>
                <div className="flex items-center gap-4 text-gray-700 font-black">
                   <span className="material-symbols-outlined text-indigo-600">check_circle</span>
                   Closed captioning on all video workshops
                </div>
                <div className="flex items-center gap-4 text-gray-700 font-black">
                   <span className="material-symbols-outlined text-indigo-600">check_circle</span>
                   One-click simplification of complex text
                </div>
              </div>
            </div>
            <div className="size-64 md:size-80 bg-indigo-600 rounded-2xl sm:rounded-3xl md:rounded-[60px] flex items-center justify-center rotate-3 shadow-2xl">
               <span className="material-symbols-outlined text-white text-[120px]">universal_accessibility</span>
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-16 md:py-32 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8 md:space-y-10">
            <h2 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900">Need a specific accommodation?</h2>
            <p className="text-gray-500 font-medium text-base sm:text-lg">Our accessibility team is always listening. If you encounter a barrier, we'll fix it within 48 hours.</p>
            <button className="bg-primary text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
              Contact Accessibility Team
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const FeatureBlock: React.FC<{ icon: string, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="p-10 bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-100 shadow-sm space-y-6 hover:shadow-xl transition-all group">
    <div className="size-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
       <span className="material-symbols-outlined text-xl sm:text-2xl md:text-3xl">{icon}</span>
    </div>
    <h3 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black text-gray-900">{title}</h3>
    <p className="text-gray-500 font-medium leading-relaxed">{desc}</p>
  </div>
);

export default AccessibleResources;
