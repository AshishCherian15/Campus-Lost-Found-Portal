import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { UploadCloud } from 'lucide-react';

export default function PostItem() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'lost',
    name: '',
    description: '',
    location: '',
    category: 'Electronics',
    imageUrl: ''
  });

  const categories = ['Electronics', 'Books', 'Clothing', 'Accessories', 'Documents', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to post item');
      
      navigate('/dashboard');
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h1 className="text-2xl font-heading font-bold text-gray-900 mb-6">Report an Item</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex space-x-4 mb-6">
          <label className={`flex-1 text-center py-3 rounded-xl border-2 cursor-pointer font-medium transition-colors ${formData.type === 'lost' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            <input type="radio" name="type" value="lost" className="hidden" checked={formData.type === 'lost'} onChange={handleChange} />
            I Lost Something
          </label>
          <label className={`flex-1 text-center py-3 rounded-xl border-2 cursor-pointer font-medium transition-colors ${formData.type === 'found' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            <input type="radio" name="type" value="found" className="hidden" checked={formData.type === 'found'} onChange={handleChange} />
            I Found Something
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input name="name" required value={formData.name} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-primary focus:border-primary" placeholder="e.g. Blue Hydroflask" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-primary focus:border-primary">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location Details</label>
          <input name="location" required value={formData.location} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-primary focus:border-primary" placeholder="e.g. Library 2nd floor, Table 5" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" required value={formData.description} onChange={handleChange} rows={4} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-primary focus:border-primary" placeholder="Provide any identifying details, colors, marks..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
            <span className="flex items-center px-3 bg-gray-50 text-gray-500 border-r border-gray-300"><UploadCloud className="w-5 h-5"/></span>
            <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="flex-1 p-2.5 outline-none" placeholder="https://example.com/image.jpg" />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button type="submit" disabled={loading} className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium shadow-sm transition-colors">
            {loading ? 'Submitting...' : 'Post Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
