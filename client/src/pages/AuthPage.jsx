import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ userId: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.userId, form.password);
      } else {
        if (!form.username.trim()) return toast.error('Username is required');
        await register(form.userId, form.username, form.password);
      }
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="fixed top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-sky-200 opacity-40 blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-80px] right-[-80px] w-96 h-96 rounded-full bg-sky-300 opacity-30 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md fade-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg shadow-sky-200">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill="white"/>
              </svg>
            </div>
            <h1 className="text-3xl font-display font-800 logo-text tracking-tight">Nexify</h1>
          </div>
          <p className="text-slate-500 text-sm">Connect. Chat. Instantly.</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl shadow-xl shadow-sky-100 border border-white/80 p-8">
          {/* Toggle */}
          <div className="flex bg-sky-50 rounded-2xl p-1 mb-8">
            {['Login', 'Register'].map((tab) => (
              <button
                key={tab}
                onClick={() => setIsLogin(tab === 'Login')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  (tab === 'Login') === isLogin
                    ? 'bg-white text-sky-600 shadow-sm shadow-sky-100'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* User ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                User ID
              </label>
              <input
                name="userId"
                value={form.userId}
                onChange={handle}
                placeholder="e.g. john_doe"
                required
                className="nexify-input w-full px-4 py-3 rounded-2xl border border-sky-100 bg-white/70 text-sm text-slate-700 placeholder-slate-300 focus:border-sky-300 transition-all"
              />
            </div>

            {/* Username (register only) */}
            {!isLogin && (
              <div className="fade-up">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                  Display Name
                </label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handle}
                  placeholder="How others see you"
                  required={!isLogin}
                  className="nexify-input w-full px-4 py-3 rounded-2xl border border-sky-100 bg-white/70 text-sm text-slate-700 placeholder-slate-300 focus:border-sky-300 transition-all"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 pl-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handle}
                placeholder="••••••••"
                required
                minLength={6}
                className="nexify-input w-full px-4 py-3 rounded-2xl border border-sky-100 bg-white/70 text-sm text-slate-700 placeholder-slate-300 focus:border-sky-300 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-400 text-white font-semibold text-sm shadow-lg shadow-sky-200 hover:shadow-sky-300 hover:from-sky-600 hover:to-sky-500 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {!isLogin && (
            <p className="text-center text-xs text-slate-400 mt-4">
              Your User ID is how people find and connect with you.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
