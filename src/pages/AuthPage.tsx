import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ShieldCheck, Info } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', name: '', contact: '', department: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  const testUsers = [
    { username: 'alice', role: 'Student' },
    { username: 'bob', role: 'Student' },
    { username: 'charlie', role: 'Student' },
    { username: 'admin', role: 'Admin' },
  ];

  const fillTestUser = (username: string) => {
    setFormData({ ...formData, username, password: 'password' });
    setIsLogin(true);
  };

  return (
    <div className="min-h-[85vh] flex flex-col md:flex-row bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 my-8">
      {/* Left Context Side */}
      <div className="md:w-5/12 bg-linear-to-br from-primary to-accent-violet p-10 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 bg-accent-amber opacity-20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <ShieldCheck className="w-12 h-12 mb-6" />
          <h2 className="text-4xl font-heading font-bold mb-4">Welcome to Campus L&amp;F</h2>
          <p className="text-blue-100 text-lg leading-relaxed mb-8">
            A secure, student-friendly platform to report lost items, verify ownership, and keep our campus community connected.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
          <div className="flex items-center text-blue-100 font-bold mb-4">
            <Info className="w-5 h-5 mr-2" />
            Demo Accounts Available
          </div>
          <p className="text-sm text-blue-100/80 mb-4">
            For demonstration purposes, you can click on any of the following accounts to automatically fill in the login details.
          </p>
          <div className="flex flex-wrap gap-2">
            {testUsers.map((u) => (
              <button 
                key={u.username}
                type="button"
                onClick={() => fillTestUser(u.username)}
                className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                {u.username} <span className="opacity-70 text-xs font-normal ml-1">({u.role})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Side */}
      <div className="md:w-7/12 flex items-center justify-center p-8 md:p-12 lg:p-16">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-heading font-extrabold text-gray-900 mb-2">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-sm text-gray-600 mb-8">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-primary hover:text-blue-700 transition-colors">
              {isLogin ? 'Register now.' : 'Sign in here.'}
            </button>
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex">
                <Info className="w-5 h-5 mr-2 shrink-0" />
                {error}
              </div>
            )}
            
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input name="name" type="text" required onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input name="department" type="text" required onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                  <input name="contact" type="text" required onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(edu ending)</span></label>
                  <input name="email" type="email" required onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username {isLogin && 'or Email'}</label>
              <input name="username" type="text" required value={formData.username} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans" placeholder="••••••••" />
              {isLogin && <p className="text-xs text-gray-500 mt-2">Passwords are ignored for demo accounts.</p>}
            </div>

            <button disabled={loading} type="submit" className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-[0_4px_14px_0_rgb(0,118,255,39%)] hover:shadow-[0_6px_20px_rgba(0,118,255,23%)] hover:bg-[#0060df] text-white bg-primary font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-wait">
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
