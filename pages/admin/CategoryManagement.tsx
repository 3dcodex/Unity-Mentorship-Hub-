import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../../src/firebase';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  active: boolean;
}

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: 'category' });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const categoriesSnap = await getDocs(collection(db, 'categories'));
    const categoriesData = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    setCategories(categoriesData);
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) {
      alert('Please enter a category name');
      return;
    }

    await addDoc(collection(db, 'categories'), {
      ...newCategory,
      active: true,
      createdAt: new Date()
    });

    setNewCategory({ name: '', description: '', icon: 'category' });
    setShowModal(false);
    loadCategories();
  };

  const handleToggleActive = async (categoryId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'categories', categoryId), {
      active: !currentStatus
    });
    loadCategories();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    await deleteDoc(doc(db, 'categories', categoryId));
    loadCategories();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black text-gray-900">Category Management</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
          >
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-600 text-2xl">
                    {category.icon}
                  </span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  category.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {category.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <h3 className="text-xl font-black text-gray-900 mb-2">{category.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{category.description}</p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleActive(category.id, category.active)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold ${
                    category.active
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {category.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">category</span>
            <p className="text-xl font-bold text-gray-600">No categories yet</p>
            <p className="text-gray-500 mt-2">Click "Add Category" to create your first category</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-black mb-6">Add New Category</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="e.g., Programming, Career, Business"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  placeholder="Brief description of this category..."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Icon Name</label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                  placeholder="Material icon name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use Material Symbols icon names (e.g., code, business, school)
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
