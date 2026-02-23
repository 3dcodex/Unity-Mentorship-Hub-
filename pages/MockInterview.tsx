import React, { useState, useEffect } from 'react';
import { generateInterviewQuestion } from '../services/geminiService';
import { useAuth } from '../App';
import { db } from '../src/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface Question {
  question: string;
  hint: string;
}

const MockInterview: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<'setup' | 'interview' | 'complete'>('setup');
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [level, setLevel] = useState('Junior');
  const [industry, setIndustry] = useState('Technology');
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [totalQuestions] = useState(5);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    let interval: any;
    if (step === 'interview') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const startInterview = async () => {
    setLoading(true);
    setStep('interview');
    setQuestionCount(1);
    setTimer(0);
    const q = await generateInterviewQuestion(jobRole, level);
    setQuestion(q);
    setLoading(false);
  };

  const nextQuestion = async () => {
    if (currentAnswer.trim()) {
      setAnswers([...answers, currentAnswer]);
      setCurrentAnswer('');
    }

    if (questionCount >= totalQuestions) {
      await saveSession();
      setStep('complete');
      return;
    }

    setLoading(true);
    setQuestionCount(questionCount + 1);
    const q = await generateInterviewQuestion(jobRole, level);
    setQuestion(q);
    setLoading(false);
  };

  const saveSession = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'interviewSessions'), {
        jobRole,
        level,
        industry,
        questionCount: totalQuestions,
        duration: timer,
        answers,
        completedAt: Timestamp.now(),
      });
    } catch (err) {
      console.error('Error saving session:', err);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const restartInterview = () => {
    setStep('setup');
    setTimer(0);
    setQuestionCount(0);
    setAnswers([]);
    setCurrentAnswer('');
    setQuestion(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-xl">psychology</span>
            <span className="text-xs font-black text-gray-600 dark:text-gray-300 uppercase tracking-wider">AI-Powered</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">Mock Interview</h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto">Practice with AI-generated questions tailored to your target role and get instant feedback</p>
        </div>

        {/* Setup Step */}
        {step === 'setup' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="size-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl">settings</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Interview Setup</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure your practice session</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Job Role</label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none"
                  placeholder="e.g., Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Experience Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none"
                >
                  <option value="Intern">Intern</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none"
                >
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Consulting">Consulting</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Number of Questions</label>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">quiz</span>
                  <span className="text-gray-900 dark:text-white font-bold">{totalQuestions} Questions</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-xl">tips_and_updates</span>
                <div className="space-y-2">
                  <h3 className="font-black text-gray-900 dark:text-white text-sm">Interview Tips</h3>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Speak clearly and take your time to think</li>
                    <li>• Use the STAR method (Situation, Task, Action, Result)</li>
                    <li>• Be specific with examples from your experience</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={startInterview}
              disabled={!jobRole.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-purple-500/30 dark:shadow-purple-900/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">play_arrow</span>
              Start Interview
            </button>
          </div>
        )}

        {/* Interview Step */}
        {step === 'interview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Progress Bar */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">progress_activity</span>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Question {questionCount} of {totalQuestions}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`size-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{isRecording ? 'Recording' : 'Paused'}</span>
                  </div>
                  <div className="font-mono text-lg font-black text-gray-900 dark:text-white">{formatTime(timer)}</div>
                </div>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                  style={{ width: `${(questionCount / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-700 min-h-[400px] flex flex-col justify-between">
              {loading ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-4">
                  <div className="size-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                  <p className="text-gray-400 font-bold animate-pulse">Generating next question...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                      <span className="material-symbols-outlined text-purple-400 text-sm">smart_toy</span>
                      <span className="text-xs font-black text-purple-300 uppercase tracking-wider">AI Interviewer</span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                      {question?.question}
                    </h2>

                    {question?.hint && (
                      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-yellow-400 text-xl">lightbulb</span>
                          <div className="space-y-1">
                            <p className="text-xs font-black text-yellow-300 uppercase tracking-wider">Hint</p>
                            <p className="text-sm text-gray-300">{question.hint}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-4 pt-6">
                    <button
                      onClick={() => setIsRecording(!isRecording)}
                      className={`size-16 rounded-full flex items-center justify-center transition-all ${
                        isRecording
                          ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-white text-2xl">
                        {isRecording ? 'pause' : 'mic'}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Answer Input */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 space-y-4">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">edit_note</span>
                Your Answer (Optional)
              </label>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here or just speak..."
                className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 outline-none min-h-[120px] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to end this interview?')) {
                    setStep('complete');
                  }
                }}
                className="px-6 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
              >
                End Interview
              </button>
              <button
                onClick={nextQuestion}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-xl font-black shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {questionCount >= totalQuestions ? (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    Complete Interview
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">arrow_forward</span>
                    Next Question
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 dark:border-gray-700 text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="size-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-white text-5xl">check_circle</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">Interview Complete!</h2>
              <p className="text-gray-600 dark:text-gray-400 font-medium max-w-md mx-auto">
                Great job! You've completed your mock interview session.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-gray-50 dark:bg-slate-700 rounded-2xl p-6 space-y-2">
                <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-3xl">quiz</span>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{questionCount}</p>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Questions</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 rounded-2xl p-6 space-y-2">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">schedule</span>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{formatTime(timer)}</p>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 rounded-2xl p-6 space-y-2">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">workspace_premium</span>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{jobRole}</p>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-xl">auto_awesome</span>
                <div className="text-left space-y-2">
                  <h3 className="font-black text-gray-900 dark:text-white text-sm">Next Steps</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Review your performance, practice more questions, or schedule a session with a real mentor for personalized feedback.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={restartInterview}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-black shadow-lg shadow-purple-500/30 dark:shadow-purple-900/30 hover:scale-[1.02] transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined">refresh</span>
                Start New Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockInterview;
