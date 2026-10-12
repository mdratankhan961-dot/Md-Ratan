import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Edit,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  X,
  History,
  Clock,
  Wallet,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { adminToken } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Balance Adjustment Modal State
  const [selectedUserForAdjustment, setSelectedUserForAdjustment] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);

  // User Details Modal State
  const [detailedUser, setDetailedUser] = useState<any | null>(null);

  const fetchUsers = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search) q.append('search', search);
      if (statusFilter) q.append('status', statusFilter);

      const res = await fetch(`/api/admin/users?${q.toString()}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [adminToken, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const reason = prompt(
      `Please provide administrative reason for changing status of ${user.name} to ${nextStatus}:`,
      nextStatus === 'suspended' ? 'Policy violation review' : 'Account reactivated after review'
    );
    if (!reason) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: nextStatus, reason }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBalanceAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError(null);
    setAdjustSuccess(null);
    setAdjustLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${selectedUserForAdjustment.id}/adjust-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          amount: parseFloat(adjustAmount),
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Adjustment failed');

      setAdjustSuccess(data.message);
      fetchUsers();
      setTimeout(() => {
        setSelectedUserForAdjustment(null);
        setAdjustAmount('');
        setAdjustReason('');
        setAdjustSuccess(null);
      }, 1200);
    } catch (err: any) {
      setAdjustError(err.message);
    } finally {
      setAdjustLoading(false);
    }
  };

  const viewUserDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const d = await res.json();
        setDetailedUser(d);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-purple-400" />
            <span>User Management & Financial Ledger</span>
          </h1>
          <p className="text-xs text-slate-400">
            Audit user accounts, adjust balances with mandatory reasons, and suspend fraudulent users.
          </p>
        </div>

        {/* Search & Filter */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, phone, email, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 sm:w-64 rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </form>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4">Earned / Tasks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-white block">{u.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">Ref: {u.referralCode}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-300 font-mono block">{u.phone || 'N/A'}</span>
                    <span className="text-[10px] text-slate-500">{u.email || ''}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-black text-emerald-400 text-sm">৳ {u.balance.toFixed(2)}</span>
                    {u.pendingWithdrawal > 0 && (
                      <span className="block text-[10px] text-amber-400 font-semibold">
                        Pending: ৳ {u.pendingWithdrawal}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-slate-200 font-semibold">৳ {u.totalEarned.toFixed(2)}</span>
                    <span className="block text-[10px] text-slate-400">{u.tasksCompleted} tasks</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        u.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* View Details */}
                      <button
                        onClick={() => viewUserDetails(u.id)}
                        className="rounded-lg bg-slate-800 p-1.5 text-slate-300 hover:bg-slate-700"
                        title="View Details"
                      >
                        <History className="h-3.5 w-3.5" />
                      </button>

                      {/* Manual Balance Adjustment */}
                      <button
                        onClick={() => setSelectedUserForAdjustment(u)}
                        className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-300 hover:bg-emerald-500/30 font-bold text-[11px] flex items-center gap-1"
                        title="Adjust Balance"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>Adjust</span>
                      </button>

                      {/* Suspend / Reactivate */}
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`rounded-lg p-1.5 text-xs font-semibold ${
                          u.status === 'active'
                            ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        }`}
                        title={u.status === 'active' ? 'Suspend User' : 'Reactivate User'}
                      >
                        {u.status === 'active' ? (
                          <ShieldAlert className="h-3.5 w-3.5" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Balance Adjustment Modal (Section 11) */}
      {selectedUserForAdjustment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setSelectedUserForAdjustment(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                Administrative Balance Workflow
              </span>
              <h3 className="text-base font-black text-white mt-1">
                Adjust Balance for {selectedUserForAdjustment.name}
              </h3>
              <p className="text-xs text-slate-400">
                Current Balance: <strong className="text-emerald-400">৳ {selectedUserForAdjustment.balance.toFixed(2)}</strong>
              </p>
            </div>

            {adjustError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2.5 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{adjustError}</span>
              </div>
            )}
            {adjustSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{adjustSuccess}</span>
              </div>
            )}

            <form onSubmit={handleBalanceAdjustment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adjustment Amount (BDT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. +50.00 or -25.00"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs font-bold text-white focus:border-purple-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Use negative values to deduct (e.g., -50). Overdrafts are strictly prevented.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mandatory Administrative Reason
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Contest winner bonus / Manual reversal of disputed transaction"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={adjustLoading}
                className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50"
              >
                {adjustLoading ? 'Recording Ledger Transaction...' : 'Commit Immutable Ledger Adjustment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* User Details & History Modal */}
      {detailedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setDetailedUser(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">{detailedUser.user.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                ID: {detailedUser.user.id} | Ref: {detailedUser.user.referralCode}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-slate-500">Balance:</span>
                <p className="font-bold text-emerald-400 text-sm">৳ {detailedUser.user.balance}</p>
              </div>
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-slate-500">Total Earned:</span>
                <p className="font-bold text-white text-sm">৳ {detailedUser.user.totalEarned}</p>
              </div>
              <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                <span className="text-slate-500">Referred Users:</span>
                <p className="font-bold text-purple-400 text-sm">{detailedUser.referredUsersCount}</p>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Recent Transactions Ledger ({detailedUser.transactions?.length || 0})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {detailedUser.transactions?.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center rounded-lg bg-slate-950 p-2 text-xs border border-slate-800/80"
                  >
                    <div>
                      <span className="text-slate-200 block font-medium">{tx.description}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-bold ${
                        tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.amount >= 0 ? '+' : ''}৳ {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
