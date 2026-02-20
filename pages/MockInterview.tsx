
import React, { useState, useEffect } from 'react';
import { generateInterviewQuestion } from '../services/geminiService';

const MockInterview: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [question, setQuestion] = useState<{question?: string, hint?: string}>({});
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const startInterview = async () => {
    setLoading(true);
    const q = await generateInterviewQuestion('Product Designer', 'Junior');
    setQuestion(q);
    setLoading(false);
    setIsActive(true);
    setTimer(0);
  };

  const nextQuestion = async () => {
    setLoading(true);
    const q = await generateInterviewQuestion('Product Designer', 'Junior');
    setQuestion(q);
    setLoading(false);
    setTimer(0);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in duration-700 space-y-6 sm:space-y-8 md:space-y-12">
      <header className="text-center space-y-4">
        <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">AI Interview Simulator</h1>
        <p className="text-gray-500 font-medium">Practice with industry-specific questions generated in real-time.</p>
      </header>

      {!isActive ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] p-16 border border-gray-100 shadow-xl text-center space-y-4 sm:space-y-6 md:space-y-8">
          <div className="size-24 bg-primary/10 rounded-xl sm:rounded-2xl md:rounded-[32px] flex items-center justify-center text-primary mx-auto">
            <span className="material-symbols-outlined text-2xl sm:text-3xl md:text-5xl">mic</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-black">Ready to start?</h2>
            <p className="text-gray-500 max-w-sm mx-auto">Make sure your microphone is working. We'll record your responses for AI feedback.</p>
          </div>
          <button 
            onClick={startInterview}
            className="bg-primary text-white px-12 py-5 rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-105 transition-all"
          >
            Start Practice Session
          </button>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
           <div className="bg-gray-900 rounded-2xl sm:rounded-3xl md:rounded-[40px] aspect-video relative overflow-hidden shadow-2xl flex items-center justify-center">
              <div className="absolute top-4 sm:p-6 md:p-8 left-8 flex items-center gap-3">
                 <div className="size-3 bg-red-500 rounded-full animate-pulse"></div>
                 <span className="text-white text-xs font-black uppercase tracking-widest">Live Recording</span>
              </div>
              <div className="absolute top-4 sm:p-6 md:p-8 right-8 text-white font-black text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl font-mono">{formatTime(timer)}</div>
              
              <div className="text-center p-6 sm:p-4 sm:p-6 md:p-8 md:p-12 space-y-4 sm:space-y-6 md:space-y-8 max-w-2xl">
                {loading ? (
                   <div className="flex flex-col items-center gap-4">
                      <div className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <p className="text-gray-400 text-sm font-bold animate-pulse">AI IS GENERATING NEXT QUESTION...</p>
                   </div>
                ) : (
                  <>
                    <h2 className="text-base sm:text-lg sm:text-base sm:text-base sm:text-lg md:text-xl md:text-2xl md:text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight animate-in slide-in-from-bottom-4">
                      "{question.question}"
                    </h2>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-left space-y-2 animate-in fade-in duration-1000 delay-500">
                       <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Interviewer Tip</p>
                       <p className="text-xs text-gray-300 italic">{question.hint}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="absolute bottom-8 flex gap-4">
                 <button className="size-8 sm:size-7 sm:size-9 md:size-10 md:size-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-all">
                    <span className="material-symbols-outlined">mic_off</span>
                 </button>
                 <button onClick={() => setIsActive(false)} className="px-8 bg-red-500 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-lg">End Interview</button>
                 <button onClick={nextQuestion} className="px-8 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest shadow-lg">Next Question</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MockInterview;
