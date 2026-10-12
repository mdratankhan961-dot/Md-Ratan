import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  Lock,
  Phone,
  User,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { loginUser } = useAuth();
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Form states
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-detect ref from URL search query (?ref=TK123456)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
      setMode('register');
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone: identifier,
            email: identifier.includes('@') ? identifier : undefined,
            password,
            referralCode: referralCode || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');

        loginUser(data.token, data.user);
        setSuccess(data.message || 'Registration successful!');
        setTimeout(() => onClose(), 800);
      } else if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');

        loginUser(data.token, data.user);
        setSuccess('Logged in successfully!');
        setTimeout(() => onClose(), 600);
      } else if (mode === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        setSuccess(data.message || 'Password reset instructions dispatched.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl shadow-emerald-950/20">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Tabs */}
        {mode !== 'forgot' ? (
          <div className="mb-6 flex rounded-2xl bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                mode === 'login'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.login}
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
                mode === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.register}
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white">
              {language === 'bn' ? 'পাসওয়ার্ড পুনরুদ্ধার' : 'Reset Password'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'bn'
                ? 'আপনার রেজিস্টার্ড ফোন নম্বর বা ইমেইল প্রবেশ করান'
                : 'Enter your registered phone or email'}
            </p>
          </div>
        )}

        {/* Error / Success feedback */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {language === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder={language === 'bn' ? 'উদা: মোঃ সাব্বির হোসেন' : 'e.g. Sabbir Hossain'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {language === 'bn' ? 'মোবাইল নম্বর বা ইমেইল' : 'Mobile Number or Email'}
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                placeholder={language === 'bn' ? '০১৭XXXXXXXX বা ইমেইল' : '017XXXXXXXX or Email'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  {language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>{language === 'bn' ? 'রেফারেল কোড (ঐচ্ছিক)' : 'Referral Code (Optional)'}</span>
                <span className="text-[10px] text-emerald-400 font-normal">
                  {language === 'bn' ? 'বোনাস: ৳ ১০' : 'Bonus: ৳ 10'}
                </span>
              </label>
              <div className="relative">
                <Sparkles className="absolute left-3.5 top-3 h-4 w-4 text-amber-400" />
                <input
                  type="text"
                  placeholder="e.g. TK98213"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full uppercase font-mono rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none tracking-wider"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login'
                    ? t.login
                    : mode === 'register'
                    ? t.register
                    : language === 'bn'
                    ? 'রিসেট লিংক পাঠান'
                    : 'Send Reset Code'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {mode === 'forgot' && (
          <button
            onClick={() => setMode('login')}
            className="mt-4 w-full text-center text-xs text-slate-400 hover:text-white"
          >
            {language === 'bn' ? '← লগইনে ফিরে যান' : '← Back to Login'}
          </button>
        )}

        <div className="mt-5 border-t border-slate-800/80 pt-4 text-center text-[11px] text-slate-400">
          {language === 'bn'
            ? 'সুরক্ষিত ও নিরাপদ লেনদেনের জন্য bKash, Nagad ও Rocket সমর্থিত।'
            : 'Guaranteed instant payouts via bKash, Nagad & Rocket.'}
        </div>
      </div>
    </div>
  );
};
