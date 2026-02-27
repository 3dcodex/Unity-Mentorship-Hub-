import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { icon: 'event', label: 'Book Session', path: '/mentorship/book' },
    { icon: 'chat', label: 'Quick Chat', path: '/quick-chat' },
    { icon: 'calendar_today', label: 'My Schedule', path: '/mentorship/history' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 min-w-[180px] animate-in slide-in-from-bottom-4">
          {actions.map((action) => (
            <button
              key={action.path}
              onClick={() => {
                navigate(action.path);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-primary dark:text-blue-400">{action.icon}</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{action.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="size-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-2xl">{isOpen ? 'close' : 'add'}</span>
      </button>
    </div>
  );
};

export default QuickActions;
