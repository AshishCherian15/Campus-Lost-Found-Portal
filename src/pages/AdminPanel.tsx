import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { Item } from '../types';
import { Trash2, Users, Package, FileText } from 'lucide-react';

export default function AdminPanel() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState({ usersCount: 0, itemsCount: 0, claimsCount: 0 });
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, itemsRes] = await Promise.all([
          fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/items', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const statsData = await statsRes.json();
        const itemsData = await itemsRes.json();
        
        setStats(statsData);
        setItems(itemsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if(user?.role === 'admin') fetchAdminData();
  }, [token, user]);

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const res = await fetch(`/api/admin/items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if(res.ok) {
        setItems(items.filter(i => i.id !== id));
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  if (loading) return <div>Loading Admin Panel...</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-gray-900 text-white p-8 rounded-2xl shadow-lg flex justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2 text-white">System Administration</h1>
          <p className="text-gray-400">Manage all users, items, and site content.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between pointer-events-none">
          <div>
            <p className="text-gray-500 font-medium mb-1">Total Users</p>
            <p className="text-3xl font-heading font-bold text-gray-900">{stats.usersCount}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 font-medium mb-1">Total Active Posts</p>
            <p className="text-3xl font-heading font-bold text-gray-900">{stats.itemsCount}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 font-medium mb-1">Total Claims Filed</p>
            <p className="text-3xl font-heading font-bold text-gray-900">{stats.claimsCount}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-heading font-bold text-gray-900">Manage Posts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Item Name</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.type==='lost'?'bg-red-100 text-red-700':'bg-emerald-100 text-emerald-700'}`}>
                      {item.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{item.category}</td>
                  <td className="px-6 py-4">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium uppercase">{item.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
