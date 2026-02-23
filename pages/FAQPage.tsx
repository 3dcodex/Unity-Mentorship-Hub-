import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQPage: React.FC = () => {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I sign up for Unity Mentorship Hub?',
      answer: 'Click the "Sign Up" button in the top right corner, fill in your details, and verify your email. You can then complete your profile and start connecting with mentors.',
      category: 'getting-started',
    },
    {
      id: '2',
      question: 'Is Unity Mentorship Hub free to use?',
      answer: 'Yes! Unity Mentorship Hub is completely free for students. We believe mentorship should be accessible to everyone.',
      category: 'getting-started',
    },
    {
      id: '3',
      question: 'How do I find the right mentor for me?',
      answer: 'Use our AI-powered matching system on the Mentorship page. Answer a few questions about your goals and interests, and we\'ll recommend mentors who are the best fit for you.',
      category: 'mentorship',
    },
    {
      id: '4',
      question: 'Can I have multiple mentors?',
      answer: 'Absolutely! You can connect with as many mentors as you like. Different mentors can help with different aspects of your journey.',
      category: 'mentorship',
    },
    {
      id: '5',
      question: 'How do I schedule a session with a mentor?',
      answer: 'Visit the mentor\'s profile, view their available time slots, and click "Book Session". You\'ll receive a confirmation email with meeting details.',
      category: 'mentorship',
    },
    {
      id: '6',
      question: 'What if I need to cancel a session?',
      answer: 'You can cancel up to 24 hours before the scheduled time from your Sessions page. Please be respectful of your mentor\'s time.',
      category: 'mentorship',
    },
    {
      id: '7',
      question: 'How does the Resume Builder work?',
      answer: 'Our AI-powered Resume Builder guides you through creating a professional resume. Fill in your information, choose a template, and download as PDF.',
      category: 'career',
    },
    {
      id: '8',
      question: 'Can I save multiple versions of my resume?',
      answer: 'Yes! Each time you click "Save Resume", a new version is created. Your most recent version is auto-saved continuously.',
      category: 'career',
    },
    {
      id: '9',
      question: 'How do I change my password?',
      answer: 'Go to Profile Settings > Account Overview > Change Password. You\'ll need to enter your current password and your new password.',
      category: 'account',
    },
    {
      id: '10',
      question: 'How do I delete my account?',
      answer: 'Go to Profile Settings > Account Overview > Delete Account. This action is permanent and cannot be undone.',
      category: 'account',
    },
    {
      id: '11',
      question: 'Is my data secure?',
      answer: 'Yes! We use industry-standard encryption and security practices. Your data is stored securely and never shared without your permission.',
      category: 'safety',
    },
    {
      id: '12',
      question: 'How do I report inappropriate behavior?',
      answer: 'Click the report button on any message or profile. Our team reviews all reports within 24 hours and takes appropriate action.',
      category: 'safety',
    },
  ];

  const categories = [
    { id: 'all', name: 'All Questions', icon: 'apps' },
    { id: 'getting-started', name: 'Getting Started', icon: 'rocket_launch' },
    { id: 'mentorship', name: 'Mentorship', icon: 'diversity_3' },
    { id: 'career', name: 'Career Tools', icon: 'work' },
    { id: 'account', name: 'Account', icon: 'person' },
    { id: 'safety', name: 'Safety', icon: 'shield' },
  ];

  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl mb-6 shadow-xl">
            <span className="material-symbols-outlined text-white text-4xl">quiz</span>
          </div>
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600 text-lg">Quick answers to common questions</p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4 mb-12">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all"
            >
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-50 transition-all"
              >
                <span className="font-black text-gray-900 pr-4">{faq.question}</span>
                <span className={`material-symbols-outlined text-purple-600 transition-transform ${openId === faq.id ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              {openId === faq.id && (
                <div className="px-6 pb-6 text-gray-600 animate-in slide-in-from-top-2">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Card */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-8 text-white text-center shadow-2xl">
          <h2 className="text-2xl font-black mb-3">Still have questions?</h2>
          <p className="text-purple-100 mb-6">Our support team is here to help you</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/help/contact')}
              className="bg-white text-purple-600 px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all"
            >
              Contact Support
            </button>
            <button
              onClick={() => navigate('/help')}
              className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-xl font-bold transition-all"
            >
              Help Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
