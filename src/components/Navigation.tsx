import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Search, PlusCircle, LayoutDashboard, User, LogOut, CheckSquare, Shield } from 'lucide-react';

export default function Navigation() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="shrink-0 flex items-center">
              <Search className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-heading font-bold bg-linear-to-r from-primary to-accent-violet text-transparent bg-clip-text hidden sm:block">
                Campus L&F
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/browse" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <Search className="w-4 h-4 mr-1 hidden sm:block"/> Browse
                </Link>
                <Link to="/post" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <PlusCircle className="w-4 h-4 mr-1 hidden sm:block"/> Post
                </Link>
                <Link to="/dashboard" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <LayoutDashboard className="w-4 h-4 mr-1 hidden sm:block"/> Dashboard
                </Link>
                <Link to="/claims" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <CheckSquare className="w-4 h-4 mr-1 hidden sm:block"/> Claims
                </Link>
                
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                    <Shield className="w-4 h-4 mr-1 hidden sm:block"/> Admin
                  </Link>
                )}
                
                <div className="border-l border-gray-200 h-6 mx-2 hidden sm:block"></div>
                
                <button onClick={logout} className="text-gray-500 hover:text-red-500 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <LogOut className="w-4 h-4 mr-1 hidden sm:block"/> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Login
                </Link>
                <Link to="/auth" className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
