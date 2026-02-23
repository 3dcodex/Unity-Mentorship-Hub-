import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/firebase';

interface PlatformSettings {
  commissionRate: number;
  categories: string[];
  sessionDuration: number;
  cancellationWindow: number;
  features: {
    aiFeatures: boolean;
    templates: boolean;
    promotions: boolean;
  };
}

const PlatformSettings: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings>({
    commissionRate: 10,
    categories: ['Programming', 'Career', 'Business', 'Design'],
    sessionDuration: 60,
    cancellationWindow: 24,
    features: {
      aiFeatures: true,
      templates: true,
      promotions: false
    }
  });
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settingsDoc = await getDoc(doc(db, 'settings', 'platform'));
    if (settingsDoc.exists()) {
      setSettings(settingsDoc.data() as PlatformSettings);
    }
  };

  const saveSettings = async () => {
    await updateDoc(doc(db, 'settings', 'platform'), settings);
    alert('Settings saved successfully!');
  };

  const addCategory = () => {
    if (newCategory && !settings.categories.includes(newCategory)) {
      setSettings({
        ...settings,
        categories: [...settings.categories, newCategory]
      });
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setSettings({
      ...settings,
      categories: settings.categories.filter(c => c !== category)
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">Platform Settings</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-black text-gray-900 mb-4">Commission & Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Platform Commission Rate (%)
                </label>
                <input
                  type="number"
                  value={settings.commissionRate}
                  onChange={(e) => setSettings({...settings, commissionRate: Number(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Default Session Duration (minutes)
                </label>
                <input
                  type="number"
                  value={settings.sessionDuration}
                  onChange={(e) => setSettings({...settings, sessionDuration: Number(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Cancellation Window (hours)
                </label>
                <input
                  type="number"
                  value={settings.cancellationWindow}
                  onChange={(e) => setSettings({...settings, cancellationWindow: Number(e.target.value)})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-black text-gray-900 mb-4">Mentor Categories</h2>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Add new category..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
              />
              <button
                onClick={addCategory}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {settings.categories.map((cat) => (
                <div key={cat} className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full">
                  <span className="font-bold">{cat}</span>
                  <button
                    onClick={() => removeCategory(cat)}
                    className="text-green-700 hover:text-green-900"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-black text-gray-900 mb-4">Feature Toggles</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                <div>
                  <p className="font-bold text-gray-900">AI Features</p>
                  <p className="text-sm text-gray-600">Enable AI-powered resume builder and chat</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.features.aiFeatures}
                  onChange={(e) => setSettings({
                    ...settings,
                    features: {...settings.features, aiFeatures: e.target.checked}
                  })}
                  className="w-6 h-6"
                />
              </label>
              
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                <div>
                  <p className="font-bold text-gray-900">Templates</p>
                  <p className="text-sm text-gray-600">Enable resume and cover letter templates</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.features.templates}
                  onChange={(e) => setSettings({
                    ...settings,
                    features: {...settings.features, templates: e.target.checked}
                  })}
                  className="w-6 h-6"
                />
              </label>
              
              <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer">
                <div>
                  <p className="font-bold text-gray-900">Promotions</p>
                  <p className="text-sm text-gray-600">Enable promotional campaigns and discounts</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.features.promotions}
                  onChange={(e) => setSettings({
                    ...settings,
                    features: {...settings.features, promotions: e.target.checked}
                  })}
                  className="w-6 h-6"
                />
              </label>
            </div>
          </div>

          <button
            onClick={saveSettings}
            className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700"
          >
            Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlatformSettings;
