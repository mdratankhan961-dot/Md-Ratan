import { Router, Response } from 'express';
import { getDb, saveDatabase, adjustUserBalance } from '../db.js';
import { requireUserAuth, AuthenticatedRequest } from '../auth.js';

const router = Router();

interface AdWatchRecord {
  id: string;
  userId: string;
  provider: string;
  reward: number;
  timestamp: string;
}

const adWatchRecords: AdWatchRecord[] = [];
const adActiveSessions = new Map<string, { userId: string; startedAt: number; provider: string }>();

// Get user's video ad status & limits
router.get('/status', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const db = getDb();
  const settings = db.rewardSettings;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayWatches = adWatchRecords.filter(
    (w) => w.userId === user.id && new Date(w.timestamp).getTime() >= todayStart.getTime()
  );

  const watchesCount = todayWatches.length;
  const remainingToday = Math.max(0, settings.dailyVideoAdLimit - watchesCount);

  let cooldownRemaining = 0;
  const lastWatch = todayWatches[todayWatches.length - 1];
  if (lastWatch) {
    const elapsedSec = (Date.now() - new Date(lastWatch.timestamp).getTime()) / 1000;
    if (elapsedSec < settings.videoAdCooldownSeconds) {
      cooldownRemaining = Math.ceil(settings.videoAdCooldownSeconds - elapsedSec);
    }
  }

  res.json({
    reward: settings.videoAdReward,
    dailyLimit: settings.dailyVideoAdLimit,
    watchedToday: watchesCount,
    remainingToday,
    cooldownSeconds: settings.videoAdCooldownSeconds,
    cooldownRemaining,
    adConfig: {
      adsterra: db.adConfig.adsterra,
      monetag: db.adConfig.monetag,
      customPlacements: db.adConfig.customPlacements.filter((p) => p.enabled),
    },
    recentHistory: todayWatches.slice(-5).reverse(),
  });
});

// Start video ad session
router.post('/start-session', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { provider = 'monetag' } = req.body;
  const db = getDb();
  const settings = db.rewardSettings;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayWatches = adWatchRecords.filter(
    (w) => w.userId === user.id && new Date(w.timestamp).getTime() >= todayStart.getTime()
  );

  if (todayWatches.length >= settings.dailyVideoAdLimit) {
    res.status(400).json({ error: 'Daily video ad watch limit reached.' });
    return;
  }

  const lastWatch = todayWatches[todayWatches.length - 1];
  if (lastWatch) {
    const elapsedSec = (Date.now() - new Date(lastWatch.timestamp).getTime()) / 1000;
    if (elapsedSec < settings.videoAdCooldownSeconds) {
      const waitTime = Math.ceil(settings.videoAdCooldownSeconds - elapsedSec);
      res.status(400).json({ error: `Please wait ${waitTime} seconds before viewing another sponsored ad.` });
      return;
    }
  }

  const sessionToken = 'ad_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  adActiveSessions.set(sessionToken, {
    userId: user.id,
    startedAt: Date.now(),
    provider,
  });

  res.json({
    success: true,
    sessionToken,
    requiredWatchSeconds: 15,
    reward: settings.videoAdReward,
  });
});

// Complete video ad and verify completion event
router.post('/complete', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { sessionToken } = req.body;
  const db = getDb();
  const settings = db.rewardSettings;

  if (!sessionToken || !adActiveSessions.has(sessionToken)) {
    res.status(400).json({ error: 'Invalid or expired ad session. Please restart the video.' });
    return;
  }

  const session = adActiveSessions.get(sessionToken)!;
  if (session.userId !== user.id) {
    res.status(403).json({ error: 'Invalid session owner.' });
    return;
  }

  // Verify server-side minimum watch elapsed time (15s minimum with 1s grace)
  const elapsedSec = (Date.now() - session.startedAt) / 1000;
  if (elapsedSec < 14) {
    res.status(400).json({
      error: `Ad was skipped or closed too early. You only watched ${Math.floor(elapsedSec)}s. Reward denied.`,
    });
    return;
  }

  // Daily limit check
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayWatches = adWatchRecords.filter(
    (w) => w.userId === user.id && new Date(w.timestamp).getTime() >= todayStart.getTime()
  );

  if (todayWatches.length >= settings.dailyVideoAdLimit) {
    res.status(400).json({ error: 'Daily limit reached.' });
    return;
  }

  adActiveSessions.delete(sessionToken);

  const reward = settings.videoAdReward;
  const { user: updatedUser } = await adjustUserBalance({
    userId: user.id,
    amount: reward,
    type: 'video_ad_reward',
    description: `Reward for viewing partner ad (${session.provider})`,
    descriptionBn: `বিজ্ঞাপন দেখার জন্য রিওয়ার্ড (${session.provider})`,
  });

  const record: AdWatchRecord = {
    id: 'adw_' + Date.now(),
    userId: user.id,
    provider: session.provider,
    reward,
    timestamp: new Date().toISOString(),
  };
  adWatchRecords.push(record);
  await saveDatabase();

  res.json({
    success: true,
    message: `Watched successfully! ৳ ${reward} credited to your wallet.`,
    reward,
    newBalance: updatedUser.balance,
  });
});

export default router;
