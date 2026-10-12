import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import { WithdrawalMethod, WithdrawalRequest, WalletTransaction } from '../types/index.js';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Phone,
  HelpCircle,
  FileText,
} from 'lucide-react';

interface WalletPageProps {
  onOpenAuth: () => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ onOpenAuth }) => {
  const { user, userToken, refreshUser } = useAuth();
  const { language, t } = useLanguage();

  const [summary, setSummary] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod>('bkash');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [accountType, setAccountType] = useState<'personal' | 'agent'>('personal');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'withdraw' | 'withdrawals' | 'transactions'>('withdraw');

  const fetchSummary = async () => {
    if (!userToken) return;
    try {
      const res = await fetch('/api/withdrawals/summary', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }

      const txRes = await fetch('/api/user/transactions', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [userToken]);

  const numAmount = parseFloat(amount) || 0;
  const feePercent = summary?.limits?.feePercent || 2;
  const feeAmount = Math.round(numAmount * (feePercent / 100) * 100) / 100;
  const finalPayable = Math.max(0, Math.round((numAmount - feeAmount) * 100) / 100);

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/withdrawals/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          amount: numAmount,
          method: selectedMethod,
          accountNumber,
          accountType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Withdrawal failed');

      setSuccess(data.message);
      setAmount('');
      setAccountNumber('');
      fetchSummary();
      refreshUser();
      setActiveTab('withdrawals');
    } catch (err: any) {
      setError(err.message || 'Withdrawal submission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWithdrawal = async (id: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি রিকোয়েস্টটি বাতিল করে টাকা ওয়ালেটে ফেরত নিতে চান?' : 'Cancel withdrawal and refund to wallet?')) {
      return;
    }
    try {
      const res = await fetch(`/api/withdrawals/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      fetchSummary();
      refreshUser();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <Wallet className="h-12 w-12 text-emerald-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">
          {language === 'bn' ? 'ওয়ালেট দেখতে লগইন করুন' : 'Sign In to Access Wallet'}
        </h2>
        <p className="text-xs text-slate-400">
          {language === 'bn'
            ? 'আপনার ব্যালেন্স দেখতে ও বিকাশ/নগদে টাকা তুলতে লগইন বা রেজিস্ট্রেশন করুন।'
            : 'Access your BDT balance and request instant withdrawals.'}
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

  const methods = [
    {
      id: 'bkash',
      name: 'bKash',
      color: '#e2136e',
      border: 'hover:border-pink-500',
      activeBorder: 'border-pink-500 bg-pink-950/20',
      sub: 'বিকাশ পার্সোনাল',
    },
    {
      id: 'nagad',
      name: 'Nagad',
      color: '#f7941d',
      border: 'hover:border-orange-500',
      activeBorder: 'border-orange-500 bg-orange-950/20',
      sub: 'নগদ পার্সোনাল',
    },
    {
      id: 'rocket',
      name: 'Rocket',
      color: '#8c3494',
      border: 'hover:border-purple-500',
      activeBorder: 'border-purple-500 bg-purple-950/20',
      sub: 'রকেট একাউন্ট',
    },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Wallet Balance Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-5 shadow-lg">
          <span className="text-xs text-slate-400 font-medium">{t.availableBalance}</span>
          <div className="mt-1 text-2xl sm:text-3xl font-black text-white">
            ৳ {user.balance.toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-emerald-400 font-semibold">
            {language === 'bn' ? 'উইথড্র করার জন্য রেডি' : 'Available for withdrawal'}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-slate-900 p-5 shadow-lg">
          <span className="text-xs text-slate-400 font-medium">{t.pendingWithdrawal}</span>
          <div className="mt-1 text-2xl sm:text-3xl font-black text-amber-300">
            ৳ {user.pendingWithdrawal.toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {language === 'bn' ? 'রিভিউ ও প্রসেসিংয়ে রয়েছে' : 'Under admin review'}
          </p>
        </div>

        <div className="rounded-2xl border border-teal-500/20 bg-slate-900 p-5 shadow-lg">
          <span className="text-xs text-slate-400 font-medium">{t.totalEarned}</span>
          <div className="mt-1 text-2xl sm:text-3xl font-black text-teal-300">
            ৳ {user.totalEarned.toFixed(2)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {language === 'bn' ? 'লাইফটাইম উপার্জিত টাকা' : 'Lifetime completed earnings'}
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'withdraw'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUpRight className="h-4 w-4" />
          <span>{t.withdraw} (উইথড্র রিকোয়েস্ট)</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'withdrawals'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>উইথড্রয়াল রিকোয়েস্ট হিস্টোরি</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'transactions'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>লেনদেন লেজার (All Transactions)</span>
        </button>
      </div>

      {/* Tab 1: New Withdrawal Request */}
      {activeTab === 'withdraw' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmitWithdrawal} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                {t.withdrawalMethods}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id as WithdrawalMethod)}
                    className={`rounded-2xl border p-3.5 text-center transition-all ${
                      selectedMethod === m.id
                        ? m.activeBorder
                        : `border-slate-800 bg-slate-950 ${m.border}`
                    }`}
                  >
                    <div
                      className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl font-black text-white text-xs shadow-md mb-1.5"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.name.charAt(0)}
                    </div>
                    <span className="font-bold text-xs text-white block">{m.name}</span>
                    <span className="text-[10px] text-slate-400">{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {selectedMethod.toUpperCase()} {t.enterAccount}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.accountType}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('personal')}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold border transition-all ${
                      accountType === 'personal'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    {t.personal}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('agent')}
                    className={`flex-1 rounded-xl py-2.5 text-xs font-bold border transition-all ${
                      accountType === 'agent'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    {t.agent}
                  </button>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  {t.enterAmount}
                </label>
                <span className="text-[11px] text-slate-400">
                  {t.minWithdrawalNotice}: ৳ {summary?.limits?.min || 100} | {t.maxWithdrawalNotice}: ৳ {summary?.limits?.max || 10000}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-3 text-sm font-black text-slate-500">৳</span>
                <input
                  type="number"
                  required
                  min={summary?.limits?.min || 100}
                  max={summary?.limits?.max || 10000}
                  step="1"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-20 text-sm font-bold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAmount(Math.floor(user.balance).toString())}
                  className="absolute right-2 top-2 rounded-lg bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-emerald-400 hover:bg-slate-700"
                >
                  Max (সব)
                </button>
              </div>
            </div>

            {/* Fee & Payable Calculation Summary */}
            {numAmount > 0 && (
              <div className="rounded-2xl bg-slate-950 p-4 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>উইথড্রয়াল রিকোয়েস্ট অ্যামাউন্ট:</span>
                  <span className="font-bold text-white">৳ {numAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t.withdrawalFee} ({feePercent}%):</span>
                  <span className="text-amber-400">- ৳ {feeAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm">
                  <span className="text-white">{t.finalPayable}:</span>
                  <span className="text-emerald-400">৳ {finalPayable.toFixed(2)}</span>
                </div>
              </div>
            )}

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

            <button
              type="submit"
              disabled={loading || numAmount <= 0 || user.balance < numAmount}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-xs font-black text-slate-950 uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-40"
            >
              {loading ? (
                <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t.confirmWithdrawal}</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Withdrawal History */}
      {activeTab === 'withdrawals' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl">
          <h3 className="text-sm font-bold text-white mb-4">
            {language === 'bn' ? 'আপনার উইথড্রয়াল রিকোয়েস্ট হিস্টোরি' : 'Your Withdrawal Requests'}
          </h3>

          {!summary?.history || summary.history.length === 0 ? (
            <p className="text-center py-10 text-xs text-slate-500">
              {language === 'bn' ? 'এখনও কোনো উইথড্রয়াল রিকোয়েস্ট করা হয়নি।' : 'No withdrawal requests yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {summary.history.map((w: WithdrawalRequest) => (
                <div
                  key={w.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-white uppercase">
                          {w.method}
                        </span>
                        <span className="font-mono text-slate-400">({w.accountNumber})</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(w.requestedAt).toLocaleString('bn-BD')}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          w.status === 'paid' || w.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : w.status === 'pending' || w.status === 'processing'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border-t border-slate-900 pt-2 text-[11px]">
                    <div>
                      <span className="text-slate-500">উইথড্র:</span>
                      <p className="font-bold text-white">৳ {w.amount}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">চার্জ ({feePercent}%):</span>
                      <p className="text-slate-400">৳ {w.fee}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">পাবেন:</span>
                      <p className="font-bold text-emerald-400">৳ {w.payableAmount}</p>
                    </div>
                  </div>

                  {w.transactionRef && (
                    <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-500/20">
                      Txn Ref: {w.transactionRef}
                    </div>
                  )}

                  {w.adminNote && (
                    <div className="text-[10px] text-slate-400 italic">
                      Note: {w.adminNote}
                    </div>
                  )}

                  {/* Allow user to cancel pending request */}
                  {w.status === 'pending' && (
                    <div className="border-t border-slate-900 pt-2 flex justify-end">
                      <button
                        onClick={() => handleCancelWithdrawal(w.id)}
                        className="text-[11px] font-semibold text-rose-400 hover:text-rose-300"
                      >
                        {t.cancelWithdrawal} ({language === 'bn' ? 'ব্যালেন্স ফেরত নিন' : 'Refund to balance'})
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Complete Transaction Ledger */}
      {activeTab === 'transactions' && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl">
          <h3 className="text-sm font-bold text-white mb-4">
            {language === 'bn' ? 'অডিট লেজার ও ট্রানজেকশন হিস্টোরি' : 'Immutable Account Ledger'}
          </h3>

          {transactions.length === 0 ? (
            <p className="text-center py-10 text-xs text-slate-500">
              {t.noTransactions}
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-xl bg-slate-950 p-3 border border-slate-800/80 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-200">
                      {language === 'bn' && tx.descriptionBn ? tx.descriptionBn : tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                      <span>{new Date(tx.createdAt).toLocaleString('bn-BD')}</span>
                      <span>•</span>
                      <span className="font-mono">
                        Bal: ৳ {tx.balanceBefore.toFixed(2)} → ৳ {tx.balanceAfter.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`font-black text-sm shrink-0 ml-3 ${
                      tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.amount >= 0 ? '+' : ''}৳ {tx.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
