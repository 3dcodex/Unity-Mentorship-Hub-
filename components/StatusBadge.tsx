import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
    paid: 'bg-green-100 text-green-700',
    refunded: 'bg-purple-100 text-purple-700',
    unpaid: 'bg-red-100 text-red-700',
    open: 'bg-red-100 text-red-700',
    resolved: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-700',
    upcoming: 'bg-blue-100 text-blue-700',
    'no-show': 'bg-orange-100 text-orange-700'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-2 text-sm'
  };

  const statusLower = status?.toLowerCase() || 'unknown';
  const displayStatus = status?.charAt(0).toUpperCase() + status?.slice(1).replace(/_/g, ' ').replace(/-/g, ' ') || 'Unknown';

  return (
    <span className={`${styles[statusLower] || 'bg-gray-100 text-gray-700'} ${sizes[size]} rounded-full font-bold inline-block`}>
      {displayStatus}
    </span>
  );
};

export default StatusBadge;
