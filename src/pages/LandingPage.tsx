import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Search, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center text-center">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl sm:text-6xl font-heading font-bold text-gray-900 leading-tight">
          Find what you lost. <br/>
          <span className="bg-linear-to-r from-primary via-accent-violet to-accent-amber text-transparent bg-clip-text">Return what you found.</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          The official campus portal connecting students to their misplaced belongings. Simple, secure, and community-driven.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link to="/auth" className="w-full sm:w-auto px-8 py-4 bg-primary hover:bg-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center text-lg">
            Get Started <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link to="/browse" className="w-full sm:w-auto px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-900 rounded-xl font-medium shadow-sm hover:shadow transition-all text-lg flex items-center justify-center">
            Browse Items
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 pt-16">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-heading font-bold mb-2">Smart Search</h3>
            <p className="text-gray-500 text-sm">Easily filter by category, date, and keywords to find exact matches.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-50 text-secondary rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-heading font-bold mb-2">Location Pins</h3>
            <p className="text-gray-500 text-sm">Pinpoint exactly where an item was lost or discovered on campus.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-50 text-accent-violet rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-heading font-bold mb-2">Secure Claims</h3>
            <p className="text-gray-500 text-sm">Verify ownership through our secure messaging and claim approval system.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
