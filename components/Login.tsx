
import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, ShieldCheck, HeartPulse } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User | null, isAdmin: boolean) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const Login: React.FC<LoginProps> = ({ onLogin, users, setUsers }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [formData, setFormData] = useState({ id: '', password: '', name: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isAdminMode) {
      if (formData.id === '2' && formData.password === '2') {
        onLogin(null, true);
      } else {
        setError('ভুল এডমিন আইডি অথবা পাসওয়ার্ড');
      }
      return;
    }

    if (isRegister) {
      if (users.find(u => u.id === formData.id)) {
        setError('এই আইডি ইতিমধ্যেই ব্যবহার করা হয়েছে');
        return;
      }
      const newUser: User = {
        id: formData.id,
        name: formData.name,
        password: formData.password,
        isBlocked: false,
        theme: 'blue'
      };
      setUsers(prev => [...prev, newUser]);
      onLogin(newUser, false);
    } else {
      const user = users.find(u => u.id === formData.id && u.password === formData.password);
      if (user) {
        if (user.isBlocked) {
          setError('আপনার অ্যাকাউন্টটি ব্লক করা হয়েছে');
          return;
        }
        onLogin(user, false);
      } else {
        setError('ভুল ইউজার আইডি অথবা পাসওয়ার্ড');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      <div className="max-w-md w-full glass rounded-[40px] shadow-2xl p-10 border border-white/50 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/10 rounded-full blur-3xl"></div>
        
        <div className="text-center mb-10 relative z-10">
          <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/30 transform rotate-12">
            {isAdminMode ? <ShieldCheck className="text-white w-14 h-14" /> : <HeartPulse className="text-white w-14 h-14" />}
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            {isAdminMode ? 'এডমিন পোর্টাল' : (isRegister ? 'নতুন প্রোফাইল' : 'লগইন করুন')}
          </h1>
          <p className="text-slate-500 mt-2 font-medium">আপনার ডিজিটাল ডাক্তার এখন হাতের মুঠোয়</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {isRegister && !isAdminMode && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">নাম</label>
              <input
                required
                type="text"
                className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                placeholder="আপনার পুরো নাম লিখুন"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">ইউজার আইডি</label>
            <input
              required
              type="text"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none font-mono"
              placeholder="আইডি নম্বর"
              value={formData.id}
              onChange={e => setFormData({ ...formData, id: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">পাসওয়ার্ড</label>
            <input
              required
              type="password"
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none font-mono"
              placeholder="পাসওয়ার্ড দিন"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
          >
            {isAdminMode ? 'এডমিন লগইন' : (isRegister ? 'অ্যাকাউন্ট তৈরি করুন' : 'অ্যাপে প্রবেশ করুন')}
          </button>
        </form>

        <div className="mt-8 space-y-4 text-center relative z-10">
          {!isAdminMode && (
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-blue-600 font-bold hover:text-blue-800 transition-colors text-sm underline decoration-blue-600/30 underline-offset-4"
            >
              {isRegister ? 'আগেই অ্যাকাউন্ট আছে? লগইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করতে চান?'}
            </button>
          )}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                setIsRegister(false);
                setError('');
              }}
              className="text-slate-400 font-bold text-xs flex items-center justify-center gap-2 hover:text-slate-600 transition-colors uppercase tracking-widest"
            >
              <ShieldCheck size={14} /> {isAdminMode ? 'পেশেন্ট মোডে ফিরে যান' : 'সিস্টেম এডমিন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
