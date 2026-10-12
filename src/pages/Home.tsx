import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  Wallet,
  CheckSquare,
  Disc3,
  PlayCircle,
  Users,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface HomeProps {
  setCurrentTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Home: React.FC<HomeProps> = ({ setCurrentTab, onOpenAuth }) => {
  const { user, userToken, refreshUser } = useAuth();
  const { language, t } = useLanguage();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userToken) {
      fetch('/api/user/dashboard', {
        headers: { Authorization: `Bearer ${userToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setDashboardData(data);
        })
        .catch((err) => console.error(err));
    }
  }, [userToken]);

  // Dynamic fake/live payout activity ticker for realistic social proof
  const livePayouts = [
    { phone: '0171****492', amount: 350, method: 'bKash', time: '২ মিনিট আগে' },
    { phone: '0192****183', amount: 500, method: 'Nagad', time: '৫ মিনিট আগে' },
    { phone: '0184****920', amount: 200, method: 'Rocket', time: '৯ মিনিট আগে' },
    { phone: '0130****761', amount: 1000, method: 'bKash', time: '১২ মিনিট আগে' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner Notice */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 p-5 sm:p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>
                {language === 'bn'
                  ? 'বাংলাদেশের ১ নম্বর বিশ্বস্ত মাইক্রোটাস্ক প্ল্যাটফর্ম'
                  : 'Bangladesh #1 Trusted Microtask Platform'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {user
                ? `${t.welcomeBack}, ${user.name}!`
                : language === 'bn'
                ? 'টাস্ক সম্পন্ন করুন, বিকাশ ও নগদে টাকা নিন!'
                : 'Complete Easy Tasks & Withdraw via bKash & Nagad!'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {language === 'bn'
                ? 'প্রতিদিন সহজ স্পনসরড টাস্ক, ভিডিও বিজ্ঞাপন ও লাকি স্পিন থেকে ৳ ৫০০ পর্যন্ত আয় করুন। সরাসরি বিকাশ, নগদ ও রকেটে দ্রুত পেমেন্ট।'
                : 'Earn up to ৳ 500 daily by completing verified sponsor tasks, video ads, and daily wheel spins.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => setCurrentTab('wallet')}
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <Wallet className="h-4 w-4" />
                <span>{t.withdraw}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-xs font-black text-slate-950 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/30 active:scale-95"
              >
                <span>{language === 'bn' ? 'ফ্রি একাউন্ট খুলুন (বোনাস ৳১০)' : 'Sign Up Free (Bonus ৳10)'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Balance & Financial Cards (User View) */}
      {user ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>{t.availableBalance}</span>
              <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-white">
              ৳ {user.balance.toFixed(2)}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>{language === 'bn' ? 'উত্তোলনযোগ্য' : 'Ready to withdraw'}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-slate-900/90 p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>{t.pendingWithdrawal}</span>
              <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-amber-300">
              ৳ {user.pendingWithdrawal.toFixed(2)}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {language === 'bn' ? 'প্রসেসিং এর অপেক্ষায়' : 'In review queue'}
            </div>
          </div>

          <div className="rounded-2xl border border-teal-500/20 bg-slate-900/90 p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>{t.totalEarned}</span>
              <div className="h-7 w-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-teal-300">
              ৳ {user.totalEarned.toFixed(2)}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              {user.tasksCompleted} {language === 'bn' ? 'টি টাস্ক সম্পন্ন' : 'tasks completed'}
            </div>
          </div>

          <div className="rounded-2xl border border-purple-500/20 bg-slate-900/90 p-4 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>{t.referralEarnings}</span>
              <div className="h-7 w-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-black text-purple-300">
              ৳ {user.referralEarnings.toFixed(2)}
            </div>
            <div className="mt-1 text-[11px] text-purple-400 font-medium">
              {language === 'bn' ? '১০% লাইফটাইম কমিশন' : '10% lifetime comm.'}
            </div>
          </div>
        </div>
      ) : null}

      {/* 4 Core Earning Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>{t.startEarning}</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            {language === 'bn' ? 'দৈনিক সীমাহীন উপার্জনের সুযোগ' : 'Daily verified reward tasks'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Tasks */}
          <div
            onClick={() => setCurrentTab('tasks')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckSquare className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                ৳ 10 - ৳ 50
              </span>
            </div>
            <h3 className="mt-3.5 font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
              {t.tasks}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {language === 'bn'
                ? 'ভিজিট, কুইজ ও সোশ্যাল মিডিয়া টাস্ক করে নিশ্চিত টাকা পান।'
                : 'Browse partner sites, complete quizzes, and verify on server.'}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-400">
              <span>{language === 'bn' ? 'টাস্ক দেখুন' : 'Explore Tasks'}</span>
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Lucky Spin */}
          <div
            onClick={() => setCurrentTab('spin')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-amber-500/50 hover:bg-slate-800/80 transition-all shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 group-hover:rotate-45 transition-transform duration-300">
                <Disc3 className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20 animate-pulse">
                ৳ 100 জ্যাকপট
              </span>
            </div>
            <h3 className="mt-3.5 font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
              {t.spin}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {language === 'bn'
                ? 'প্রতিদিন ফ্রি ৩টি স্পিন ঘুরিয়ে আকর্ষণীয় ক্যাশ রিওয়ার্ড জিতুন।'
                : 'Spin the wheel daily for guaranteed instant prizes up to ৳ 100.'}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-400">
              <span>{language === 'bn' ? 'স্পিন করুন' : 'Play Spin'}</span>
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Watch Ads */}
          <div
            onClick={() => setCurrentTab('ads')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-teal-500/50 hover:bg-slate-800/80 transition-all shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 group-hover:scale-110 transition-transform">
                <PlayCircle className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-400 border border-teal-500/20">
                ৳ 2.5 / ভিডিও
              </span>
            </div>
            <h3 className="mt-3.5 font-bold text-sm text-white group-hover:text-teal-300 transition-colors">
              {t.watchAds}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {language === 'bn'
                ? '১৫ সেকেন্ডের স্পন্সর বিজ্ঞাপন দেখে প্রতিটিতে টাকা আয় করুন।'
                : 'Watch 15-second sponsor videos and get credited instantly.'}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-teal-400">
              <span>{language === 'bn' ? 'এড দেখুন' : 'Watch Now'}</span>
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Referrals */}
          <div
            onClick={() => setCurrentTab('referral')}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                ৳ 15 + 10%
              </span>
            </div>
            <h3 className="mt-3.5 font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
              {t.referral}
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {language === 'bn'
                ? 'বন্ধুদের ইনভাইট করুন এবং তাদের আজীবন আয়ের ১০% বোনাস পান।'
                : 'Share your referral link to earn ৳ 15 instantly + 10% lifetime.'}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-purple-400">
              <span>{language === 'bn' ? 'লিংক নিন' : 'Get Link'}</span>
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Live Bangladesh Payout Ticker */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {language === 'bn' ? 'লাইভ সফল উইথড্রয়াল আপডেট' : 'Live Verified Withdrawals'}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {livePayouts.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl bg-slate-950/70 p-2.5 border border-slate-800/80 text-xs"
            >
              <div>
                <span className="font-mono text-slate-300 font-semibold">{p.phone}</span>
                <p className="text-[10px] text-slate-500">{p.time}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-400">৳ {p.amount}</span>
                <p className="text-[10px] font-medium text-slate-400">{p.method}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent User Transactions or CTA */}
      {user && dashboardData?.recentTransactions?.length > 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">{t.recentTransactions}</h3>
            <button
              onClick={() => setCurrentTab('wallet')}
              className="text-xs font-semibold text-emerald-400 hover:underline"
            >
              {t.viewAll}
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {dashboardData.recentTransactions.map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl bg-slate-950/50 p-3 border border-slate-800/60 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-200">
                    {language === 'bn' && tx.descriptionBn ? tx.descriptionBn : tx.description}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(tx.createdAt).toLocaleDateString('bn-BD', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div
                  className={`font-black text-sm ${
                    tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {tx.amount >= 0 ? '+' : ''}৳ {tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
