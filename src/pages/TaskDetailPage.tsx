import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { Task } from '../types/index.js';
import {
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  Play,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onSuccess,
}) => {
  const { userToken, updateUserBalance } = useAuth();
  const { language, t } = useLanguage();

  // State phases: 'overview' | 'gate' | 'task_running' | 'completed'
  const [phase, setPhase] = useState<'overview' | 'gate' | 'task_running' | 'completed'>('overview');
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Gate countdown (10s)
  const [gateRemaining, setGateRemaining] = useState<number>(10);
  const [gateError, setGateError] = useState<string | null>(null);

  // Task duration countdown
  const [taskRemaining, setTaskRemaining] = useState<number>(30);
  const [proofText, setProofText] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReward, setSuccessReward] = useState<number>(0);

  useEffect(() => {
    if (task) {
      setTaskRemaining(task.durationSeconds || 30);
      setGateRemaining(task.gateSeconds || 10);
      setPhase('overview');
      setSessionToken(null);
      setError(null);
    }
  }, [task]);

  // Handle 10-Second Gate Interval
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'gate' && gateRemaining > 0) {
      timer = setInterval(() => {
        setGateRemaining((prev) => prev - 1);
      }, 1000);
    } else if (phase === 'gate' && gateRemaining === 0) {
      // Auto attempt passing gate
      handlePassGate();
    }
    return () => clearInterval(timer);
  }, [phase, gateRemaining]);

  // Handle Task Duration Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'task_running' && taskRemaining > 0) {
      timer = setInterval(() => {
        setTaskRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, taskRemaining]);

  if (!task) return null;

  // Step 1: Start 10-Second Ad Gate
  const handleStartGate = async () => {
    setError(null);
    setGateError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}/start-gate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate task');

      setSessionToken(data.sessionToken);
      setGateRemaining(data.gateSeconds || 10);
      setPhase('gate');
    } catch (err: any) {
      setError(err.message || 'Cannot start task');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Validate 10-Second Gate on server
  const handlePassGate = async () => {
    if (!sessionToken) return;
    setLoading(true);
    setGateError(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/pass-gate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ sessionToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ad verification failed.');
      }

      setPhase('task_running');
      setTaskRemaining(data.durationSeconds || task.durationSeconds || 30);
    } catch (err: any) {
      setGateError(err.message || 'Ad gate failed');
      setPhase('overview'); // cancel countdown
    } finally {
      setLoading(false);
    }
  };

  // Abandon Gate
  const handleAbandonGate = async () => {
    if (sessionToken) {
      try {
        await fetch(`/api/tasks/${task.id}/abandon-gate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({ sessionToken }),
        });
      } catch (e) {
        console.error(e);
      }
    }
    setPhase('overview');
    setGateRemaining(10);
    setError(
      language === 'bn'
        ? 'বিজ্ঞাপনটি বন্ধ করায় টাস্ক কাউন্টডাউন বাতিল করা হয়েছে।'
        : 'Session cancelled because the ad gate was closed early.'
    );
  };

  // Step 3: Complete Task
  const handleCompleteTask = async () => {
    if (!sessionToken) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/tasks/${task.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ sessionToken, proofText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify task completion');

      updateUserBalance(data.newBalance);
      setSuccessReward(data.reward);
      setPhase('completed');

      // Trigger Celebration Confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setError(err.message || 'Task validation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-7 shadow-2xl overflow-hidden">
        {/* Close Button */}
        {phase !== 'gate' && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Phase 1: Task Overview & Instructions */}
        {phase === 'overview' && (
          <div className="space-y-4">
            <div className="flex items-start justify-between pr-8">
              <div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                  {task.category.toUpperCase().replace('_', ' ')}
                </span>
                <h2 className="mt-2 text-lg sm:text-xl font-bold text-white">
                  {language === 'bn' && task.titleBn ? task.titleBn : task.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl bg-slate-950 p-3.5 border border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  {t.reward}
                </span>
                <p className="text-xl font-black text-emerald-400">৳ {task.reward}</p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  {t.duration}
                </span>
                <p className="text-sm font-bold text-white flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>{task.durationSeconds} {t.seconds}</span>
                </p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  ভেরিফিকেশন গেট
                </span>
                <p className="text-sm font-bold text-amber-400 flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  <span>১০ সেকেন্ড এড</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'bn' && task.descriptionBn ? task.descriptionBn : task.description}
            </p>

            <div className="space-y-2 rounded-2xl bg-slate-950/70 p-4 border border-slate-800/80">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-emerald-400" />
                <span>{language === 'bn' ? 'টাস্ক সম্পন্ন করার নিয়মাবলী:' : 'Task Instructions:'}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
                {(language === 'bn' && task.instructionsBn ? task.instructionsBn : task.instructions).map(
                  (inst, idx) => (
                    <li key={idx} className="leading-normal">
                      {inst}
                    </li>
                  )
                )}
              </ul>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleStartGate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              <span>{language === 'bn' ? '১০ সেকেন্ড এড দেখে টাস্ক শুরু করুন' : 'Start Task (10s Ad Gate)'}</span>
            </button>
          </div>
        )}

        {/* Phase 2: Mandatory 10-Second Ad Gate Countdown */}
        {phase === 'gate' && (
          <div className="space-y-5 text-center py-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Shield className="h-7 w-7 animate-pulse" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">{t.adGateTitle}</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                {t.adGateNotice}
              </p>
            </div>

            {/* Countdown Badge */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-amber-500/20 bg-slate-950">
                <span className="text-4xl font-black text-amber-400">{gateRemaining}</span>
                <span className="text-[10px] text-slate-400 absolute bottom-3">সেকেন্ড বাকি</span>
              </div>
              <p className="mt-2 text-xs font-semibold text-slate-300 animate-pulse">
                {t.countdown}...
              </p>
            </div>

            {/* Simulated Adsterra / Monetag sponsor container */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Sponsor Advertisement (Adsterra / Monetag Gateway)
              </span>
              <div className="mt-2.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 p-3 text-slate-300 border border-emerald-500/20">
                <p className="font-semibold text-emerald-300">
                  {language === 'bn'
                    ? '🇧🇩 বিকাশ ও নগদ ক্যাশব্যাক পার্টনার অফার'
                    : 'Exclusive Fintech Promotion Partner'}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  {language === 'bn'
                    ? 'সিকিউরিটি চেক চলছে। টাইমার শেষ হওয়া পর্যন্ত অপেক্ষা করুন।'
                    : 'Active verification in progress. Please maintain this screen.'}
                </p>
              </div>
            </div>

            {gateError && (
              <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                {gateError}
              </div>
            )}

            <button
              onClick={handleAbandonGate}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-4"
            >
              {t.cancelGate} ({language === 'bn' ? 'স্কিপ করলে টাস্ক বাতিল হবে' : 'will cancel task'})
            </button>
          </div>
        )}

        {/* Phase 3: Task Duration Timer & Verification */}
        {phase === 'task_running' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-bold text-sm text-white">
                  {language === 'bn' ? 'টাস্ক চলমান...' : 'Task in progress...'}
                </h3>
              </div>
              <span className="font-mono text-sm font-black text-emerald-400">
                {taskRemaining > 0 ? `${taskRemaining}s` : 'সম্পন্ন!'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                style={{
                  width: `${Math.min(
                    100,
                    ((task.durationSeconds - taskRemaining) / task.durationSeconds) * 100
                  )}%`,
                }}
              />
            </div>

            {task.externalUrl && (
              <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800">
                <p className="text-xs text-slate-300 font-medium mb-2">
                  {language === 'bn'
                    ? 'নিচের বাটনে ক্লিক করে স্পন্সর লিংক ওপেন করুন এবং প্রয়োজনীয় সময় পর্যন্ত অবস্থান করুন:'
                    : 'Open sponsor link and remain on the page:'}
                </p>
                <a
                  href={task.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
                >
                  <span>{language === 'bn' ? 'স্পন্সর সাইট ভিজিট করুন' : 'Visit Sponsor Website'}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
                </a>
              </div>
            )}

            {task.requiresProof && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {language === 'bn' ? 'প্রুফ / ইউজারনেম জমা দিন' : 'Submission Proof'}
                </label>
                <input
                  type="text"
                  placeholder={task.proofPlaceholder || 'e.g. @username'}
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleCompleteTask}
              disabled={loading || taskRemaining > 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-40"
            >
              {taskRemaining > 0 ? (
                <>
                  <Clock className="h-4 w-4" />
                  <span>
                    {language === 'bn'
                      ? `আর ${taskRemaining} সেকেন্ড অপেক্ষা করুন`
                      : `Wait ${taskRemaining}s to verify`}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{t.claimReward} (৳ {task.reward})</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Phase 4: Completed & Rewarded */}
        {phase === 'completed' && (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">
                {language === 'bn' ? 'টাস্ক সফলভাবে সম্পন্ন!' : 'Task Completed Successfully!'}
              </h3>
              <p className="mt-1 text-sm text-emerald-400 font-bold">
                ৳ {successReward} {language === 'bn' ? 'ওয়ালেটে যোগ করা হয়েছে' : 'credited to your balance'}
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onSuccess();
              }}
              className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-extrabold text-slate-950 hover:bg-emerald-400"
            >
              {language === 'bn' ? 'ঠিক আছে' : 'Awesome'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
