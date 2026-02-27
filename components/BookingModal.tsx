import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import { SESSION_TYPES, createBooking, getMentorAvailability, type TimeSlot } from '../services/bookingService';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../src/firebase';

interface BookingModalProps {
  mentor: {
    id: string;
    displayName?: string;
    name?: string;
    photoURL?: string;
    mentorExpertise?: string;
    role?: string;
    email?: string;
  };
  onClose: () => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ mentor, onClose }) => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState(SESSION_TYPES[0]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    if (step === 2) {
      getMentorAvailability(mentor.id).then(setSlots);
    }
  }, [step, mentor.id]);

  const handleConfirm = async () => {
    if (!user || !selectedSlot) return;
    setLoading(true);

    try {
      const userName = localStorage.getItem('unity_user_name') || 'Student';
      const userEmail = user.email || '';
      const mentorName = mentor.displayName || mentor.name || 'Mentor';

      const bookingId = await createBooking({
        studentId: user.uid,
        studentName: userName,
        studentEmail: userEmail,
        mentorId: mentor.id,
        mentorName,
        sessionType: selectedType.name,
        sessionDuration: selectedType.duration,
        scheduledDate: selectedSlot.date,
        scheduledTime: selectedSlot.time,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        studentNotes: notes,
        price: selectedType.price,
        platformFee: 0,
        totalAmount: selectedType.price,
        status: 'confirmed',
        paymentStatus: 'unpaid',
      });

      // Create notifications
      await addDoc(collection(db, 'notifications'), {
        userId: mentor.id,
        type: 'booking',
        title: 'New Session Booked',
        message: `${userName} booked a ${selectedType.name} session with you on ${new Date(selectedSlot.date).toLocaleDateString()} at ${selectedSlot.time}`,
        read: false,
        createdAt: Timestamp.now(),
        actionUrl: `/mentorship/history`,
        bookingId: bookingId,
        fromUser: user.uid,
        fromUserName: userName,
      });

      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        type: 'booking',
        title: 'Session Confirmed',
        message: `Your ${selectedType.name} with ${mentorName} on ${new Date(selectedSlot.date).toLocaleDateString()} at ${selectedSlot.time} is confirmed`,
        read: false,
        createdAt: Timestamp.now(),
        actionUrl: `/mentorship/history`,
        bookingId: bookingId,
        fromUser: mentor.id,
        fromUserName: mentorName,
      });

      onClose();
      navigate('/mentorship/history');
    } catch (err) {
      console.error('Booking error:', err);
      alert(`Failed to book session: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className={`max-w-3xl w-full rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl overflow-hidden border-2 border-blue-500/20">
              <img src={mentor.photoURL || 'https://i.pravatar.cc/100'} className="w-full h-full object-cover" alt={mentor.displayName} />
            </div>
            <div>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Book Session</h2>
              <p className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                with {mentor.displayName || mentor.name}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`size-10 rounded-xl flex items-center justify-center ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Progress */}
        <div className="p-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`size-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= s ? 'bg-blue-600 text-white' : isDark ? 'bg-slate-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 mx-2 rounded ${step > s ? 'bg-blue-600' : isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Session Type</span>
            <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Time Slot</span>
            <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Confirm</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Choose Session Type</h3>
              <div className="grid gap-3">
                {SESSION_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedType.id === type.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : isDark
                        ? 'border-gray-700 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{type.name}</p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{type.description}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{type.duration} min</p>
                        <p className="text-lg font-black text-blue-600">{type.price === 0 ? 'Free' : `$${type.price}`}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Select Time Slot</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(groupedSlots).map(([date, dateSlots]) => (
                  <div key={date}>
                    <p className={`text-sm font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {dateSlots.map((slot) => (
                        <button
                          key={`${slot.date}-${slot.time}`}
                          onClick={() => setSelectedSlot(slot)}
                          disabled={!slot.available}
                          className={`py-2 px-3 rounded-lg font-bold text-sm transition-all ${
                            selectedSlot?.date === slot.date && selectedSlot?.time === slot.time
                              ? 'bg-blue-600 text-white'
                              : slot.available
                              ? isDark
                                ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedSlot}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Add Notes (Optional)</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What would you like to discuss? This helps your mentor prepare."
                className={`w-full p-4 rounded-xl font-medium outline-none resize-none h-32 ${
                  isDark ? 'bg-slate-700 text-gray-300 border border-gray-600' : 'bg-gray-50 text-gray-700 border border-gray-200'
                }`}
              />
              
              <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Session Summary</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Type:</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedType.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Date:</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedSlot && new Date(selectedSlot.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Time:</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedSlot?.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Duration:</span>
                    <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedType.duration} min</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Total:</span>
                    <span className="text-lg font-black text-blue-600">{selectedType.price === 0 ? 'Free' : `$${selectedType.price}`}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className={`flex-1 py-3 rounded-xl font-bold ${isDark ? 'bg-slate-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                >
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Booking...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">check_circle</span>
                      Confirm Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
