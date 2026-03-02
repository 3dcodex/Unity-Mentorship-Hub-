import React, { useEffect } from 'react';

interface AdminToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

const AdminToast: React.FC<AdminToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
    warning: 'bg-yellow-600 text-white'
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 ${styles[type]} px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in-right max-w-md`}>
      <span className="material-symbols-outlined text-2xl">{icons[type]}</span>
      <p className="font-bold flex-1">{message}</p>
      <button onClick={onClose} className="hover:opacity-80">
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
};

export default AdminToast;

// Hook for using toast
export const useToast = () => {
  const [toast, setToast] = React.useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToast({ message, type });
  };

  const ToastComponent = toast ? (
    <AdminToast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  ) : null;

  return { showToast, ToastComponent };
};
