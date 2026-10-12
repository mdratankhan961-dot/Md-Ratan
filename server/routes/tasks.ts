import { Router, Response } from 'express';
import { getDb, saveDatabase, adjustUserBalance } from '../db.js';
import { requireUserAuth, AuthenticatedRequest } from '../auth.js';
import { TaskSession, TaskCompletion } from '../../src/types/index.js';

const router = Router();

// Get all active tasks for user
router.get('/', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const db = getDb();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Calculate user's completions today for each task
  const userCompletionsToday = db.taskCompletions.filter(
    (tc) => tc.userId === user.id && new Date(tc.completedAt).getTime() >= todayStart.getTime()
  );

  const completionCountMap = new Map<string, number>();
  for (const c of userCompletionsToday) {
    completionCountMap.set(c.taskId, (completionCountMap.get(c.taskId) || 0) + 1);
  }

  const tasksWithStatus = db.tasks.map((task) => {
    const todayCount = completionCountMap.get(task.id) || 0;
    const isCompletedToday = todayCount >= task.dailyLimit;
    const isTotalLimitReached = task.completedCount >= task.totalLimit;

    return {
      ...task,
      todayCompletions: todayCount,
      isAvailable: task.status === 'active' && !isCompletedToday && !isTotalLimitReached,
      isCompletedToday,
    };
  });

  res.json({ tasks: tasksWithStatus });
});

// Get single task details
router.get('/:id', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;
  const db = getDb();

  const task = db.tasks.find((t) => t.id === id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const completionsToday = db.taskCompletions.filter(
    (tc) => tc.userId === user.id && tc.taskId === id && new Date(tc.completedAt).getTime() >= todayStart.getTime()
  ).length;

  res.json({
    task,
    adConfig: {
      adsterra: db.adConfig.adsterra,
      monetag: db.adConfig.monetag,
    },
    completionsToday,
    isAvailable: task.status === 'active' && completionsToday < task.dailyLimit && task.completedCount < task.totalLimit,
  });
});

// Step 1: Start 10-Second Ad Gate
router.post('/:id/start-gate', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;
  const db = getDb();

  const task = db.tasks.find((t) => t.id === id);
  if (!task || task.status !== 'active') {
    res.status(400).json({ error: 'Task is currently unavailable or inactive.' });
    return;
  }

  // Check daily limit
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = db.taskCompletions.filter(
    (tc) => tc.userId === user.id && tc.taskId === id && new Date(tc.completedAt).getTime() >= todayStart.getTime()
  ).length;

  if (todayCount >= task.dailyLimit) {
    res.status(400).json({ error: 'You have already completed the daily limit for this task. Come back tomorrow!' });
    return;
  }

  const token = 'tsess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  const session: TaskSession = {
    id: 'sess_' + Date.now(),
    taskId: task.id,
    userId: user.id,
    token,
    startedAt: Date.now(),
    status: 'started',
  };

  db.taskSessions.push(session);
  await saveDatabase();

  res.json({
    success: true,
    sessionToken: token,
    gateSeconds: task.gateSeconds || 10,
    taskTitle: task.title,
    reward: task.reward,
  });
});

// Step 2: Pass 10-Second Ad Gate
router.post('/:id/pass-gate', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { sessionToken } = req.body;
  const user = req.user!;
  const db = getDb();

  if (!sessionToken) {
    res.status(400).json({ error: 'Invalid or missing session token.' });
    return;
  }

  const session = db.taskSessions.find((s) => s.token === sessionToken && s.userId === user.id && s.taskId === id);
  if (!session) {
    res.status(400).json({ error: 'Session not found or expired. Please restart the task.' });
    return;
  }

  if (session.status !== 'started') {
    res.status(400).json({ error: 'Invalid session state.' });
    return;
  }

  const task = db.tasks.find((t) => t.id === id);
  const gateDurationMs = ((task?.gateSeconds || 10) * 1000) - 600; // 600ms network jitter grace
  const elapsed = Date.now() - session.startedAt;

  if (elapsed < gateDurationMs) {
    session.status = 'abandoned';
    await saveDatabase();
    res.status(400).json({
      error: `Ad gate incomplete. You must view the sponsor screen for the full ${task?.gateSeconds || 10} seconds! Countdown cancelled.`,
    });
    return;
  }

  session.status = 'gate_passed';
  session.gatePassedAt = Date.now();
  await saveDatabase();

  res.json({
    success: true,
    message: 'Ad verification passed! Task countdown is now running.',
    durationSeconds: task?.durationSeconds || 30,
    externalUrl: task?.externalUrl,
  });
});

// Abandon Gate (e.g. user closed modal or skipped ad)
router.post('/:id/abandon-gate', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { sessionToken } = req.body;
  const user = req.user!;
  const db = getDb();

  const session = db.taskSessions.find((s) => s.token === sessionToken && s.userId === user.id && s.taskId === id);
  if (session && session.status === 'started') {
    session.status = 'abandoned';
    await saveDatabase();
  }

  res.json({ success: true, message: 'Session cancelled.' });
});

// Step 3: Complete Task and Claim Reward
router.post('/:id/complete', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { sessionToken, proofText } = req.body;
  const user = req.user!;
  const db = getDb();

  if (!sessionToken) {
    res.status(400).json({ error: 'Missing session token.' });
    return;
  }

  const session = db.taskSessions.find((s) => s.token === sessionToken && s.userId === user.id && s.taskId === id);
  if (!session) {
    res.status(400).json({ error: 'Task session not found. Please start from the beginning.' });
    return;
  }

  if (session.status !== 'gate_passed' || !session.gatePassedAt) {
    res.status(400).json({ error: 'You must first pass the mandatory ad gate before completing the task!' });
    return;
  }

  const task = db.tasks.find((t) => t.id === id);
  if (!task || task.status !== 'active') {
    res.status(400).json({ error: 'Task is inactive or no longer available.' });
    return;
  }

  // Verify server-side duration requirement
  const requiredMs = (task.durationSeconds * 1000) - 1000; // 1s tolerance for network latency
  const elapsedSinceGate = Date.now() - session.gatePassedAt;

  if (elapsedSinceGate < requiredMs) {
    res.status(400).json({
      error: `Server timer verification failed. You only completed ${Math.floor(elapsedSinceGate / 1000)}s of required ${task.durationSeconds}s.`,
    });
    return;
  }

  // Daily limit check
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const userCompletionsToday = db.taskCompletions.filter(
    (tc) => tc.userId === user.id && tc.taskId === id && new Date(tc.completedAt).getTime() >= todayStart.getTime()
  ).length;

  if (userCompletionsToday >= task.dailyLimit) {
    res.status(400).json({ error: 'Daily completion limit reached for this task.' });
    return;
  }

  // Mark session completed
  session.status = 'completed';
  session.completedAt = Date.now();

  // Record completion
  const completion: TaskCompletion = {
    id: 'tc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    taskId: task.id,
    userId: user.id,
    reward: task.reward,
    completedAt: new Date().toISOString(),
    proofText: proofText ? String(proofText).trim() : undefined,
  };
  db.taskCompletions.push(completion);
  task.completedCount += 1;

  // Atomically credit user reward
  const { user: updatedUser } = await adjustUserBalance({
    userId: user.id,
    amount: task.reward,
    type: 'task_reward',
    description: `Reward for task: "${task.title}"`,
    descriptionBn: `টাস্ক সম্পন্ন করার রিওয়ার্ড: "${task.titleBn || task.title}"`,
    referenceId: task.id,
  });

  // Credit referral commission if user was referred
  if (user.referredBy && db.rewardSettings.referralCommissionPercent > 0) {
    const referrer = db.users.find((u) => u.id === user.referredBy);
    if (referrer && referrer.status === 'active') {
      const commission = Math.round((task.reward * (db.rewardSettings.referralCommissionPercent / 100)) * 100) / 100;
      if (commission > 0) {
        try {
          await adjustUserBalance({
            userId: referrer.id,
            amount: commission,
            type: 'referral_bonus',
            description: `${db.rewardSettings.referralCommissionPercent}% task commission from referral (${user.name})`,
            descriptionBn: `রেফারেল মেম্বার (${user.name}) এর টাস্ক থেকে কমিশন`,
            referenceId: task.id,
          });
        } catch (e) {
          console.error('Error awarding task referral commission:', e);
        }
      }
    }
  }

  res.json({
    success: true,
    message: `Congratulations! ৳ ${task.reward} added to your wallet.`,
    reward: task.reward,
    newBalance: updatedUser.balance,
  });
});

export default router;
