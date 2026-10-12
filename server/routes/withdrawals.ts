import { Router, Response } from 'express';
import { getDb, saveDatabase } from '../db.js';
import { requireUserAuth, AuthenticatedRequest } from '../auth.js';
import { WithdrawalRequest, WalletTransaction } from '../../src/types/index.js';

const router = Router();

// Get withdrawal settings and user history
router.get('/summary', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const db = getDb();
  const settings = db.rewardSettings;

  const userWithdrawals = db.withdrawals
    .filter((w) => w.userId === user.id)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());

  res.json({
    balance: user.balance,
    pendingWithdrawal: user.pendingWithdrawal,
    totalEarned: user.totalEarned,
    limits: {
      min: settings.minWithdrawal,
      max: settings.maxWithdrawal,
      feePercent: settings.withdrawalFeePercent,
    },
    methods: [
      {
        id: 'bkash',
        name: 'bKash',
        logoColor: '#e2136e',
        tagline: 'Instant Mobile Payout',
        taglineBn: 'বিকাশ পার্সোনাল ওয়ালেট',
      },
      {
        id: 'nagad',
        name: 'Nagad',
        logoColor: '#f7941d',
        tagline: 'Post Office Digital Payout',
        taglineBn: 'নগদ পার্সোনাল ওয়ালেট',
      },
      {
        id: 'rocket',
        name: 'Rocket',
        logoColor: '#8c3494',
        tagline: 'DBBL Mobile Banking',
        taglineBn: 'রকেট একাউন্ট (১২ ডিজিট)',
      },
    ],
    history: userWithdrawals,
  });
});

// Submit a withdrawal request
router.post('/submit', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const db = getDb();
    const settings = db.rewardSettings;
    const { amount, method, accountNumber, accountType = 'personal' } = req.body;

    const parsedAmount = Math.round(Number(amount) * 100) / 100;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ error: 'Please enter a valid amount.' });
      return;
    }

    if (parsedAmount < settings.minWithdrawal) {
      res.status(400).json({
        error: `Minimum withdrawal amount is ৳ ${settings.minWithdrawal}.`,
      });
      return;
    }

    if (parsedAmount > settings.maxWithdrawal) {
      res.status(400).json({
        error: `Maximum withdrawal limit per request is ৳ ${settings.maxWithdrawal}.`,
      });
      return;
    }

    if (!['bkash', 'nagad', 'rocket'].includes(method)) {
      res.status(400).json({ error: 'Invalid payment method selected. Must be bKash, Nagad, or Rocket.' });
      return;
    }

    const cleanAccount = String(accountNumber || '').trim().replace(/[^0-9]/g, '');
    if (cleanAccount.length < 11 || cleanAccount.length > 12) {
      res.status(400).json({
        error: 'Please enter a valid 11 or 12 digit Bangladeshi mobile number (e.g., 017XXXXXXXX).',
      });
      return;
    }

    // Check available balance
    if (user.balance < parsedAmount) {
      res.status(400).json({
        error: `Insufficient available balance! You have ৳ ${user.balance}, but requested ৳ ${parsedAmount}.`,
      });
      return;
    }

    // Check if there are already multiple pending withdrawals for this user (prevent spam)
    const existingPending = db.withdrawals.filter(
      (w) => w.userId === user.id && (w.status === 'pending' || w.status === 'processing')
    );
    if (existingPending.length >= 3) {
      res.status(400).json({
        error: 'You already have 3 pending withdrawal requests in review. Please wait until they are processed.',
      });
      return;
    }

    // Financial calculations
    const fee = Math.round((parsedAmount * (settings.withdrawalFeePercent / 100)) * 100) / 100;
    const payableAmount = Math.round((parsedAmount - fee) * 100) / 100;

    // ATOMIC BALANCE RESERVATION: Deduct from available balance, add to pending liability
    const oldBalance = user.balance;
    user.balance = Math.round((user.balance - parsedAmount) * 100) / 100;
    user.pendingWithdrawal = Math.round((user.pendingWithdrawal + parsedAmount) * 100) / 100;

    const withdrawalId = 'wd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    // Immutable ledger entry for reserved balance
    const ledgerEntry: WalletTransaction = {
      id: 'tx_wd_' + Date.now(),
      userId: user.id,
      type: 'withdrawal_reserve',
      amount: -parsedAmount,
      balanceBefore: oldBalance,
      balanceAfter: user.balance,
      referenceId: withdrawalId,
      description: `Withdrawal request to ${method.toUpperCase()} (${cleanAccount}) - Reserved`,
      descriptionBn: `${method.toUpperCase()} (${cleanAccount}) উইথড্রয়াল রিকোয়েস্ট - রিজার্ভ`,
      createdAt: new Date().toISOString(),
    };

    db.transactions.unshift(ledgerEntry);

    const withdrawalReq: WithdrawalRequest = {
      id: withdrawalId,
      userId: user.id,
      userName: user.name,
      userPhone: user.phone || cleanAccount,
      amount: parsedAmount,
      fee,
      payableAmount,
      method,
      accountNumber: cleanAccount,
      accountType: accountType === 'agent' ? 'agent' : 'personal',
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    db.withdrawals.unshift(withdrawalReq);
    await saveDatabase();

    res.status(201).json({
      success: true,
      message: `Withdrawal of ৳ ${parsedAmount} submitted via ${method.toUpperCase()}. Status: Pending.`,
      withdrawal: withdrawalReq,
      newBalance: user.balance,
      pendingBalance: user.pendingWithdrawal,
    });
  } catch (err: any) {
    console.error('Withdrawal submission error:', err);
    res.status(500).json({ error: err.message || 'Withdrawal processing failed' });
  }
});

// Cancel a pending withdrawal (User action)
router.post('/:id/cancel', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const db = getDb();

    const request = db.withdrawals.find((w) => w.id === id && w.userId === user.id);
    if (!request) {
      res.status(404).json({ error: 'Withdrawal request not found.' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({
        error: `Cannot cancel a withdrawal that is already ${request.status}. Only 'pending' requests can be cancelled.`,
      });
      return;
    }

    // Atomic Balance Refund
    const oldBalance = user.balance;
    user.balance = Math.round((user.balance + request.amount) * 100) / 100;
    user.pendingWithdrawal = Math.max(0, Math.round((user.pendingWithdrawal - request.amount) * 100) / 100);
    request.status = 'cancelled';
    request.processedAt = new Date().toISOString();

    const ledgerEntry: WalletTransaction = {
      id: 'tx_can_' + Date.now(),
      userId: user.id,
      type: 'withdrawal_refund',
      amount: request.amount,
      balanceBefore: oldBalance,
      balanceAfter: user.balance,
      referenceId: request.id,
      description: `Cancelled withdrawal of ৳ ${request.amount} to ${request.method.toUpperCase()} - Refunded`,
      descriptionBn: `বাতিলকৃত উইথড্রয়াল ৳ ${request.amount} - রিফান্ড প্রদান`,
      createdAt: new Date().toISOString(),
    };

    db.transactions.unshift(ledgerEntry);
    await saveDatabase();

    res.json({
      success: true,
      message: `Withdrawal request cancelled. ৳ ${request.amount} has been restored to your available balance.`,
      newBalance: user.balance,
      pendingBalance: user.pendingWithdrawal,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to cancel withdrawal' });
  }
});

export default router;
