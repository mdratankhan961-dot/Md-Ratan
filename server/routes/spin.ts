import { Router, Response } from 'express';
import { getDb, saveDatabase, adjustUserBalance } from '../db.js';
import { requireUserAuth, AuthenticatedRequest } from '../auth.js';
import { SpinSegment } from '../../src/types/index.js';

const router = Router();

interface UserSpinRecord {
  id: string;
  userId: string;
  segmentId: string;
  segmentLabel: string;
  reward: number;
  cost: number;
  timestamp: string;
}

// In-memory or persisted spin records
const spinRecords: UserSpinRecord[] = [];

// Helper to calculate weighted random winner
function pickWinningSegment(segments: SpinSegment[]): { segment: SpinSegment; index: number } {
  const totalWeight = segments.reduce((acc, s) => acc + (s.probability > 0 ? s.probability : 1), 0);
  let randomVal = Math.random() * totalWeight;

  for (let i = 0; i < segments.length; i++) {
    const weight = segments[i].probability > 0 ? segments[i].probability : 1;
    if (randomVal <= weight) {
      return { segment: segments[i], index: i };
    }
    randomVal -= weight;
  }
  return { segment: segments[0], index: 0 };
}

// Get Spin Status
router.get('/status', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const db = getDb();
  const config = db.spinConfig;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySpins = spinRecords.filter(
    (s) => s.userId === user.id && new Date(s.timestamp).getTime() >= todayStart.getTime()
  );

  const totalSpinsToday = todaySpins.length;
  const freeSpinsLeft = Math.max(0, config.freeSpinsDaily - totalSpinsToday);
  const spinsRemainingToday = Math.max(0, config.dailySpinLimit - totalSpinsToday);

  // Check cooldown
  const lastSpin = todaySpins[todaySpins.length - 1];
  let cooldownRemaining = 0;
  if (lastSpin) {
    const elapsedSec = (Date.now() - new Date(lastSpin.timestamp).getTime()) / 1000;
    if (elapsedSec < config.cooldownSeconds) {
      cooldownRemaining = Math.ceil(config.cooldownSeconds - elapsedSec);
    }
  }

  const userRecentHistory = spinRecords
    .filter((s) => s.userId === user.id)
    .slice(-10)
    .reverse();

  res.json({
    config: {
      isEnabled: config.isEnabled,
      dailySpinLimit: config.dailySpinLimit,
      freeSpinsDaily: config.freeSpinsDaily,
      spinCost: config.spinCost,
      cooldownSeconds: config.cooldownSeconds,
      segments: config.segments,
    },
    userStatus: {
      totalSpinsToday,
      freeSpinsLeft,
      spinsRemainingToday,
      cooldownRemaining,
      userBalance: user.balance,
    },
    recentHistory: userRecentHistory,
  });
});

// Play Spin (Server-Determined Result)
router.post('/play', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const db = getDb();
  const config = db.spinConfig;

  if (!config.isEnabled) {
    res.status(400).json({ error: 'The Lucky Spin feature is temporarily disabled by admin.' });
    return;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySpins = spinRecords.filter(
    (s) => s.userId === user.id && new Date(s.timestamp).getTime() >= todayStart.getTime()
  );

  if (todaySpins.length >= config.dailySpinLimit) {
    res.status(400).json({ error: `Daily limit reached (${config.dailySpinLimit} spins). Come back tomorrow!` });
    return;
  }

  // Cooldown check
  const lastSpin = todaySpins[todaySpins.length - 1];
  if (lastSpin) {
    const elapsedSec = (Date.now() - new Date(lastSpin.timestamp).getTime()) / 1000;
    if (elapsedSec < config.cooldownSeconds) {
      const remaining = Math.ceil(config.cooldownSeconds - elapsedSec);
      res.status(400).json({ error: `Please wait ${remaining} seconds before spinning again.` });
      return;
    }
  }

  const isFree = todaySpins.length < config.freeSpinsDaily;
  const cost = isFree ? 0 : config.spinCost;

  if (cost > 0 && user.balance < cost) {
    res.status(400).json({
      error: `Insufficient balance for paid spin. Cost: ৳ ${cost}, Your balance: ৳ ${user.balance}`,
    });
    return;
  }

  // Deduct cost if not free
  if (cost > 0) {
    await adjustUserBalance({
      userId: user.id,
      amount: -cost,
      type: 'admin_adjustment', // or spin entry fee
      description: `Lucky Wheel spin fee (৳ ${cost})`,
      descriptionBn: `লাকি স্পিন ফি (৳ ${cost})`,
    });
  }

  // Pick winner on server
  const { segment, index } = pickWinningSegment(config.segments);

  // Credit winning reward if > 0
  let updatedUser = user;
  if (segment.reward > 0) {
    const resReward = await adjustUserBalance({
      userId: user.id,
      amount: segment.reward,
      type: 'spin_reward',
      description: `Won from Lucky Wheel (${segment.label})`,
      descriptionBn: `লাকি স্পিন থেকে বিজয়ী (${segment.label})`,
    });
    updatedUser = resReward.user;
  }

  // Record spin
  const record: UserSpinRecord = {
    id: 'spin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    userId: user.id,
    segmentId: segment.id,
    segmentLabel: segment.label,
    reward: segment.reward,
    cost,
    timestamp: new Date().toISOString(),
  };
  spinRecords.push(record);
  await saveDatabase();

  const freeSpinsLeft = Math.max(0, config.freeSpinsDaily - (todaySpins.length + 1));
  const spinsRemainingToday = Math.max(0, config.dailySpinLimit - (todaySpins.length + 1));

  res.json({
    success: true,
    winningIndex: index,
    segment,
    reward: segment.reward,
    isFree,
    cost,
    newBalance: updatedUser.balance,
    freeSpinsLeft,
    spinsRemainingToday,
    cooldownSeconds: config.cooldownSeconds,
  });
});

export default router;
