import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { WithdrawalRequest } from '../../types/index.js';
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const AdminWithdrawals: React.FC = () => {
  const { adminToken } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [methodFilter, setMethodFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Approval modal
  const [activeReqForAction, setActiveReqForAction] = useState<WithdrawalRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [transactionRef, setTransactionRef] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWithdrawals = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter) q.append('status', statusFilter);
      if (methodFilter) q.append('method', methodFilter);

      const res = await fetch(`/api/admin/withdrawals?${q.toString()}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [adminToken, statusFilter, methodFilter]);

  const openApproveModal = (w: WithdrawalRequest) => {
    setActiveReqForAction(w);
    setActionType('approve');
    setTransactionRef('BD' + Math.floor(10000000 + Math.random() * 90000000));
    setAdminNote('Payment disbursed to mobile banking account');
  };

  const openRejectModal = (w: WithdrawalRequest) => {
    setActiveReqForAction(w);
    setActionType('reject');
    setTransactionRef('');
    setAdminNote('Mobile banking number invalid or inactive. Funds refunded.');
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReqForAction) return;
    setSubmitting(true);

    try {
      const endpoint =
        actionType === 'approve'
          ? `/api/admin/withdrawals/${activeReqForAction.id}/approve`
          : `/api/admin/withdrawals/${activeReqForAction.id}/reject`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          transactionRef: actionType === 'approve' ? transactionRef : undefined,
          reason: actionType === 'reject' ? adminNote : undefined,
          adminNote: actionType === 'approve' ? adminNote : undefined,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Action failed');

      setActiveReqForAction(null);
      fetchWithdrawals();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-purple-400" />
            <span>Withdrawal Requests & Disbursement</span>
          </h1>
          <p className="text-xs text-slate-400">
            Review bKash, Nagad, and Rocket requests. Rejection automatically refunds user balance.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="paid">Paid & Approved</option>
            <option value="rejected">Rejected Only</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900 py-2 px-3 text-xs text-slate-300 focus:outline-none"
          >
            <option value="">All Methods</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
            <option value="rocket">Rocket</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Method & Account</th>
                <th className="py-3 px-4">Amount / Fee</th>
                <th className="py-3 px-4">Payable</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No withdrawal requests matching filter.
                  </td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-white block">{w.userName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(w.requestedAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-white uppercase block">
                        {w.method}
                      </span>
                      <span className="font-mono text-xs text-emerald-400">
                        {w.accountNumber} ({w.accountType})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-white">৳ {w.amount}</span>
                      <span className="text-[10px] text-slate-400 block">Fee: ৳ {w.fee}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-black text-emerald-400 text-sm">৳ {w.payableAmount}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          w.status === 'paid' || w.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : w.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {w.status}
                      </span>
                      {w.transactionRef && (
                        <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                          Ref: {w.transactionRef}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {w.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openApproveModal(w)}
                            className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30"
                          >
                            Approve & Pay
                          </button>
                          <button
                            onClick={() => openRejectModal(w)}
                            className="rounded-lg bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/30"
                          >
                            Reject & Refund
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-medium">Finalized</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Dialog (Approve or Reject) */}
      {activeReqForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {actionType === 'approve' ? 'Approve & Mark Paid' : 'Reject Withdrawal Request'}
            </h3>
            <p className="text-xs text-slate-400">
              User: <strong>{activeReqForAction.userName}</strong> | {activeReqForAction.method.toUpperCase()}:{' '}
              <strong className="text-emerald-400 font-mono">{activeReqForAction.accountNumber}</strong> | Amount:{' '}
              <strong className="text-white">৳ {activeReqForAction.payableAmount}</strong>
            </p>

            <form onSubmit={handleConfirmAction} className="space-y-3.5 text-xs">
              {actionType === 'approve' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Mobile Banking Transaction Reference ID (TRXID)
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  {actionType === 'approve' ? 'Administrative Note' : 'Rejection Reason (Refund to User)'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveReqForAction(null)}
                  className="flex-1 rounded-xl bg-slate-800 py-2.5 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 rounded-xl py-2.5 font-bold text-white ${
                    actionType === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {submitting
                    ? 'Processing...'
                    : actionType === 'approve'
                    ? 'Confirm Disbursement'
                    : 'Reject & Refund Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
