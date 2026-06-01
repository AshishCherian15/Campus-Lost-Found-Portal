import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Item } from '../types';
import { Search, Filter, MapPin } from 'lucide-react';

export default function BrowseItems() {
  const { token } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [filterCategory, setFilterCategory] = useState('All');

  const categories = ['All', 'Electronics', 'Books', 'Clothing', 'Accessories', 'Documents', 'Other'];

  useEffect(() => {
    fetch('/api/items', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [token]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory && item.status === 'open';
  });

  if (loading) return <div>Loading items...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h1 className="text-2xl font-heading font-bold text-gray-900">Browse Items</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search items by name or description..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-primary focus:border-primary transition-shadow"
            />
          </div>
          
          <div className="flex gap-4">
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-primary focus:border-primary bg-white"
            >
              <option value="all">All Types</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>

            <select 
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-primary focus:border-primary bg-white"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500">
            No items match your criteria.
          </div>
        ) : (
          filteredItems.map(item => (
            <Link key={item.id} to={`/item/${item.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col user-card-hover group">
              <div 
                className="h-48 w-full bg-gray-200 bg-cover bg-center flex items-center justify-center relative"
                style={{backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined}}
              >
                {!item.imageUrl && <span className="text-gray-400 text-sm">No Image</span>}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${item.type === 'lost' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                  {item.type.toUpperCase()}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{item.category}</div>
                <h3 className="font-heading font-bold text-gray-900 text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">{item.name}</h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{item.description}</p>
                
                <div className="flex items-center text-xs text-gray-400 mt-auto pt-4 border-t border-gray-50">
                  <MapPin className="w-3.5 h-3.5 mr-1" />
                  <span className="truncate">{item.location}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
