import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Item } from '../types';
import { MapPin, Calendar, Tag, User, MessageSquare } from 'lucide-react';

export default function ItemDetails() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimMessage, setClaimMessage] = useState('');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetch(`/api/items/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if(data.error) throw new Error(data.error);
        setItem(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaiming(true);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ itemId: id, message: claimMessage })
      });
      if (!res.ok) throw new Error('Claim failed');
      alert('Claim submitted successfully. You can track it in Claims page.');
      navigate('/claims');
    } catch (err) {
      alert(err);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <div>Loading details...</div>;
  if (!item) return <div>Item not found</div>;

  const isOwner = user?.id === item.reportedBy;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        
        <div className="md:w-1/2 min-h-75 bg-gray-200 bg-cover bg-center" style={{backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined}}>
          {!item.imageUrl && <div className="h-full w-full flex items-center justify-center text-gray-400">No Image Available</div>}
        </div>

        <div className="p-8 md:w-1/2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.type === 'lost' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {item.type} Item
              </span>
              <span className="text-gray-400 text-sm flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">{item.name}</h1>
            <p className="text-lg text-primary font-medium mb-6 flex items-center">
              <Tag className="w-5 h-5 mr-2"/> {item.category}
            </p>

            <p className="text-gray-600 mb-6 leading-relaxed">
              {item.description}
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                <span className="font-medium text-sm">Location: {item.location}</span>
              </div>
              <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <span className="font-medium text-sm">Reported by: {item.reporterName || 'Unknown Student'}</span>
              </div>
            </div>
          </div>

          {!isOwner && item.status === 'open' && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="font-heading font-bold text-gray-900 mb-3 text-lg flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" /> Request to Claim
              </h3>
              <form onSubmit={handleClaim} className="space-y-3">
                <textarea 
                  required
                  rows={2}
                  value={claimMessage}
                  onChange={e => setClaimMessage(e.target.value)}
                  placeholder="Describe details to verify this is yours..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-primary focus:border-primary"
                />
                <button type="submit" disabled={claiming} className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors">
                  {claiming ? 'Submitting...' : 'Submit Claim Request'}
                </button>
              </form>
            </div>
          )}

          {isOwner && (
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex justify-center items-center font-medium">
              You reported this item. Manage it in Dashboard.
            </div>
          )}

          {item.status !== 'open' && (
            <div className="bg-gray-100 text-gray-600 p-4 rounded-lg flex justify-center items-center font-medium uppercase tracking-wider">
              Item no longer available ({item.status})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
