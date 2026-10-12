import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Shield, Lock, User, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const { loginAdmin } = useAuth();

  const [status, setStatus] = useState<{
    initialized: boolean;
    targetUsername: string;
    requiresSetup: boolean;
  } | null>(null);

  const [username, setUsername] = useState('mdratan');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/status')
      .then((r) => r.json())
      .then((data) => {
        setStatus(data);
        if (data.targetUsername) setUsername(data.targetUsername);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Admin login failed');

      loginAdmin(data.token, data.admin);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long for admin security.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/setup-initial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Admin setup failed');

      loginAdmin(data.token, data.admin);
      setSuccess('Administrator credentials secured successfully!');
      setTimeout(() => onSuccess(), 800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md my-12 px-4">
      <div className="rounded-3xl border border-purple-500/30 bg-slate-900 p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-lg">
            <Shield className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-white">TakaEarn BD Admin Portal</h2>
          <p className="text-xs text-slate-400">
            {status.requiresSetup
              ? 'First-Time Administrator Setup for username "mdratan"'
              : 'Authorized Platform Management & Financial Governance'}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {status.requiresSetup ? (
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="rounded-xl bg-purple-950/30 border border-purple-500/20 p-3 text-xs text-purple-300">
              <span className="font-bold block">One-Time Administrator Provisioning:</span>
              <p className="mt-1 text-[11px] text-purple-200/80">
                Initial admin username is locked to <strong>mdratan</strong>. Please set a strong password (min 8 chars) to initialize the secure master account.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  disabled
                  value="mdratan"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-4 text-xs font-mono font-bold text-slate-300 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Set Secure Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-purple-600 py-3 text-xs font-extrabold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              {loading ? 'Securing Admin Account...' : 'Initialize Administrator Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="mdratan"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-purple-600 py-3 text-xs font-extrabold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
            >
              {loading ? 'Verifying Credentials...' : 'Sign In as Administrator'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
