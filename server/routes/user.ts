import { Router, Response } from 'express';
import { getDb } from '../db.js';
import { requireUserAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

// Dashboard summary data
router.get('/dashboard', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const db = getDb();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const completedToday = db.taskCompletions.filter(
    (tc) => tc.userId === user.id && new Date(tc.completedAt).getTime() >= todayStart.getTime()
  ).length;

  const recentTransactions = db.transactions
    .filter((tx) => tx.userId === user.id)
    .slice(0, 5);

  const availableTasksCount = db.tasks.filter((t) => t.status === 'active').length;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      referralCode: user.referralCode,
      balance: user.balance,
      pendingWithdrawal: user.pendingWithdrawal,
      totalEarned: user.totalEarned,
      tasksCompleted: user.tasksCompleted,
      referralEarnings: user.referralEarnings,
      adEarnings: user.adEarnings,
      spinEarnings: user.spinEarnings,
      createdAt: user.createdAt,
    },
    stats: {
      completedToday,
      availableTasksCount,
      activeReferralsCount: db.users.filter((u) => u.referredBy === user.id).length,
    },
    recentTransactions,
    noticeBanner: db.rewardSettings.noticeBanner,
    noticeBannerBn: db.rewardSettings.noticeBannerBn,
  });
});

// Full transactions ledger for user
router.get('/transactions', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const db = getDb();

  const transactions = db.transactions
    .filter((tx) => tx.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ transactions });
});

// Referral stats and list
router.get('/referrals', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const db = getDb();
  const settings = db.rewardSettings;

  const referredUsers = db.users
    .filter((u) => u.referredBy === user.id)
    .map((u) => ({
      id: u.id,
      name: u.name,
      createdAt: u.createdAt,
      tasksCompleted: u.tasksCompleted,
      status: u.status,
    }))
    .reverse();

  res.json({
    referralCode: user.referralCode,
    referralBonus: settings.referralBonus,
    commissionPercent: settings.referralCommissionPercent,
    totalReferrals: referredUsers.length,
    activeReferrals: referredUsers.filter((u) => u.status === 'active' && u.tasksCompleted > 0).length,
    totalEarnedCommission: user.referralEarnings,
    referralsList: referredUsers,
  });
});

export default router;
