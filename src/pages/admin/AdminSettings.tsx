import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { RewardSettings } from '../../types/index.js';
import { Sliders, Save, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { adminToken } = useAuth();
  const [settings, setSettings] = useState<RewardSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminToken) return;
    fetch('/api/admin/settings', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((r) => r.json())
      .then((d) => setSettings(d.rewardSettings))
      .catch((e) => console.error(e));
  }, [adminToken]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(settings),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to save settings');

      setSuccess('Reward settings saved successfully and active immediately!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!settings) {
    return <div className="text-slate-500 py-12 text-center text-xs">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Sliders className="h-6 w-6 text-purple-400" />
          <span>Central Reward & Withdrawal Configuration</span>
        </h1>
        <p className="text-xs text-slate-400">
          Global financial rules, withdrawal minimums & fees, and welcome bonuses.
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Withdrawal Parameters */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">
            Withdrawal Safeguards & Thresholds (BDT)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Minimum Withdrawal (৳)
              </label>
              <input
                type="number"
                value={settings.minWithdrawal}
                onChange={(e) =>
                  setSettings({ ...settings, minWithdrawal: parseFloat(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Maximum Withdrawal per Request (৳)
              </label>
              <input
                type="number"
                value={settings.maxWithdrawal}
                onChange={(e) =>
                  setSettings({ ...settings, maxWithdrawal: parseFloat(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Platform Withdrawal Fee (%)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.withdrawalFeePercent}
                onChange={(e) =>
                  setSettings({ ...settings, withdrawalFeePercent: parseFloat(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-amber-400 font-bold"
              />
            </div>
          </div>
        </div>

        {/* User Bonuses & Referral Rewards */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">
            User Welcome Bonuses & Referral Commissions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Welcome Signup Bonus (৳)
              </label>
              <input
                type="number"
                value={settings.signupBonus}
                onChange={(e) =>
                  setSettings({ ...settings, signupBonus: parseFloat(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-emerald-400 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Referral Instant Bonus (৳)
              </label>
              <input
                type="number"
                value={settings.referralBonus}
                onChange={(e) =>
                  setSettings({ ...settings, referralBonus: parseFloat(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-purple-400 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Task Referral Commission (%)
              </label>
              <input
                type="number"
                value={settings.referralCommissionPercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    referralCommissionPercent: parseFloat(e.target.value),
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-purple-400 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Video Ad Defaults */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-2">
            Video Ad Rewards & Throttling
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Reward per Ad Watch (৳)
              </label>
              <input
                type="number"
                step="0.5"
                value={settings.videoAdReward}
                onChange={(e) =>
                  setSettings({ ...settings, videoAdReward: parseFloat(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-teal-400 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Daily Watch Limit
              </label>
              <input
                type="number"
                value={settings.dailyVideoAdLimit}
                onChange={(e) =>
                  setSettings({ ...settings, dailyVideoAdLimit: parseInt(e.target.value, 10) })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Cooldown (Seconds)
              </label>
              <input
                type="number"
                value={settings.videoAdCooldownSeconds}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    videoAdCooldownSeconds: parseInt(e.target.value, 10),
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
              />
            </div>
          </div>
        </div>

        {/* Announcements & Maintenance */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-white">Platform Notice & Maintenance</h3>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-rose-400">
              <ShieldAlert className="h-4 w-4" />
              <span>Maintenance Mode</span>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) =>
                  setSettings({ ...settings, maintenanceMode: e.target.checked })
                }
                className="h-4 w-4 rounded accent-rose-600"
              />
            </label>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Top Announcement Notice (English)
              </label>
              <input
                type="text"
                value={settings.noticeBanner || ''}
                onChange={(e) => setSettings({ ...settings, noticeBanner: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Top Announcement Notice (বাংলা)
              </label>
              <input
                type="text"
                value={settings.noticeBannerBn || ''}
                onChange={(e) => setSettings({ ...settings, noticeBannerBn: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 px-6 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
        >
          <Save className="h-4 w-4" />
          <span>{loading ? 'Saving Settings...' : 'Save Central Settings'}</span>
        </button>
      </form>
    </div>
  );
};
