import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  Users,
  Copy,
  Check,
  Share2,
  Sparkles,
  TrendingUp,
  Award,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface ReferralPageProps {
  onOpenAuth: () => void;
}

export const ReferralPage: React.FC<ReferralPageProps> = ({ onOpenAuth }) => {
  const { user, userToken } = useAuth();
  const { language, t } = useLanguage();

  const [data, setData] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (userToken) {
      fetch('/api/user/referrals', {
        headers: { Authorization: `Bearer ${userToken}` },
      })
        .then((r) => r.json())
        .then((d) => setData(d))
        .catch((e) => console.error(e));
    }
  }, [userToken]);

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <Users className="h-12 w-12 text-purple-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">
          {language === 'bn' ? 'রেফারেল দেখতে লগইন করুন' : 'Sign In for Referral Link'}
        </h2>
        <p className="text-xs text-slate-400">
          {language === 'bn'
            ? 'আপনার বন্ধুদের ইনভাইট করে প্রতিটি রেফারে নিশ্চিত বোনাস ও লাইফটাইম কমিশন পান।'
            : 'Invite friends and earn ৳ 15 per referral + 10% lifetime commission.'}
        </p>
        <button
          onClick={onOpenAuth}
          className="rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400"
        >
          {t.login} / {t.register}
        </button>
      </div>
    );
  }

  const referralCode = user.referralCode;
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'TakaEarn BD Referral',
        text: `Join TakaEarn BD with my code ${referralCode} and earn real BDT with bKash & Nagad withdrawals!`,
        url: referralLink,
      });
    } else {
      copyToClipboard(referralLink, true);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Hero Card */}
      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/20 px-3 py-1 text-xs font-bold text-purple-300 border border-purple-500/30">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>
              {language === 'bn' ? 'আজীবন রেফারেল কমিশন প্রোগ্রাম' : 'Lifetime Referral Commission'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{t.referralTitle}</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t.referralSubtitle}
          </p>
        </div>
      </div>

      {/* Share Box & Referral Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Referral Code Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <span className="text-xs font-semibold text-slate-400">{t.yourReferralCode}</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl bg-slate-950 p-3 border border-slate-800 font-mono text-lg font-black text-emerald-400 tracking-wider">
              {referralCode}
            </div>
            <button
              onClick={() => copyToClipboard(referralCode, false)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20"
            >
              {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedCode ? t.copied : t.copyCode}</span>
            </button>
          </div>
        </div>

        {/* Referral Link Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <span className="text-xs font-semibold text-slate-400">{t.shareLink}</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl bg-slate-950 p-3 border border-slate-800 text-xs text-slate-300 truncate font-mono">
              {referralLink}
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-3 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-md shadow-purple-600/20"
            >
              <Share2 className="h-4 w-4" />
              <span>{copiedLink ? t.copied : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-xs text-slate-400">মোট রেফার মেম্বার</span>
          <p className="mt-1 text-2xl font-black text-white">{data?.totalReferrals || 0}</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-xs text-slate-400">{t.activeReferrals}</span>
          <p className="mt-1 text-2xl font-black text-emerald-400">
            {data?.activeReferrals || 0}
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <span className="text-xs text-slate-400">{t.referralEarnings}</span>
          <p className="mt-1 text-2xl font-black text-purple-400">
            ৳ {(data?.totalEarnedCommission || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Referred Users List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>{t.referredUsersList}</span>
          <span className="text-xs font-normal text-slate-400">
            {data?.referralsList?.length || 0} মেম্বার যুক্ত হয়েছেন
          </span>
        </h3>

        {!data?.referralsList || data.referralsList.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-500">
            {language === 'bn'
              ? 'আপনার রেফারেল লিংক দিয়ে এখনও কেউ একাউন্ট খোলেনি। লিংক শেয়ার করুন এবং বোনাস নিন!'
              : 'No referrals yet. Share your link to start earning.'}
          </p>
        ) : (
          <div className="space-y-2">
            {data.referralsList.map((refUser: any) => (
              <div
                key={refUser.id}
                className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800 text-xs"
              >
                <div>
                  <p className="font-semibold text-white">{refUser.name}</p>
                  <p className="text-[10px] text-slate-500">
                    যুক্ত হয়েছেন: {new Date(refUser.createdAt).toLocaleDateString('bn-BD')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold">
                    {refUser.tasksCompleted} {language === 'bn' ? 'টি টাস্ক সম্পন্ন' : 'tasks'}
                  </span>
                  <p className="text-[10px] text-slate-400">১০% কমিশন সক্রিয়</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
