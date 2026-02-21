import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../src/firebase';

interface Event {
  title: string;
  date: string;
  location: string;
  description: string;
}

const CampusEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [form, setForm] = useState<Event>({ title: '', date: '', location: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'campusEvents'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventList: Event[] = snapshot.docs.map(doc => doc.data() as Event);
      setEvents(eventList);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'campusEvents'), form);
    setForm({ title: '', date: '', location: '', description: '' });
    setShowForm(false);
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
      <h3 className="text-lg font-black mb-4">Campus Events</h3>
      <button
        className="bg-green-500 hover:bg-green-600 text-white font-black px-4 py-2 rounded mb-4"
        onClick={() => setShowForm(true)}
      >
        Create Event
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 mb-4">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Event Title"
            className="w-full border rounded p-2"
            required
          />
          <input
            name="date"
            value={form.date}
            onChange={handleChange}
            placeholder="Date"
            className="w-full border rounded p-2"
            required
          />
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Location"
            className="w-full border rounded p-2"
            required
          />
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full border rounded p-2"
            required
          />
          <button type="submit" className="bg-green-500 text-white font-black px-4 py-2 rounded">Submit</button>
        </form>
      )}
      <ul className="space-y-2">
        {events.map((event, idx) => (
          <li key={idx} className="border rounded p-2">
            <div className="font-black">{event.title}</div>
            <div className="text-xs text-gray-500">{event.date} | {event.location}</div>
            <div className="text-sm mt-1">{event.description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CampusEvents;
