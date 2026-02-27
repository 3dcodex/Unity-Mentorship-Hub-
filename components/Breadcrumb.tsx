import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  const breadcrumbNames: Record<string, string> = {
    dashboard: 'Dashboard',
    mentorship: 'Mentorship',
    career: 'Career Tools',
    resources: 'Resources',
    community: 'Community',
    profile: 'Profile',
    billing: 'Billing',
    notifications: 'Notifications',
    messages: 'Messages',
    help: 'Help Center',
    analytics: 'Analytics',
    'quick-chat': 'Quick Chat',
    history: 'Session History',
    book: 'Book Mentor',
    match: 'Find Match',
    resume: 'Resume Builder',
    'mock-interview': 'Mock Interview',
    'cover-letter': 'Cover Letter',
    feed: 'Community Feed',
    groups: 'Discussion Groups',
    directory: 'Member Directory',
    faq: 'FAQ',
    contact: 'Contact Support',
  };

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm mb-4 px-1">
      <Link to="/dashboard" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 font-medium transition-colors">
        <span className="material-symbols-outlined text-base align-middle">home</span>
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = breadcrumbNames[name] || name.charAt(0).toUpperCase() + name.slice(1);

        return (
          <React.Fragment key={routeTo}>
            <span className="text-gray-400 dark:text-gray-600">/</span>
            {isLast ? (
              <span className="text-gray-900 dark:text-white font-bold">{displayName}</span>
            ) : (
              <Link to={routeTo} className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 font-medium transition-colors">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
