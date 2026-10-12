import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { AdNetworksConfig } from '../../types/index.js';
import {
  Sparkles,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code,
  Globe,
} from 'lucide-react';

export const AdminAds: React.FC = () => {
  const { adminToken } = useAuth();
  const [adConfig, setAdConfig] = useState<AdNetworksConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (adminToken) {
      fetch('/api/admin/ads', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then((r) => r.json())
        .then((d) => setAdConfig(d.adConfig))
        .catch((e) => console.error(e));
    }
  }, [adminToken]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adConfig) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/ads', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(adConfig),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to update ads config');

      setSuccess('Ad Network integrations updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!adConfig) {
    return <div className="text-slate-500 py-12 text-center text-xs">Loading ad settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Globe className="h-6 w-6 text-purple-400" />
          <span>Ad Network Integration & Publisher Placements</span>
        </h1>
        <p className="text-xs text-slate-400">
          Manage authorized publisher codes for Adsterra, Monetag Direct Links, and partner slots.
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
        {/* Section A: Adsterra */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-orange-500" />
              <h3 className="font-bold text-sm text-white">Adsterra Network Placements</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <span>Enable Adsterra</span>
              <input
                type="checkbox"
                checked={adConfig.adsterra.enabled}
                onChange={(e) =>
                  setAdConfig({
                    ...adConfig,
                    adsterra: { ...adConfig.adsterra, enabled: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded accent-purple-600"
              />
            </label>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Banner Ad Code (728x90 / 300x250 script slot)
              </label>
              <textarea
                rows={2}
                value={adConfig.adsterra.bannerCode}
                onChange={(e) =>
                  setAdConfig({
                    ...adConfig,
                    adsterra: { ...adConfig.adsterra, bannerCode: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-slate-300 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Social Bar Interactive Push Slot Code
              </label>
              <textarea
                rows={2}
                value={adConfig.adsterra.socialBarCode}
                onChange={(e) =>
                  setAdConfig({
                    ...adConfig,
                    adsterra: { ...adConfig.adsterra, socialBarCode: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-slate-300 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Popunder Placement Slot Code
              </label>
              <textarea
                rows={2}
                value={adConfig.adsterra.popunderCode}
                onChange={(e) =>
                  setAdConfig({
                    ...adConfig,
                    adsterra: { ...adConfig.adsterra, popunderCode: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-[11px] text-slate-300 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section B: Monetag */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              <h3 className="font-bold text-sm text-white">Monetag Integration</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <span>Enable Monetag</span>
              <input
                type="checkbox"
                checked={adConfig.monetag.enabled}
                onChange={(e) =>
                  setAdConfig({
                    ...adConfig,
                    monetag: { ...adConfig.monetag, enabled: e.target.checked },
                  })
                }
                className="h-4 w-4 rounded accent-purple-600"
              />
            </label>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Monetag Direct Link URL
              </label>
              <input
                type="url"
                value={adConfig.monetag.directLinkUrl}
                onChange={(e) =>
                  setAdConfig({
                    ...adConfig,
                    monetag: { ...adConfig.monetag, directLinkUrl: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Must be an authorized publisher link provided in your Monetag account dashboard.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 rounded-xl bg-slate-950 p-3 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adConfig.monetag.showTaskGatePlacement}
                  onChange={(e) =>
                    setAdConfig({
                      ...adConfig,
                      monetag: { ...adConfig.monetag, showTaskGatePlacement: e.target.checked },
                    })
                  }
                  className="h-4 w-4 rounded accent-purple-600"
                />
                <span>Display on 10s Task Security Gate</span>
              </label>

              <label className="flex items-center gap-2 rounded-xl bg-slate-950 p-3 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adConfig.monetag.showRewardPlacement}
                  onChange={(e) =>
                    setAdConfig({
                      ...adConfig,
                      monetag: { ...adConfig.monetag, showRewardPlacement: e.target.checked },
                    })
                  }
                  className="h-4 w-4 rounded accent-purple-600"
                />
                <span>Display on Video Ads Section</span>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 px-6 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20"
        >
          <Save className="h-4 w-4" />
          <span>{loading ? 'Saving Changes...' : 'Save Ad Settings'}</span>
        </button>
      </form>
    </div>
  );
};
