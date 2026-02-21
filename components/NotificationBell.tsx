import React, { useState, useEffect } from 'react';

interface Notification {
  id: string;
  message: string;
}

const NotificationBell: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button className="relative" onClick={() => setOpen(!open)}>
        <span className="material-symbols-outlined text-2xl">notifications</span>
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full px-1">{notifications.length}</span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded shadow-lg z-10">
          <div className="p-2 font-black text-gray-700 border-b">Notifications</div>
          <ul className="max-h-60 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="p-2 text-xs text-gray-400">No notifications</li>
            ) : (
              notifications.map(n => (
                <li key={n.id} className="p-2 text-xs border-b border-gray-100">{n.message}</li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
