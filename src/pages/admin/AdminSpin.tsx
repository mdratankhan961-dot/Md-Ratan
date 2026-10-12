import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { SpinConfig, SpinSegment } from '../../types/index.js';
import { Disc3, Plus, Trash2, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AdminSpin: React.FC = () => {
  const { adminToken } = useAuth();
  const [spinConfig, setSpinConfig] = useState<SpinConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (adminToken) {
      fetch('/api/admin/spin', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then((r) => r.json())
        .then((d) => setSpinConfig(d.spinConfig))
        .catch((e) => console.error(e));
    }
  }, [adminToken]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spinConfig) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/spin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(spinConfig),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to update spin config');

      setSuccess('Lucky Spin configurations updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSegment = (idx: number, field: keyof SpinSegment, value: any) => {
    if (!spinConfig) return;
    const newSegments = [...spinConfig.segments];
    newSegments[idx] = { ...newSegments[idx], [field]: value };
    setSpinConfig({ ...spinConfig, segments: newSegments });
  };

  const handleAddSegment = () => {
    if (!spinConfig) return;
    const newSeg: SpinSegment = {
      id: Date.now().toString(),
      label: '৳ 3',
      reward: 3,
      color: '#06b6d4',
      probability: 10,
    };
    setSpinConfig({ ...spinConfig, segments: [...spinConfig.segments, newSeg] });
  };

  const handleRemoveSegment = (idx: number) => {
    if (!spinConfig || spinConfig.segments.length <= 4) {
      alert('A minimum of 4 wheel segments is required.');
      return;
    }
    const newSegments = spinConfig.segments.filter((_, i) => i !== idx);
    setSpinConfig({ ...spinConfig, segments: newSegments });
  };

  if (!spinConfig) {
    return <div className="text-slate-500 py-12 text-center text-xs">Loading spin settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Disc3 className="h-6 w-6 text-amber-400" />
          <span>Lucky Spin Management & Probabilities</span>
        </h1>
        <p className="text-xs text-slate-400">
          Configure wheel slice rewards in BDT, server probability weights, cooldowns, and free spins.
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
        {/* Global Limits Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white">General Spin Parameters</h3>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <span>Enable Spin Feature</span>
              <input
                type="checkbox"
                checked={spinConfig.isEnabled}
                onChange={(e) => setSpinConfig({ ...spinConfig, isEnabled: e.target.checked })}
                className="h-4 w-4 rounded accent-amber-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Daily Spin Limit</label>
              <input
                type="number"
                value={spinConfig.dailySpinLimit}
                onChange={(e) =>
                  setSpinConfig({ ...spinConfig, dailySpinLimit: parseInt(e.target.value, 10) })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Free Spins Daily</label>
              <input
                type="number"
                value={spinConfig.freeSpinsDaily}
                onChange={(e) =>
                  setSpinConfig({ ...spinConfig, freeSpinsDaily: parseInt(e.target.value, 10) })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Paid Spin Cost (৳)</label>
              <input
                type="number"
                value={spinConfig.spinCost}
                onChange={(e) =>
                  setSpinConfig({ ...spinConfig, spinCost: parseFloat(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Cooldown (Sec)</label>
              <input
                type="number"
                value={spinConfig.cooldownSeconds}
                onChange={(e) =>
                  setSpinConfig({ ...spinConfig, cooldownSeconds: parseInt(e.target.value, 10) })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Segments Configuration Table */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-white">Wheel Segments & Probabilities</h3>
              <p className="text-[11px] text-slate-400">
                Probability weights dictate server-side random distribution. Higher weight = more frequent.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSegment}
              className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Slice</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {spinConfig.segments.map((seg, idx) => (
              <div
                key={seg.id || idx}
                className="flex items-center gap-3 rounded-2xl bg-slate-950 p-3 border border-slate-800 text-xs"
              >
                <div
                  className="h-8 w-8 rounded-xl shrink-0 border border-slate-700"
                  style={{ backgroundColor: seg.color }}
                />
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Label</span>
                    <input
                      type="text"
                      value={seg.label}
                      onChange={(e) => handleUpdateSegment(idx, 'label', e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-white font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Reward (৳)</span>
                    <input
                      type="number"
                      step="1"
                      value={seg.reward}
                      onChange={(e) =>
                        handleUpdateSegment(idx, 'reward', parseFloat(e.target.value))
                      }
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-emerald-400 font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Probability Weight</span>
                    <input
                      type="number"
                      value={seg.probability}
                      onChange={(e) =>
                        handleUpdateSegment(idx, 'probability', parseInt(e.target.value, 10))
                      }
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Hex Color</span>
                    <input
                      type="text"
                      value={seg.color}
                      onChange={(e) => handleUpdateSegment(idx, 'color', e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-slate-300 font-mono"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSegment(idx)}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 px-6 text-xs font-black text-slate-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
        >
          <Save className="h-4 w-4" />
          <span>{loading ? 'Saving...' : 'Save Spin Configurations'}</span>
        </button>
      </form>
    </div>
  );
};
