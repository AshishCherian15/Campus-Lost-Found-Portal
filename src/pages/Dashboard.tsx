import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Item, Claim } from '../types';
import { Package, Search, Clock, FileWarning } from 'lucide-react';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [itemsRes, claimsRes] = await Promise.all([
          fetch('/api/items', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/claims', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const itemsData = await itemsRes.json();
        const claimsData = await claimsRes.json();
        
        setItems(itemsData.filter((i: Item) => i.reportedBy === user?.id));
        setClaims(claimsData);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token, user?.id]);

  if (loading) return <div>Loading dashboard...</div>;

  const myLostItems = items.filter(i => i.type === 'lost').length;
  const myFoundItems = items.filter(i => i.type === 'found').length;
  // Pending claims for items I reported or claims I made
  const pendingClaims = claims.filter(c => c.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Welcome back, {user?.name}</h1>
          <p className="text-gray-500">Here's what's happening with your items.</p>
        </div>
        <Link to="/post" className="bg-primary text-white px-4 py-2 rounded-lg shadow font-medium hover:bg-blue-600 transition-colors">
          + New Post
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-accent-coral rounded-full">
            <Search className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Lost Items Reported</p>
            <p className="text-2xl font-bold text-gray-900">{myLostItems}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-secondary rounded-full">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Found Items Reported</p>
            <p className="text-2xl font-bold text-gray-900">{myFoundItems}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-accent-amber rounded-full">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Pending Claims</p>
            <p className="text-2xl font-bold text-gray-900">{pendingClaims}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-heading font-bold text-gray-900 mb-4">Your Recent Posts</h2>
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500 flex flex-col items-center">
            <FileWarning className="w-12 h-12 text-gray-300 mb-2" />
            <p>You haven't posted any items yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 border border-gray-50 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded bg-gray-200 bg-cover bg-center ${!item.imageUrl && 'flex items-center justify-center text-gray-400'}`} style={{backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined}}>
                    {!item.imageUrl && <Package className="w-6 h-6"/>}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()} &middot; {item.location}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.type === 'lost' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {item.type.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'open' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {item.status.toUpperCase()}
                  </span>
                  <Link to={`/item/${item.id}`} className="bg-white border border-gray-200 text-gray-600 hover:text-primary hover:border-primary px-3 py-1 rounded-lg text-sm font-medium transition-colors">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
