import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { SpinSegment } from '../types/index.js';
import {
  Disc3,
  Sparkles,
  Clock,
  History,
  AlertCircle,
  Award,
  Zap,
  Info,
} from 'lucide-react';

interface SpinPageProps {
  onOpenAuth: () => void;
}

export const SpinPage: React.FC<SpinPageProps> = ({ onOpenAuth }) => {
  const { user, userToken, refreshUser, updateUserBalance } = useAuth();
  const { language, t } = useLanguage();

  const [spinConfig, setSpinConfig] = useState<any>(null);
  const [userStatus, setUserStatus] = useState<any>(null);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastWin, setLastWin] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  const fetchStatus = async () => {
    if (!userToken) return;
    try {
      const res = await fetch('/api/spin/status', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSpinConfig(data.config);
        setUserStatus(data.userStatus);
        setRecentHistory(data.recentHistory);
        if (data.userStatus.cooldownRemaining > 0) {
          setCooldown(data.userStatus.cooldownRemaining);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [userToken]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((c) => Math.max(0, c - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const segments: SpinSegment[] = spinConfig?.segments || [
    { id: '1', label: '৳ 1', reward: 1, color: '#059669', probability: 30 },
    { id: '2', label: '৳ 5', reward: 5, color: '#0284c7', probability: 25 },
    { id: '3', label: '৳ 0', reward: 0, color: '#64748b', probability: 15 },
    { id: '4', label: '৳ 2', reward: 2, color: '#10b981', probability: 20 },
    { id: '5', label: '৳ 10', reward: 10, color: '#6366f1', probability: 10 },
    { id: '6', label: '৳ 20', reward: 20, color: '#8b5cf6', probability: 5 },
    { id: '7', label: '৳ 50', reward: 50, color: '#ec4899', probability: 2 },
    { id: '8', label: '৳ 100', reward: 100, color: '#f59e0b', probability: 1 },
  ];

  const numSegments = segments.length;
  const sliceAngle = 360 / numSegments;

  const handleSpin = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (isSpinning || cooldown > 0) return;

    setError(null);
    setLastWin(null);
    setIsSpinning(true);

    try {
      const res = await fetch('/api/spin/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Spin failed');
      }

      // Calculate target angle
      // Wheel pointer is at TOP (270 degrees or 90 degrees depending on offset)
      // Index 0 starts at angle 0. Target rotation = multiple of 360 + stop angle
      const winningIndex = data.winningIndex;
      const targetSegmentCenter = winningIndex * sliceAngle + sliceAngle / 2;
      const fullRotations = 5 * 360; // 5 full revolutions
      // Top pointer corresponds to 270 deg in SVG polar
      const targetAngle = fullRotations + (360 - targetSegmentCenter) + 270;

      setRotation((prev) => prev + targetAngle);

      // Wait for spin animation (4.5s)
      setTimeout(() => {
        setIsSpinning(false);
        setLastWin(data);
        updateUserBalance(data.newBalance);
        setCooldown(data.cooldownSeconds || 30);
        fetchStatus();

        if (data.reward > 0) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        }
      }, 4500);
    } catch (err: any) {
      setIsSpinning(false);
      setError(err.message || 'Spin error occurred');
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Title */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400 border border-amber-500/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{language === 'bn' ? 'প্রতিদিন ফ্রি ৩টি স্পিন' : 'Daily 3 Free Spins'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t.spinTitle}</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">{t.spinSubtitle}</p>
      </div>

      {/* Wheel Card */}
      <div className="relative rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl flex flex-col items-center">
        {/* Pointer Triangle */}
        <div className="relative z-20 -mb-5 flex flex-col items-center">
          <div className="h-0 w-0 border-x-8 border-x-transparent border-t-[16px] border-t-amber-400 drop-shadow-[0_4px_6px_rgba(245,158,11,0.6)]" />
        </div>

        {/* The SVG Wheel */}
        <div className="relative h-72 w-72 sm:h-84 sm:w-84 overflow-hidden rounded-full border-8 border-slate-950 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full transition-transform duration-[4500ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {segments.map((seg, i) => {
              const startAngle = (i * sliceAngle * Math.PI) / 180;
              const endAngle = (((i + 1) * sliceAngle) * Math.PI) / 180;
              const x1 = 50 + 50 * Math.cos(startAngle);
              const y1 = 50 + 50 * Math.sin(startAngle);
              const x2 = 50 + 50 * Math.cos(endAngle);
              const y2 = 50 + 50 * Math.sin(endAngle);

              // Text position
              const midAngle = ((i + 0.5) * sliceAngle * Math.PI) / 180;
              const tx = 50 + 32 * Math.cos(midAngle);
              const ty = 50 + 32 * Math.sin(midAngle);
              const textRotate = (i + 0.5) * sliceAngle + 90;

              return (
                <g key={seg.id}>
                  <path
                    d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                    fill={seg.color}
                    stroke="#0f172a"
                    strokeWidth="0.8"
                  />
                  <text
                    x={tx}
                    y={ty}
                    fill="#ffffff"
                    fontSize="4.2"
                    fontWeight="900"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${textRotate}, ${tx}, ${ty})`}
                  >
                    {seg.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Center Hub */}
          <div className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-slate-900 bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 font-black shadow-lg">
            <span className="text-xs">৳</span>
          </div>
        </div>

        {/* Result Announcement */}
        {lastWin && (
          <div className="mt-5 text-center animate-in zoom-in-95 duration-200">
            <div
              className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-bold shadow-lg ${
                lastWin.reward > 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Award className="h-4 w-4" />
              <span>
                {lastWin.reward > 0
                  ? `${t.spinWon} ৳ ${lastWin.reward}!`
                  : t.spinZero}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Spin CTA Button */}
        <div className="mt-6 flex flex-col items-center gap-2 w-full max-w-xs">
          <button
            onClick={handleSpin}
            disabled={isSpinning || cooldown > 0}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 py-3.5 text-xs font-black text-slate-950 uppercase tracking-wider hover:brightness-110 transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            {isSpinning ? (
              <span className="flex items-center justify-center gap-2">
                <Disc3 className="h-4 w-4 animate-spin" />
                <span>হুইল ঘুরছে...</span>
              </span>
            ) : cooldown > 0 ? (
              <span className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{cooldown}s অপেক্ষা করুন</span>
              </span>
            ) : (
              <span>{t.spinNow}</span>
            )}
          </button>

          {/* Spin Counters */}
          <div className="flex items-center justify-between w-full text-[11px] text-slate-400 px-2">
            <span>
              {t.freeSpinsLeft}:{' '}
              <strong className="text-emerald-400 font-mono">
                {userStatus ? userStatus.freeSpinsLeft : 3}
              </strong>
            </span>
            <span>
              {t.spinsLeftToday}:{' '}
              <strong className="text-white font-mono">
                {userStatus ? userStatus.spinsRemainingToday : 10}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Rules & History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rules */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Info className="h-4 w-4 text-emerald-400" />
            <span>{language === 'bn' ? 'লাকি স্পিনের নিয়মাবলী' : 'Spin Rules & Fairness'}</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside">
            <li>
              {language === 'bn'
                ? 'প্রতিদিন ৩টি ফ্রি স্পিন দেওয়া হয়। এর পর প্রতিটি স্পিনে মাত্র ৳ ২ কাটা হবে।'
                : '3 free spins daily. Subsequent spins cost ৳ 2 from wallet balance.'}
            </li>
            <li>
              {language === 'bn'
                ? 'স্পিনের ফলাফল সম্পূর্ণভাবে সার্ভার-সাইড সিকিউর র্যান্ডম অ্যালগরিদমে নির্ধারিত।'
                : 'Results are calculated securely on the server with weighted probabilities.'}
            </li>
            <li>
              {language === 'bn'
                ? 'জয়ী টাকা তাত্ক্ষণিকভাবে আপনার মূল ব্যালেন্সে যুক্ত হবে।'
                : 'Winnings are credited to your available balance in real time.'}
            </li>
          </ul>
        </div>

        {/* Recent User Spin History */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <History className="h-4 w-4 text-amber-400" />
            <span>{language === 'bn' ? 'আপনার সাম্প্রতিক স্পিন হিস্টোরি' : 'Your Spin History'}</span>
          </h3>

          {recentHistory.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">
              {language === 'bn' ? 'আজ এখনও কোনো স্পিন করা হয়নি।' : 'No spins today.'}
            </p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recentHistory.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-slate-950/70 p-2.5 text-xs border border-slate-800/80"
                >
                  <span className="text-slate-300 font-medium">{s.segmentLabel}</span>
                  <div className="text-right">
                    <span
                      className={`font-bold ${
                        s.reward > 0 ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {s.reward > 0 ? `+৳ ${s.reward}` : '৳ 0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
