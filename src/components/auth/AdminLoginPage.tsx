import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, AlertOctagon, KeyRound } from 'lucide-react';
import { signInAdmin } from '../../lib/supabase';
import type { UserProfile } from '../../types/admin';

interface AdminLoginPageProps {
  onSuccess: (profile: UserProfile) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('admin@foodfax.in');
  const [password, setPassword] = useState('Admin@FoodFax2026!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const profile = await signInAdmin(email.trim(), password);
      onSuccess(profile);
    } catch (err: any) {
      if (err.message === 'ACCESS_DENIED_NOT_ADMIN') {
        setErrorMsg('ACCESS DENIED: Your account is authenticated, but you do not hold the required "admin" role. Customer and Shop Owner accounts cannot access the administrative console.');
      } else {
        setErrorMsg(err.message || 'Login failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setTestAccount = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('Admin@FoodFax2026!');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle structural grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 shadow-xl mb-4 text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            FoodFax Platform Administration
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Executive verification, shop moderation & operations console.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl">
          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-300 leading-relaxed font-medium">
                {errorMsg}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@foodfax.in"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Authorize Admin Session</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick-fill helper for convenience */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-xs">
            <span className="text-slate-400 block mb-2 font-medium">Configured Admin Accounts:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTestAccount('admin@foodfax.in')}
                className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-[11px] text-slate-300 text-left truncate transition-colors"
              >
                admin@foodfax.in
              </button>
              <button
                type="button"
                onClick={() => setTestAccount('rs9028022@gmail.com')}
                className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-[11px] text-slate-300 text-left truncate transition-colors"
              >
                rs9028022@gmail.com
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <span>Protected by Supabase Auth & Role-Based Access Control</span>
        </div>
      </div>
    </div>
  );
};
