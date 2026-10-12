import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Eye,
  ExternalLink,
  Info,
} from 'lucide-react';

interface WatchAdsPageProps {
  onOpenAuth: () => void;
}

export const WatchAdsPage: React.FC<WatchAdsPageProps> = ({ onOpenAuth }) => {
  const { user, userToken, refreshUser, updateUserBalance } = useAuth();
  const { language, t } = useLanguage();

  const [adStatus, setAdStatus] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchSecondsRemaining, setWatchSecondsRemaining] = useState(15);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    if (!userToken) return;
    try {
      const res = await fetch('/api/ads/status', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAdStatus(data);
        if (data.cooldownRemaining > 0) {
          setCooldown(data.cooldownRemaining);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [userToken]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((c) => Math.max(0, c - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  // Video watch timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && watchSecondsRemaining > 0) {
      timer = setInterval(() => {
        setWatchSecondsRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, watchSecondsRemaining]);

  const handleStartAd = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (cooldown > 0) return;

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ads/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ provider: 'monetag' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize ad');

      setSessionToken(data.sessionToken);
      setWatchSecondsRemaining(data.requiredWatchSeconds || 15);
      setIsPlaying(true);
    } catch (err: any) {
      setError(err.message || 'Ad could not load');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async () => {
    if (!sessionToken || watchSecondsRemaining > 0) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/ads/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ sessionToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reward verification failed');

      setIsPlaying(false);
      setSessionToken(null);
      setSuccessMsg(data.message);
      updateUserBalance(data.newBalance);
      setCooldown(adStatus?.cooldownSeconds || 60);
      fetchStatus();

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err.message || 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-400 border border-teal-500/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{language === 'bn' ? 'স্পন্সরড ভিডিও পার্টনার' : 'Verified Partner Ads'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t.watchAdTitle}</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">{t.watchAdSubtitle}</p>
      </div>

      {/* Main Video Ad Player Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              {language === 'bn' ? 'প্রতি এড রিওয়ার্ড' : 'Reward per Ad'}
            </span>
            <p className="text-xl font-black text-emerald-400">
              ৳ {adStatus?.reward || 2.5}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              {language === 'bn' ? 'আজকের লিমিট' : 'Daily Limit'}
            </span>
            <p className="text-xl font-black text-white">
              {adStatus?.watchedToday || 0} / {adStatus?.dailyLimit || 20}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-2xl bg-slate-950 p-4 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              {language === 'bn' ? 'কুলডাউন বিরতি' : 'Cooldown'}
            </span>
            <p className="text-xl font-black text-teal-400">
              {adStatus?.cooldownSeconds || 60}s
            </p>
          </div>
        </div>

        {/* Player Mock Screen / Active Video */}
        {!isPlaying ? (
          <div className="relative aspect-video w-full rounded-2xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <PlayCircle className="h-10 w-10" />
            </div>
            <h3 className="text-base font-bold text-white">
              {language === 'bn' ? '১৫ সেকেন্ডের স্পন্সর এড দেখুন' : 'Watch 15-second sponsor video'}
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              {language === 'bn'
                ? 'এড সম্পূর্ণ দেখা শেষে ভেরিফিকেশনের মাধ্যমে সরাসরি ওয়ালেটে টাকা যোগ হবে।'
                : 'Stay until countdown finishes to verify completion.'}
            </p>

            {/* Direct Link safe badge for Monetag */}
            {adStatus?.adConfig?.monetag?.directLinkUrl && (
              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Shield className="h-3 w-3 text-emerald-400" />
                <span>Monetag & Adsterra Publisher SDK Ready</span>
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-video w-full rounded-2xl border-2 border-emerald-500/40 bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <div className="h-14 w-14 rounded-full border-4 border-emerald-500/20 bg-slate-900 flex items-center justify-center mb-3">
              <span className="text-2xl font-black text-emerald-400">
                {watchSecondsRemaining}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white">
              {watchSecondsRemaining > 0
                ? language === 'bn'
                  ? 'বিজ্ঞাপন চলছে... অনুগ্রহ করে অপেক্ষা করুন'
                  : 'Playing sponsor advertisement...'
                : language === 'bn'
                ? 'ভিডিও দেখা সম্পন্ন! রিওয়ার্ড দাবি করুন'
                : 'Watch completed! Claim reward now'}
            </h3>

            {/* Simulated interactive sponsor ad banner */}
            <div className="mt-4 max-w-md w-full rounded-xl bg-gradient-to-r from-teal-950/80 to-slate-900 p-3 border border-teal-500/20 text-xs text-left">
              <div className="flex items-center justify-between text-teal-400 font-bold mb-1">
                <span>Adsterra / Monetag Partner Broadcast</span>
                <span className="text-[10px] text-slate-400">Verified</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Earn real cash rewards in Bangladesh. Instant cashout via bKash, Nagad and Rocket.
              </p>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <div>
          {!isPlaying ? (
            <button
              onClick={handleStartAd}
              disabled={loading || cooldown > 0}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-xs font-black text-slate-950 uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              {cooldown > 0 ? (
                <>
                  <Clock className="h-4 w-4" />
                  <span>
                    {language === 'bn' ? `পরবর্তী এডের জন্য ${cooldown}s অপেক্ষা করুন` : `Wait ${cooldown}s`}
                  </span>
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" />
                  <span>{t.watchAdButton} (৳ {adStatus?.reward || 2.5})</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleClaimReward}
              disabled={loading || watchSecondsRemaining > 0}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-xs font-black text-slate-950 uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-40"
            >
              {watchSecondsRemaining > 0 ? (
                <>
                  <Clock className="h-4 w-4" />
                  <span>{watchSecondsRemaining}s বাকি...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t.claimReward}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
