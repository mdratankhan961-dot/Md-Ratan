import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  Wallet,
  Globe,
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  Menu,
  X,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenAuth }) => {
  const { user, admin, logoutUser } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <span className="text-xl font-black text-slate-950">৳</span>
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Taka<span className="text-emerald-400">Earn</span> <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">BD</span>
              </span>
              <p className="text-[10px] text-slate-400 hidden sm:block font-medium">
                {language === 'bn' ? 'বাংলাদেশি আর্নিং প্ল্যাটফর্ম' : 'Bangladesh Earning Portal'}
              </p>
            </div>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-emerald-500/50 hover:text-white transition-all shadow-sm"
            title="Toggle Language"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
            <span>{language === 'bn' ? 'বাংলা' : 'English'}</span>
          </button>

          {/* User Balance Chip (when authenticated) */}
          {user ? (
            <button
              onClick={() => setCurrentTab('wallet')}
              className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:border-emerald-500/60 transition-all shadow-inner"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Wallet className="h-3 w-3" />
              </div>
              <span>৳ {user.balance.toFixed(2)}</span>
            </button>
          ) : null}

          {/* Notifications */}
          <button
            onClick={() => setShowNotificationModal(!showNotificationModal)}
            className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* User or Login CTA */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <div className="h-7 w-7 rounded-md bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-xs uppercase shadow">
                  {user.name.charAt(0)}
                </div>
                <span className="max-w-[80px] truncate hidden sm:inline">{user.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.phone || user.email}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                      <span>Ref:</span>
                      <span className="font-bold">{user.referralCode}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentTab('profile')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{t.profile}</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('wallet')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <Wallet className="h-3.5 w-3.5 text-teal-400" />
                    <span>{t.wallet} & {t.withdraw}</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('referral')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>{t.referral}</span>
                  </button>

                  <div className="border-t border-slate-800 my-1" />

                  <button
                    onClick={logoutUser}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{t.logout}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              {t.login} / {t.register}
            </button>
          )}

          {/* Admin badge link if admin is logged in */}
          {admin && (
            <button
              onClick={() => setCurrentTab('admin')}
              className="flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-950/40 px-2 py-1 text-[11px] font-semibold text-purple-300 hover:bg-purple-900/50"
              title="Admin Panel"
            >
              <Shield className="h-3 w-3 text-purple-400" />
              <span className="hidden md:inline">Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-400" />
                <h3 className="font-semibold text-sm text-white">
                  {language === 'bn' ? 'বিজ্ঞপ্তি ও নোটিশ' : 'Notifications & Announcements'}
                </h3>
              </div>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
                <p className="font-semibold text-emerald-300">🎉 পেমেন্ট রিলিজ নোটিশ</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  বিকাশ, নগদ ও রকেটে প্রতিদিন সকাল ১০টা থেকে রাত ১০টা পর্যন্ত নিরবচ্ছিন্নভাবে স্বয়ংক্রিয় প্রসেসিং চলছে।
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                <p className="font-semibold text-amber-300">⚡ লাকি স্পিন ও দৈনিক টাস্ক</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  প্রতিদিন ফ্রি ৩টি স্পিন ও নতুন স্পনসরড টাস্ক উপভোগ করুন এবং তাৎক্ষণিক ব্যালেন্স জমা করুন।
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNotificationModal(false)}
              className="mt-4 w-full rounded-xl bg-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
