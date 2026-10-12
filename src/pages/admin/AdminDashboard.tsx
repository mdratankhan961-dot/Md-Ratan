import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  Users,
  Wallet,
  CheckSquare,
  Clock,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  PlayCircle,
  Disc3,
  ShieldAlert,
} from 'lucide-react';

export const AdminDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { adminToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminToken) {
      fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then((r) => r.json())
        .then((d) => {
          setData(d);
          setLoading(false);
        })
        .catch((e) => console.error(e));
    }
  }, [adminToken]);

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const m = data.metrics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Administrator Command Center</h1>
          <p className="text-xs text-slate-400">
            Real-time platform financial liabilities, user metrics, and pending actions
          </p>
        </div>
      </div>

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-purple-500/30 bg-slate-900 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Registered Users</span>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">{m.totalUsers}</div>
          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
            <span className="text-emerald-400 font-bold">{m.activeUsers} Active</span>
            <span>•</span>
            <span className="text-rose-400 font-bold">{m.suspendedUsers} Suspended</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-slate-900 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pending Withdrawals</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300">
            ৳ {m.pendingWithdrawalAmount.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-amber-400 font-semibold cursor-pointer" onClick={() => onNavigate('withdrawals')}>
            {m.pendingWithdrawalCount} requests waiting review →
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total User Balances</span>
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-300">
            ৳ {m.totalUserBalances.toFixed(2)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Platform outstanding liabilities
          </div>
        </div>

        <div className="rounded-2xl border border-teal-500/30 bg-slate-900 p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Payouts Completed</span>
            <CheckSquare className="h-4 w-4 text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-teal-300">
            ৳ {m.paidWithdrawalAmount.toFixed(2)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Disbursed via bKash / Nagad
          </div>
        </div>
      </div>

      {/* Rewards Distribution Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <CheckSquare className="h-4 w-4 text-emerald-400" />
            <span>Task Completions & Rewards</span>
          </div>
          <p className="mt-2 text-xl font-black text-white">{m.totalTaskCompletions} Completed</p>
          <span className="text-[11px] text-slate-400">Across {m.totalTasks} active tasks</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Disc3 className="h-4 w-4 text-amber-400" />
            <span>Lucky Spin Rewards</span>
          </div>
          <p className="mt-2 text-xl font-black text-amber-300">
            ৳ {m.totalSpinRewards.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-400">Credited to user balances</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>Referral Bonuses & Comm.</span>
          </div>
          <p className="mt-2 text-xl font-black text-purple-300">
            ৳ {m.totalReferralRewards.toFixed(2)}
          </p>
          <span className="text-[11px] text-slate-400">Signup & task commissions</span>
        </div>
      </div>

      {/* Recent Withdrawals & Audit Trail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pending / Recent Withdrawals */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Recent Withdrawal Requests
            </h3>
            <button
              onClick={() => onNavigate('withdrawals')}
              className="text-xs font-bold text-purple-400 hover:underline"
            >
              Manage All →
            </button>
          </div>

          {data.recentWithdrawals?.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-500">No withdrawal requests.</p>
          ) : (
            <div className="space-y-2">
              {data.recentWithdrawals.map((w: any) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-xl bg-slate-950 p-2.5 text-xs border border-slate-800"
                >
                  <div>
                    <span className="font-bold text-white">{w.userName}</span>
                    <p className="text-[10px] text-slate-500">
                      {w.method.toUpperCase()} ({w.accountNumber})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-400">৳ {w.amount}</span>
                    <span
                      className={`block text-[9px] font-bold uppercase ${
                        w.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {w.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log Stream */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Recent Administrative Audit Events
            </h3>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs font-bold text-purple-400 hover:underline"
            >
              Full Log →
            </button>
          </div>

          {data.recentAudit?.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-500">No logs recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentAudit.map((a: any) => (
                <div
                  key={a.id}
                  className="rounded-xl bg-slate-950 p-2.5 text-xs border border-slate-800 space-y-0.5"
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-purple-400 font-mono">@{a.adminUsername}</span>
                    <span className="text-slate-500">{new Date(a.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-300 font-medium text-[11px] truncate">{a.details}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
