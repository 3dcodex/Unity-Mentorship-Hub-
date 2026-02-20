
import React from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

const About: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
      <PublicHeader />

      <main className="flex-1">
      {/* Hero Section */}
      <section className="relative h-48 sm:h-80 md:h-[600px] overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=1600" 
          className="absolute inset-0 w-full h-full object-cover"
          alt="Team meeting"
        />
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 text-white animate-in slide-in-from-bottom-8 duration-700">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
            Empowering Every <br/> Student's Journey
          </h1>
          <p className="text-base sm:text-lg md:text-xl font-medium opacity-90 max-w-2xl mx-auto leading-relaxed">
            Born from a vision of diversity, equity, and belonging, UnityMentor Hub is more than a platform—it's a community dedicated to your growth.
          </p>
          <button className="bg-primary text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-xl font-bold shadow-2xl hover:scale-105 transition-all text-sm sm:text-base">
            Our Impact
          </button>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="py-8 sm:py-16 md:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 sm:mb-12 md:mb-20">
            <p className="text-[8px] sm:text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 sm:mb-3">The Background</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4">Our Journey</h2>
            <p className="text-sm sm:text-base text-gray-500 font-medium">How a simple idea at St. Lawrence College became a movement for inclusion.</p>
          </div>

          <div className="space-y-6 sm:space-y-8 md:space-y-16 relative">
            {/* Timeline Line */}
            <div className="absolute left-[20px] top-4 bottom-4 w-0.5 bg-gray-100"></div>

            <TimelineItem 
              icon="location_on"
              title="The Spark at St. Lawrence College"
              date="Winter 2023"
              text="Founded by Blessing, Ethan, and Julio. As students ourselves, we noticed a critical gap in professional support for underrepresented groups. We wanted to build something that felt like family."
            />
            <TimelineItem 
              icon="architecture"
              title="Building the Foundation"
              date="Summer 2023"
              text="We worked tirelessly to develop a mentorship ecosystem that prioritizes diversity, equity, and inclusion (DEI). We spoke to hundreds of students to understand their unique barriers."
            />
            <TimelineItem 
              icon="rocket_launch"
              title="UnityMentor Hub Today"
              date="Present Day"
              text="Today, we are connecting students with life-changing resources and a professional network that truly reflects the diversity of the modern workforce."
            />
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-8 sm:py-6 sm:py-10 md:py-16 md:py-24 px-6 bg-blue-50">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl sm:rounded-3xl md:rounded-[60px] p-6 sm:p-4 sm:p-6 md:p-8 md:p-6 sm:p-8 md:p-12 lg:p-24 text-center shadow-xl shadow-blue-900/5 relative overflow-hidden">
          <div className="relative z-10 space-y-6 sm:space-y-8 md:space-y-10">
            <div className="text-primary flex justify-center">
              <span className="material-symbols-outlined text-6xl font-black">handshake</span>
            </div>
            <h2 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black">Our Community Mission</h2>
            <p className="text-base sm:text-base sm:text-lg md:text-xl text-gray-600 font-medium max-w-3xl mx-auto leading-relaxed">
              To foster an inclusive ecosystem where diversity is celebrated and mentorship is accessible to all. We believe in the power of <span className="text-primary font-bold italic underline">people helping people</span>—breaking down systemic barriers through authentic connection and shared knowledge.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8 pt-12">
              <Stat value="500+" label="Active Students" />
              <Stat value="120+" label="Industry Mentors" />
              <Stat value="15+" label="Partner Employers" />
            </div>
          </div>
        </div>
      </section>

      </main>
      <Footer variant="simple" />
    </div>
  );
};

const TimelineItem: React.FC<{ icon: string, title: string, date: string, text: string }> = ({ icon, title, date, text }) => (
  <div className="flex gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8 relative z-10">
    <div className="size-7 sm:size-9 md:size-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30 flex-shrink-0">
      <span className="material-symbols-outlined text-base sm:text-base sm:text-lg md:text-xl">{icon}</span>
    </div>
    <div className="space-y-2 pb-8">
      <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900 leading-tight">{title}</h3>
      <p className="text-sm font-bold text-primary">{date}</p>
      <p className="text-gray-500 font-medium leading-relaxed max-w-xl">{text}</p>
    </div>
  </div>
);

const Stat: React.FC<{ value: string, label: string }> = ({ value, label }) => (
  <div className="bg-blue-50/50 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[32px] border border-blue-100">
    <div className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-primary mb-2">{value}</div>
    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</div>
  </div>
);

export default About;
