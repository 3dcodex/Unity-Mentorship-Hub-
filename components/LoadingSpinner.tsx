import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'green' | 'blue' | 'purple' | 'white';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'green' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-16 h-16 border-4'
  };

  const colors = {
    green: 'border-gray-200 border-t-green-600',
    blue: 'border-gray-200 border-t-blue-600',
    purple: 'border-gray-200 border-t-purple-600',
    white: 'border-white/30 border-t-white'
  };

  return (
    <div className={`${sizes[size]} ${colors[color]} rounded-full animate-spin`} />
  );
};

export default LoadingSpinner;
