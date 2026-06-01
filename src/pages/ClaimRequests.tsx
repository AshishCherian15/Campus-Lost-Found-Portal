import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { Claim } from '../types';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ClaimRequests() {
  const { user, token } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/claims', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setClaims(data))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAction = async (claimId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Action failed');
      
      // Update local state
      setClaims(claims.map(c => c.id === claimId ? { ...c, status } : c));
    } catch (err) {
      alert(err);
    }
  };

  if (loading) return <div>Loading claims...</div>;

  const myClaims = claims.filter(c => c.requesterId === user?.id);
  const requestsForMe = claims.filter(c => c.requesterId !== user?.id && c.item?.reportedBy === user?.id);
  
  type ClaimCardProps = {
    claim: Claim;
    isReceived: boolean;
  };

  const ClaimCard = ({ claim, isReceived }: ClaimCardProps) => (
    <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-gray-900 line-clamp-1">{claim.item?.name || 'Unknown Item'}</h4>
          <p className="text-sm text-gray-500">
            {isReceived ? `Requested by ${claim.requester?.name}` : 'You requested this item'} &middot; {new Date(claim.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center ${
          claim.status === 'pending' ? 'bg-amber-100 text-amber-700' :
          claim.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
          'bg-red-100 text-red-700'
        }`}>
          {claim.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
          {claim.status === 'approved' && <CheckCircle className="w-3 h-3 mr-1" />}
          {claim.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
          {claim.status}
        </span>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <p className="text-sm text-gray-700 italic">"{claim.message}"</p>
      </div>

      {isReceived && claim.status === 'pending' && (
        <div className="flex justify-end space-x-3 pt-2">
          <button onClick={() => handleAction(claim.id, 'rejected')} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
            Reject
          </button>
          <button onClick={() => handleAction(claim.id, 'approved')} className="px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-emerald-600 rounded-lg transition-colors">
            Approve Claim
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Requests For Your Items</h2>
        {requestsForMe.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500 shadow-sm">
            You don't have any pending requests for your reported items.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {requestsForMe.map(claim => (
              <div key={claim.id}>
                <ClaimCard claim={claim} isReceived={true} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-heading font-bold text-gray-900 mb-4">Your Claims</h2>
        {myClaims.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500 shadow-sm">
            You haven't made any claims yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {myClaims.map(claim => (
              <div key={claim.id}>
                <ClaimCard claim={claim} isReceived={false} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
