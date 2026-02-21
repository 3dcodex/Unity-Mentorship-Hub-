import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../src/firebase';

interface Opportunity {
  title: string;
  industry: string;
  description: string;
}

const industryOptions = [
  'Tech',
  'Finance',
  'Healthcare',
  'Education',
  'Other',
];

const CareerOpportunities: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [form, setForm] = useState<Opportunity>({ title: '', industry: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'careerOpportunities'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const oppList: Opportunity[] = snapshot.docs.map(doc => doc.data() as Opportunity);
      setOpportunities(oppList);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'careerOpportunities'), form);
    setForm({ title: '', industry: '', description: '' });
    setShowForm(false);
  };

  const filteredOpportunities = filter
    ? opportunities.filter(o => o.industry === filter)
    : opportunities;

  return (
    <div className="bg-white rounded-xl p-4 border border-amber-200 mb-6">
      <h3 className="text-lg font-black mb-4">Career Opportunities</h3>
      <button
        className="bg-amber-500 hover:bg-amber-600 text-white font-black px-4 py-2 rounded mb-4"
        onClick={() => setShowForm(true)}
      >
        Post Career Opportunity
      </button>
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 mb-4">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Opportunity Title"
            className="w-full border rounded p-2"
            required
          />
          <select
            name="industry"
            value={form.industry}
            onChange={handleChange}
            className="w-full border rounded p-2"
            required
          >
            <option value="">Select Industry</option>
            {industryOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="w-full border rounded p-2"
            required
          />
          <button type="submit" className="bg-amber-500 text-white font-black px-4 py-2 rounded">Submit</button>
        </form>
      )}
      <div className="mb-4">
        <label className="font-black text-xs mr-2">Industry Filter:</label>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border rounded p-2 text-xs"
        >
          <option value="">All</option>
          {industryOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <ul className="space-y-2">
        {filteredOpportunities.map((op, idx) => (
          <li key={idx} className="border rounded p-2">
            <div className="font-black">{op.title}</div>
            <div className="text-xs text-amber-700">{op.industry}</div>
            <div className="text-sm mt-1">{op.description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CareerOpportunities;
