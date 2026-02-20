import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

const PublicMentorship: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  const tracks = [
    {
      id: 'cultural',
      title: 'Cultural Mentorship Track',
      icon: 'diversity_1',
      color: 'from-purple-50 to-blue-50',
      description: 'Connect with mentors who understand your cultural background and identity. Discuss navigating university as a student from underrepresented communities.',
      benefits: [
        'Mentors from similar cultural backgrounds',
        'Discussions on identity and belonging',
        'Networking with cultural student groups',
        'Support navigating cultural differences on campus'
      ],
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'professional',
      title: 'Professional Mentorship Track',
      icon: 'work',
      color: 'from-blue-50 to-cyan-50',
      description: 'Receive guidance from industry professionals and career mentors. Get insights into career paths, resume reviews, and interview preparation.',
      benefits: [
        'Industry professionals as mentors',
        'Career exploration and planning',
        'Resume and LinkedIn review',
        'Interview preparation and mock interviews'
      ],
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'peer',
      title: 'Peer Mentorship Track',
      icon: 'people',
      color: 'from-green-50 to-emerald-50',
      description: 'Connect with successful peers who have navigated similar challenges. Share experiences, study strategies, and student life tips.',
      benefits: [
        'Mentors who recently succeeded in your program',
        'Study and academic strategies',
        'Work-life balance tips',
        'Community and friendship building'
      ],
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800'
    },
    {
      id: 'dei',
      title: 'DEI Mentorship Track',
      icon: 'favorite',
      color: 'from-pink-50 to-rose-50',
      description: 'Access specialized mentorship focused on diversity, equity, and inclusion initiatives. Support for underrepresented students.',
      benefits: [
        'Mentors committed to DEI values',
        'Safe and inclusive space',
        'Addressing discrimination and bias',
        'Leadership in diversity initiatives'
      ],
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans text-gray-900">
      <PublicHeader />
      <main className="flex-1">

      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
              Find Your Mentor
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
              Connect with experienced mentors who understand your journey. Whether you're looking for career guidance, cultural support, or academic help, we have the right mentor for you.
            </p>
          </div>
          <button
            onClick={() => navigate('/signup')}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white font-black rounded-xl sm:rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all text-sm sm:text-base"
          >
            Get Started Now
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black">How It Works</h2>
            <p className="text-gray-600 text-sm sm:text-base">Get matched with the perfect mentor in 3 easy steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                step: '1',
                title: 'Create Your Profile',
                desc: 'Tell us about yourself, your goals, and what you\'re looking for in a mentor.'
              },
              {
                step: '2',
                title: 'Get Matched',
                desc: 'Our algorithm matches you with compatible mentors based on your preferences and goals.'
              },
              {
                step: '3',
                title: 'Start Learning',
                desc: 'Connect with your mentor and begin your personalized mentorship journey today.'
              }
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity blur"></div>
                <div className="relative bg-white p-8 rounded-2xl border border-gray-200 space-y-4">
                  <div className="inline-flex items-center justify-center size-12 bg-primary text-white rounded-xl font-black text-lg">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-black">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:flex absolute -right-4 top-1/2 transform -translate-y-1/2 size-8 items-center justify-center bg-white border-2 border-gray-200 rounded-full text-gray-400">
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mentorship Tracks */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gray-50/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black">Mentorship Tracks</h2>
            <p className="text-gray-600 text-sm sm:text-base">Choose the mentorship experience that matches your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {tracks.map((track) => (
              <div
                key={track.id}
                onClick={() => setSelectedTrack(selectedTrack === track.id ? null : track.id)}
                className="group cursor-pointer"
              >
                <div className={`bg-gradient-to-br ${track.color} p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 space-y-4 transition-all hover:shadow-xl h-full`}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="size-10 sm:size-12 bg-white rounded-xl flex items-center justify-center text-primary font-black">
                          <span className="material-symbols-outlined text-lg sm:text-xl">{track.icon}</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black">{track.title}</h3>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{track.description}</p>
                    </div>
                  </div>

                  {selectedTrack === track.id && (
                    <div className="pt-6 border-t border-white/30 space-y-4 animate-in fade-in duration-300">
                      <h4 className="font-black text-sm">Key Benefits:</h4>
                      <ul className="space-y-2">
                        {track.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="material-symbols-outlined text-primary text-base flex-shrink-0 mt-0.5">check_circle</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/mentorship/tracks/${track.id}`);
                        }}
                        className="w-full mt-4 py-3 bg-primary text-white font-black rounded-lg hover:scale-105 transition-all text-sm"
                      >
                        Learn More
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black">Why Join UnityMentor?</h2>
              <div className="space-y-4">
                {[
                  'Personalized matching based on your goals',
                  'Diverse mentor pool from various backgrounds',
                  'Structured conversation guides',
                  'Progress tracking and goal setting',
                  'Community events and networking',
                  'Safe and inclusive environment'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="size-6 flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <span className="material-symbols-outlined text-xs text-primary">check</span>
                    </div>
                    <span className="text-sm sm:text-base text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=600"
                alt="Mentorship"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black">Ready to Find Your Mentor?</h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
            Join thousands of students who have transformed their university experience through meaningful mentorship connections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white font-black rounded-lg sm:rounded-xl hover:scale-105 transition-all text-sm sm:text-base"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/about')}
              className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-primary text-primary font-black rounded-lg sm:rounded-xl hover:bg-primary/5 transition-all text-sm sm:text-base"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
};

export default PublicMentorship;
