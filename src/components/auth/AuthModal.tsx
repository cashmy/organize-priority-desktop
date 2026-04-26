import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ListTodo, Loader2 } from 'lucide-react';

interface Props {
  onClose?: () => void;
}

const AuthModal: React.FC<Props> = ({ onClose }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email || password.length < 6) {
      setError('Enter a valid email and password (min 6 chars).');
      return;
    }
    setLoading(true);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error: err } = await fn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else if (mode === 'signup') {
      setSuccess('Account created. You can now sign in.');
      setMode('signin');
    } else {
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-xs text-slate-500">
              Sync your tasks across devices
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700 mb-1 block">Password</label>
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              placeholder="At least 6 characters"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-md">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          <p className="text-center text-xs text-slate-500">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
                setSuccess(null);
              }}
              className="text-indigo-600 hover:underline font-medium"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
          Your tasks remain available offline and sync when you reconnect.
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
