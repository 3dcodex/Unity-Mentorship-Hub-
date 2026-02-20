
import React, { useState } from 'react';

const MentorshipBooking: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(25);
  const [selectedTime, setSelectedTime] = useState('01:00 PM');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [endDate, setEndDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const dates = [
    { day: 'MON', date: 21 },
    { day: 'TUE', date: 22 },
    { day: 'WED', date: 23 },
    { day: 'THU', date: 24 },
    { day: 'FRI', date: 25 },
    { day: 'SAT', date: 26 },
    { day: 'SUN', date: 27 },
  ];

  const timeSlots = ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'];

  const handleConfirm = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 leading-tight">Book a Session</h1>
          <p className="text-gray-500 font-medium">Choose a time that works for you and your mentor.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8">
        {/* Main Content Area */}
        <div className="xl:col-span-8 space-y-6 sm:space-y-8 md:space-y-10">
          
          {/* Booking Calendar Section */}
          <section className="bg-white rounded-2xl sm:rounded-3xl md:rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/50 p-10 relative overflow-hidden">
            {showSuccess && (
              <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex items-center justify-center p-10 text-center animate-in fade-in zoom-in duration-300">
                <div className="space-y-6">
                  <div className="size-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-green-200">
                    <span className="material-symbols-outlined text-2xl sm:text-xl sm:text-2xl md:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black">check_circle</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">Booking Confirmed!</h3>
                  <p className="text-gray-500 font-medium max-w-sm">
                    Your {isRecurring ? `recurring ${recurrenceType}` : 'single'} session with Dr. Sarah Jenkins has been scheduled starting Oct {selectedDate} at {selectedTime}.
                  </p>
                  <button 
                    onClick={() => setShowSuccess(false)}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl overflow-hidden border-2 border-primary/10">
                  <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-base sm:text-base sm:text-lg md:text-xl font-black text-gray-900 leading-none">Book a session with Dr. Sarah Jenkins</h3>
                  <p className="text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">Expertise: Academic Research & Careers</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="size-7 sm:size-9 md:size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button className="size-7 sm:size-9 md:size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-10 gap-2">
              {dates.map((d) => (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`flex-1 flex flex-col items-center py-4 rounded-2xl transition-all ${
                    selectedDate === d.date 
                      ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-105' 
                      : d.date === 23 || d.date === 24 ? 'bg-gray-50 text-gray-800' : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-[10px] font-black tracking-widest mb-2">{d.day}</span>
                  <span className="text-base sm:text-base sm:text-lg md:text-xl font-black">{d.date}</span>
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black text-gray-900">Available Slots for Oct {selectedDate}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-4 rounded-xl font-bold text-sm border-2 transition-all ${
                      selectedTime === time
                        ? 'border-primary bg-white text-primary shadow-sm'
                        : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Recurring Session Options */}
            <div className="mt-12 pt-10 border-t border-gray-50 space-y-4 sm:space-y-6 md:space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`size-6 rounded flex items-center justify-center cursor-pointer transition-colors ${isRecurring ? 'bg-primary text-white' : 'bg-gray-100 text-transparent'}`} onClick={() => setIsRecurring(!isRecurring)}>
                    <span className="material-symbols-outlined text-sm font-black">check</span>
                  </div>
                  <label className="text-sm font-black text-gray-900 cursor-pointer select-none" onClick={() => setIsRecurring(!isRecurring)}>
                    Make this a recurring session
                  </label>
                </div>
                {isRecurring && (
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-in fade-in slide-in-from-right-2">Recurring Active</span>
                )}
              </div>

              {isRecurring && (
                <div className="grid md:grid-cols-2 gap-3 sm:gap-4 md:gap-4 sm:p-6 md:p-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Recurrence Interval</label>
                    <div className="flex gap-2">
                      {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setRecurrenceType(type)}
                          className={`flex-1 py-3 rounded-xl text-xs font-bold capitalize border-2 transition-all ${
                            recurrenceType === type 
                              ? 'border-primary bg-primary/5 text-primary' 
                              : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">End Date</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base sm:text-base sm:text-lg md:text-xl">event</span>
                      <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 flex justify-end">
              <button 
                onClick={handleConfirm}
                className="bg-primary text-white font-black px-12 py-4 rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Confirm Booking
              </button>
            </div>
          </section>
        </div>

        {/* Right Sidebar Area */}
        <div className="xl:col-span-4 space-y-4 sm:space-y-6 md:space-y-8">
          {/* Quick Notification Widget */}
          <section className="bg-primary rounded-3xl p-4 sm:p-6 md:p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10 space-y-6">
              <div className="bg-white/20 size-7 sm:size-9 md:size-10 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined">tips_and_updates</span>
              </div>
              
              <div className="bg-gray-900 rounded-2xl p-4 shadow-2xl border border-white/10 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="size-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-lg">
                  <span className="material-symbols-outlined text-base sm:text-lg">check_circle</span>
                </div>
                <div>
                  <p className="text-xs font-black mb-0.5">Ready to Connect?</p>
                  <p className="text-[10px] text-gray-400 font-medium leading-tight">Pick a time that fits your schedule.</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium leading-relaxed opacity-90">
                  {isRecurring 
                    ? `You've opted for a recurring ${recurrenceType} session. This helps build a stronger relationship with your mentor over time.` 
                    : "Did you know? Mentorship sessions booked on Fridays have the highest attendance rate!"}
                </p>
                {isRecurring && (
                   <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Recurrence Summary</p>
                      <p className="text-xs font-bold">Every {recurrenceType === 'daily' ? 'Day' : recurrenceType === 'weekly' ? 'Week' : 'Month'} at {selectedTime}</p>
                      {endDate && <p className="text-[10px] mt-1 opacity-80">Until {new Date(endDate).toLocaleDateString()}</p>}
                   </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MentorshipBooking;
