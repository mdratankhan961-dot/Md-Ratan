import React from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  Home,
  CheckSquare,
  Disc3,
  PlayCircle,
  Wallet,
  Users,
  User,
  HelpCircle,
  Shield,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface DesktopSidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const links = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'tasks', label: t.tasks, icon: CheckSquare },
    { id: 'spin', label: t.spin, icon: Disc3, badge: 'HOT' },
    { id: 'ads', label: t.watchAds, icon: PlayCircle },
    { id: 'wallet', label: `${t.wallet} & ${t.withdraw}`, icon: Wallet },
    { id: 'referral', label: t.referral, icon: Users, badge: '৳15+' },
    { id: 'profile', label: t.profile, icon: User },
    { id: 'support', label: t.support, icon: HelpCircle },
    { id: 'admin', label: t.adminPanel, icon: Shield },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-800/80 bg-slate-950/60 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* User Quick Info (if logged in) */}
      {user && (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-900/80 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {language === 'bn' ? 'বর্তমান ব্যালেন্স' : 'Current Balance'}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
              <TrendingUp className="h-3 w-3" />
              BD BDT
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white tracking-tight">৳ {user.balance.toFixed(2)}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-500/10 pt-2 text-[11px]">
            <div>
              <span className="text-slate-400">{language === 'bn' ? 'পেন্ডিং' : 'Pending'}</span>
              <p className="font-semibold text-amber-400">৳ {user.pendingWithdrawal.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-slate-400">{language === 'bn' ? 'মোট আয়' : 'Earned'}</span>
              <p className="font-semibold text-emerald-300">৳ {user.totalEarned.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Menu */}
      <nav className="space-y-1.5 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = currentTab === link.id;

          return (
            <button
              key={link.id}
              onClick={() => setCurrentTab(link.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Official Community Help card */}
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-3.5 text-xs">
        <p className="font-semibold text-white flex items-center justify-between">
          <span>{language === 'bn' ? 'অফিসিয়াল টেলিগ্রাম' : 'Official Community'}</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          {language === 'bn'
            ? 'পেমেন্ট প্রুফ ও দৈনিক অফার পেতে টেলিগ্রাম গ্রুপে যুক্ত থাকুন।'
            : 'Join our Telegram channel for live bKash/Nagad proofs.'}
        </p>
        <a
          href="https://t.me"
          target="_blank"
          rel="noreferrer"
          className="mt-2.5 block text-center rounded-lg bg-emerald-500/20 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
        >
          {language === 'bn' ? 'টেলিগ্রামে জয়েন করুন' : 'Join Telegram'}
        </a>
      </div>
    </aside>
  );
};
