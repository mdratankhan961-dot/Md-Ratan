import { Router, Response } from 'express';
import { getDb, saveDatabase, adjustUserBalance, recordAuditLog } from '../db.js';
import {
  hashPassword,
  comparePassword,
  generateAdminToken,
  requireAdminAuth,
  AuthenticatedRequest,
  rateLimiter,
} from '../auth.js';
import { Task, WalletTransaction } from '../../src/types/index.js';

const router = Router();

// Check if administrator has been initialized
router.get('/status', async (req, res): Promise<void> => {
  const db = getDb();
  const hasAdmin = db.adminUsers.length > 0;
  res.json({
    initialized: hasAdmin,
    targetUsername: 'mdratan',
    requiresSetup: !hasAdmin,
  });
});

// One-time Initial Setup if environment secret wasn't supplied and database has no admin
router.post('/setup-initial', rateLimiter(5, 60000), async (req, res): Promise<void> => {
  const db = getDb();
  if (db.adminUsers.length > 0) {
    res.status(403).json({
      error: 'Administrator account is already initialized. First-time setup is permanently closed.',
    });
    return;
  }

  const { password, confirmPassword } = req.body;
  if (!password || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  if (password !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }

  const passwordHash = await hashPassword(password);
  const newAdmin = {
    id: 'admin_initial_' + Date.now(),
    username: 'mdratan',
    passwordHash,
    role: 'superadmin' as const,
    createdAt: new Date().toISOString(),
  };

  db.adminUsers.push(newAdmin);
  await saveDatabase();

  await recordAuditLog(
    'mdratan',
    'INITIAL_ADMIN_SETUP',
    'SYSTEM',
    'First-time administrator credentials successfully secured.'
  );

  const token = generateAdminToken(newAdmin);
  res.json({
    success: true,
    message: 'Admin account "mdratan" created securely.',
    token,
    admin: { id: newAdmin.id, username: newAdmin.username, role: newAdmin.role },
  });
});

// Admin Login
router.post('/login', rateLimiter(10, 60000), async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const db = getDb();
    if (db.adminUsers.length === 0) {
      res.status(400).json({
        error: 'Administrator credentials have not yet been configured. Complete setup first.',
        requiresSetup: true,
      });
      return;
    }

    const admin = db.adminUsers.find(
      (a) => a.username.toLowerCase() === String(username).trim().toLowerCase()
    );

    if (!admin) {
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    const isMatch = await comparePassword(password, admin.passwordHash);
    if (!isMatch) {
      await recordAuditLog(
        admin.username,
        'FAILED_LOGIN_ATTEMPT',
        'ADMIN_AUTH',
        'Failed password entry attempt.'
      );
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    admin.lastLoginAt = new Date().toISOString();
    await saveDatabase();

    await recordAuditLog(
      admin.username,
      'ADMIN_LOGIN_SUCCESS',
      'ADMIN_AUTH',
      'Successful administrator login.'
    );

    const token = generateAdminToken(admin);
    res.json({
      success: true,
      token,
      admin: { id: admin.id, username: admin.username, role: admin.role },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Admin Profile
router.get('/me', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const admin = req.admin!;
  res.json({ admin: { id: admin.id, username: admin.username, role: admin.role } });
});

// Admin Dashboard Metrics
router.get('/dashboard', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = getDb();

  const totalUsers = db.users.length;
  const activeUsers = db.users.filter((u) => u.status === 'active').length;
  const suspendedUsers = db.users.filter((u) => u.status === 'suspended').length;

  const totalUserBalances = Math.round(db.users.reduce((acc, u) => acc + (u.balance || 0), 0) * 100) / 100;
  const totalPendingLiabilities = Math.round(db.users.reduce((acc, u) => acc + (u.pendingWithdrawal || 0), 0) * 100) / 100;
  const totalEarnedOverall = Math.round(db.users.reduce((acc, u) => acc + (u.totalEarned || 0), 0) * 100) / 100;

  const totalTasks = db.tasks.length;
  const totalTaskCompletions = db.taskCompletions.length;

  const totalReferralRewards = Math.round(
    db.transactions.filter((tx) => tx.type === 'referral_bonus').reduce((acc, tx) => acc + tx.amount, 0) * 100
  ) / 100;

  const totalVideoRewards = Math.round(
    db.transactions.filter((tx) => tx.type === 'video_ad_reward').reduce((acc, tx) => acc + tx.amount, 0) * 100
  ) / 100;

  const totalSpinRewards = Math.round(
    db.transactions.filter((tx) => tx.type === 'spin_reward').reduce((acc, tx) => acc + tx.amount, 0) * 100
  ) / 100;

  const pendingWithdrawals = db.withdrawals.filter((w) => w.status === 'pending');
  const pendingWithdrawalCount = pendingWithdrawals.length;
  const pendingWithdrawalAmount = Math.round(pendingWithdrawals.reduce((acc, w) => acc + w.amount, 0) * 100) / 100;

  const paidWithdrawals = db.withdrawals.filter((w) => w.status === 'paid' || w.status === 'approved');
  const paidWithdrawalAmount = Math.round(paidWithdrawals.reduce((acc, w) => acc + w.amount, 0) * 100) / 100;

  const rejectedWithdrawalCount = db.withdrawals.filter((w) => w.status === 'rejected').length;

  const recentTransactions = db.transactions.slice(0, 8);
  const recentWithdrawals = db.withdrawals.slice(0, 6);
  const recentAudit = db.auditLogs.slice(0, 6);

  res.json({
    metrics: {
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalUserBalances,
      totalPendingLiabilities,
      totalEarnedOverall,
      totalTasks,
      totalTaskCompletions,
      totalReferralRewards,
      totalVideoRewards,
      totalSpinRewards,
      pendingWithdrawalCount,
      pendingWithdrawalAmount,
      paidWithdrawalAmount,
      rejectedWithdrawalCount,
    },
    recentTransactions,
    recentWithdrawals,
    recentAudit,
  });
});

// User Management: List & Search
router.get('/users', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = getDb();
  const search = String(req.query.search || '').trim().toLowerCase();
  const statusFilter = req.query.status as string;

  let filtered = db.users.map((u) => {
    const { passwordHash: _, ...safe } = u;
    return safe;
  });

  if (search) {
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.phone.includes(search) ||
        u.referralCode.toLowerCase().includes(search) ||
        u.id.toLowerCase().includes(search)
    );
  }

  if (statusFilter && (statusFilter === 'active' || statusFilter === 'suspended')) {
    filtered = filtered.filter((u) => u.status === statusFilter);
  }

  res.json({ users: filtered });
});

// User Details with complete audit trail
router.get('/users/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const db = getDb();
  const user = db.users.find((u) => u.id === id);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const { passwordHash: _, ...safeUser } = user;
  const userTransactions = db.transactions.filter((tx) => tx.userId === id).slice(0, 50);
  const userWithdrawals = db.withdrawals.filter((w) => w.userId === id);
  const userCompletions = db.taskCompletions.filter((c) => c.userId === id);
  const referredUsers = db.users.filter((u) => u.referredBy === id);

  res.json({
    user: safeUser,
    transactions: userTransactions,
    withdrawals: userWithdrawals,
    taskCompletions: userCompletions,
    referredUsersCount: referredUsers.length,
  });
});

// Suspend / Reactivate User
router.post('/users/:id/status', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const admin = req.admin!;
  const db = getDb();

  const user = db.users.find((u) => u.id === id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (status !== 'active' && status !== 'suspended') {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const oldStatus = user.status;
  user.status = status;
  await saveDatabase();

  await recordAuditLog(
    admin.username,
    status === 'suspended' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
    'USER',
    `User ${user.name} (${user.id}) status changed from ${oldStatus} to ${status}. Reason: ${reason || 'N/A'}`
  );

  res.json({ success: true, user });
});

// Administrative Balance Adjustment (Section 11)
router.post('/users/:id/adjust-balance', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const admin = req.admin!;

    const parsedAmount = Math.round(Number(amount) * 100) / 100;
    if (isNaN(parsedAmount) || parsedAmount === 0) {
      res.status(400).json({ error: 'Please enter a non-zero adjustment amount.' });
      return;
    }

    if (!reason || reason.trim().length < 4) {
      res.status(400).json({ error: 'A mandatory administrative reason must be provided (min 4 characters).' });
      return;
    }

    const { user, transaction } = await adjustUserBalance({
      userId: id,
      amount: parsedAmount,
      type: 'admin_adjustment',
      description: `Admin manual adjustment by @${admin.username}: ${reason.trim()}`,
      descriptionBn: `প্রশাসনিক সমন্বয় (@${admin.username}): ${reason.trim()}`,
      adminUsername: admin.username,
    });

    res.json({
      success: true,
      message: `User balance adjusted by ${parsedAmount >= 0 ? '+' : ''}${parsedAmount} ৳ successfully.`,
      userBalance: user.balance,
      transaction,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Balance adjustment failed' });
  }
});

// Task Management: List
router.get('/tasks', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = getDb();
  res.json({ tasks: db.tasks });
});

// Task Management: Create
router.post('/tasks', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const admin = req.admin!;
    const db = getDb();
    const {
      title,
      titleBn,
      description,
      descriptionBn,
      instructions,
      instructionsBn,
      category,
      reward,
      durationSeconds,
      gateSeconds = 10,
      dailyLimit = 1,
      totalLimit = 1000,
      status = 'active',
      externalUrl,
      requiresProof = false,
      proofPlaceholder,
    } = req.body;

    if (!title || !description || !reward) {
      res.status(400).json({ error: 'Title, description and reward are required.' });
      return;
    }

    const newTask: Task = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      titleBn: titleBn ? titleBn.trim() : title.trim(),
      description: description.trim(),
      descriptionBn: descriptionBn ? descriptionBn.trim() : description.trim(),
      instructions: Array.isArray(instructions) ? instructions : [instructions || 'Follow instructions'],
      instructionsBn: Array.isArray(instructionsBn) ? instructionsBn : undefined,
      category: category || 'website_visit',
      reward: Number(reward),
      durationSeconds: Number(durationSeconds) || 30,
      gateSeconds: Number(gateSeconds) || 10,
      dailyLimit: Number(dailyLimit) || 1,
      totalLimit: Number(totalLimit) || 1000,
      completedCount: 0,
      status: status || 'active',
      externalUrl,
      requiresProof: Boolean(requiresProof),
      proofPlaceholder,
      createdAt: new Date().toISOString(),
    };

    db.tasks.unshift(newTask);
    await saveDatabase();

    await recordAuditLog(
      admin.username,
      'TASK_CREATED',
      'TASK',
      `Created task: "${newTask.title}" with reward ৳ ${newTask.reward}`
    );

    res.status(201).json({ success: true, task: newTask });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create task' });
  }
});

// Task Management: Update
router.put('/tasks/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const admin = req.admin!;
  const db = getDb();

  const taskIndex = db.tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const updatedTask = { ...db.tasks[taskIndex], ...req.body, id };
  db.tasks[taskIndex] = updatedTask;
  await saveDatabase();

  await recordAuditLog(admin.username, 'TASK_UPDATED', 'TASK', `Updated task: ${updatedTask.title}`);
  res.json({ success: true, task: updatedTask });
});

// Task Management: Delete
router.delete('/tasks/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const admin = req.admin!;
  const db = getDb();

  const task = db.tasks.find((t) => t.id === id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  db.tasks = db.tasks.filter((t) => t.id !== id);
  await saveDatabase();

  await recordAuditLog(admin.username, 'TASK_DELETED', 'TASK', `Deleted task: ${task.title}`);
  res.json({ success: true, message: 'Task deleted' });
});

// Withdrawal Management: List with filters
router.get('/withdrawals', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = getDb();
  const status = req.query.status as string;
  const method = req.query.method as string;

  let withdrawals = [...db.withdrawals];
  if (status) {
    withdrawals = withdrawals.filter((w) => w.status === status);
  }
  if (method) {
    withdrawals = withdrawals.filter((w) => w.method === method);
  }

  res.json({ withdrawals });
});

// Approve Withdrawal
router.post('/withdrawals/:id/approve', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { transactionRef, adminNote } = req.body;
    const admin = req.admin!;
    const db = getDb();

    const request = db.withdrawals.find((w) => w.id === id);
    if (!request) {
      res.status(404).json({ error: 'Withdrawal not found' });
      return;
    }

    if (request.status !== 'pending' && request.status !== 'processing') {
      res.status(400).json({ error: `Withdrawal is already in ${request.status} status.` });
      return;
    }

    const user = db.users.find((u) => u.id === request.userId);
    if (user) {
      // Deduct from pending liability now that it is finalized
      user.pendingWithdrawal = Math.max(0, Math.round((user.pendingWithdrawal - request.amount) * 100) / 100);
    }

    request.status = 'paid';
    request.transactionRef = transactionRef || 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
    request.adminNote = adminNote;
    request.processedAt = new Date().toISOString();
    request.processedBy = admin.username;

    await saveDatabase();

    await recordAuditLog(
      admin.username,
      'WITHDRAWAL_APPROVED_PAID',
      'WITHDRAWAL',
      `Approved & Paid ৳ ${request.amount} to ${request.userName} via ${request.method.toUpperCase()} (${request.accountNumber}). Ref: ${request.transactionRef}`
    );

    res.json({ success: true, message: 'Withdrawal approved and marked as paid.', withdrawal: request });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Approval failed' });
  }
});

// Reject Withdrawal (Automated Balance Refund)
router.post('/withdrawals/:id/reject', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason = 'Account details verification failed' } = req.body;
    const admin = req.admin!;
    const db = getDb();

    const request = db.withdrawals.find((w) => w.id === id);
    if (!request) {
      res.status(404).json({ error: 'Withdrawal not found' });
      return;
    }

    if (request.status !== 'pending' && request.status !== 'processing') {
      res.status(400).json({ error: `Withdrawal cannot be rejected from ${request.status} status.` });
      return;
    }

    const user = db.users.find((u) => u.id === request.userId);
    if (user) {
      const oldBalance = user.balance;
      user.balance = Math.round((user.balance + request.amount) * 100) / 100;
      user.pendingWithdrawal = Math.max(0, Math.round((user.pendingWithdrawal - request.amount) * 100) / 100);

      const refundEntry: WalletTransaction = {
        id: 'tx_rej_' + Date.now(),
        userId: user.id,
        type: 'withdrawal_refund',
        amount: request.amount,
        balanceBefore: oldBalance,
        balanceAfter: user.balance,
        referenceId: request.id,
        description: `Rejected withdrawal of ৳ ${request.amount} (${request.method.toUpperCase()}) - Refunded: ${reason}`,
        descriptionBn: `প্রত্যাখ্যাত উইথড্রয়াল ৳ ${request.amount} - ফেরত প্রদান: ${reason}`,
        createdAt: new Date().toISOString(),
      };
      db.transactions.unshift(refundEntry);
    }

    request.status = 'rejected';
    request.adminNote = reason;
    request.processedAt = new Date().toISOString();
    request.processedBy = admin.username;

    await saveDatabase();

    await recordAuditLog(
      admin.username,
      'WITHDRAWAL_REJECTED_REFUNDED',
      'WITHDRAWAL',
      `Rejected withdrawal of ৳ ${request.amount} for user ${request.userName}. Reserved amount restored to user balance. Reason: ${reason}`
    );

    res.json({
      success: true,
      message: `Withdrawal rejected and ৳ ${request.amount} has been securely restored to user balance.`,
      withdrawal: request,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Rejection failed' });
  }
});

// Ad Network Settings: Get & Update
router.get('/ads', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = getDb();
  res.json({ adConfig: db.adConfig });
});

router.put('/ads', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const admin = req.admin!;
  const db = getDb();
  const { adsterra, monetag, customPlacements } = req.body;

  if (adsterra) db.adConfig.adsterra = { ...db.adConfig.adsterra, ...adsterra };
  if (monetag) db.adConfig.monetag = { ...db.adConfig.monetag, ...monetag };
  if (Array.isArray(customPlacements)) db.adConfig.customPlacements = customPlacements;

  await saveDatabase();
  await recordAuditLog(admin.username, 'AD_CONFIG_UPDATED', 'SETTINGS', 'Updated Adsterra and Monetag settings');
  res.json({ success: true, adConfig: db.adConfig });
});

// Spin Wheel Configuration: Get & Update
router.get('/spin', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = getDb();
  res.json({ spinConfig: db.spinConfig });
});

router.put('/spin', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const admin = req.admin!;
  const db = getDb();
  db.spinConfig = { ...db.spinConfig, ...req.body };

  await saveDatabase();
  await recordAuditLog(admin.username, 'SPIN_CONFIG_UPDATED', 'SETTINGS', 'Updated Lucky Wheel prize segments & rules');
  res.json({ success: true, spinConfig: db.spinConfig });
});

// Reward Settings: Get & Update
router.get('/settings', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = getDb();
  res.json({ rewardSettings: db.rewardSettings });
});

router.put('/settings', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const admin = req.admin!;
  const db = getDb();
  db.rewardSettings = { ...db.rewardSettings, ...req.body };

  await saveDatabase();
  await recordAuditLog(admin.username, 'REWARD_SETTINGS_UPDATED', 'SETTINGS', 'Updated central reward & withdrawal parameters');
  res.json({ success: true, rewardSettings: db.rewardSettings });
});

// Audit Logs
router.get('/audit-logs', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = getDb();
  res.json({ auditLogs: db.auditLogs.slice(0, 200) });
});

// Full Transactions Ledger
router.get('/transactions', requireAdminAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = getDb();
  res.json({ transactions: db.transactions.slice(0, 300) });
});

export default router;
