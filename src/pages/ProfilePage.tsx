import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  User,
  Shield,
  KeyRound,
  LogOut,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Fingerprint,
} from 'lucide-react';

interface ProfilePageProps {
  onOpenAuth: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onOpenAuth }) => {
  const { user, userToken, logoutUser } = useAuth();
  const { language, t } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <User className="h-12 w-12 text-emerald-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">
          {language === 'bn' ? 'প্রোফাইল দেখতে লগইন করুন' : 'Sign In to View Profile'}
        </h2>
        <button
          onClick={onOpenAuth}
          className="rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
        >
          {t.login} / {t.register}
        </button>
      </div>
    );
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError(language === 'bn' ? 'নতুন পাসওয়ার্ড দুইটি মিলছে না।' : 'New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed');

      setSuccess(data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      {/* Profile Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 text-2xl font-black shadow-lg">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  user.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {user.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">ID: {user.id}</p>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 flex items-center gap-3">
            <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                মোবাইল নম্বর
              </span>
              <p className="text-slate-200 font-medium">{user.phone || 'যুক্ত করা হয়নি'}</p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 flex items-center gap-3">
            <Mail className="h-4 w-4 text-teal-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                ইমেইল ঠিকানা
              </span>
              <p className="text-slate-200 font-medium truncate">{user.email || 'যুক্ত করা হয়নি'}</p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 flex items-center gap-3">
            <Fingerprint className="h-4 w-4 text-purple-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                রেফারেল কোড
              </span>
              <p className="text-emerald-400 font-bold font-mono">{user.referralCode}</p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 flex items-center gap-3">
            <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold">
                রেজিস্ট্রেশন তারিখ
              </span>
              <p className="text-slate-200 font-medium">
                {new Date(user.createdAt).toLocaleDateString('bn-BD')}
              </p>
            </div>
          </div>
        </div>

        {/* Security / Change Password */}
        <div className="border-t border-slate-800 pt-6">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-emerald-400" />
            <span>{language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password'}</span>
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <input
                type="password"
                required
                placeholder={language === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="password"
                required
                placeholder={language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="password"
                required
                placeholder={language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
            >
              {loading ? 'আপডেট হচ্ছে...' : language === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Logout */}
        <div className="border-t border-slate-800 pt-4 flex justify-end">
          <button
            onClick={logoutUser}
            className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-900/30 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
