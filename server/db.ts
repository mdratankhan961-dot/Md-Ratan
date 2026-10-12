import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  AdminUser,
  Task,
  TaskSession,
  TaskCompletion,
  WalletTransaction,
  WithdrawalRequest,
  SpinConfig,
  AdNetworksConfig,
  RewardSettings,
  AdminAuditLog,
  TransactionType,
} from '../src/types/index.js';

interface DatabaseSchema {
  users: User[];
  adminUsers: AdminUser[];
  tasks: Task[];
  taskSessions: TaskSession[];
  taskCompletions: TaskCompletion[];
  transactions: WalletTransaction[];
  withdrawals: WithdrawalRequest[];
  spinConfig: SpinConfig;
  adConfig: AdNetworksConfig;
  rewardSettings: RewardSettings;
  auditLogs: AdminAuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Memory cache
let db: DatabaseSchema | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function getDefaultRewardSettings(): RewardSettings {
  return {
    minWithdrawal: 100,
    maxWithdrawal: 10000,
    withdrawalFeePercent: 2,
    signupBonus: 10,
    referralBonus: 15,
    referralCommissionPercent: 10,
    videoAdReward: 2.5,
    dailyVideoAdLimit: 20,
    videoAdCooldownSeconds: 60,
    maintenanceMode: false,
    noticeBanner: 'Welcome to TakaEarn BD! Earn real BDT with tasks, spins, and video ads. Instant payout via bKash, Nagad & Rocket.',
    noticeBannerBn: 'টাকাআর্ন বিডি-তে স্বাগতম! টাস্ক, স্পিন ও ভিডিও দেখে রিয়েল টাকা আয় করুন। বিকাশ, নগদ ও রকেটে দ্রুত পেমেন্ট নিন।',
  };
}

function getDefaultSpinConfig(): SpinConfig {
  return {
    isEnabled: true,
    dailySpinLimit: 10,
    freeSpinsDaily: 3,
    spinCost: 2,
    cooldownSeconds: 30,
    segments: [
      { id: '1', label: '৳ 1', reward: 1, color: '#059669', probability: 30, icon: 'coins' },
      { id: '2', label: '৳ 5', reward: 5, color: '#0284c7', probability: 25, icon: 'wallet' },
      { id: '3', label: '৳ 0', reward: 0, color: '#64748b', probability: 15, icon: 'frown' },
      { id: '4', label: '৳ 2', reward: 2, color: '#10b981', probability: 20, icon: 'sparkles' },
      { id: '5', label: '৳ 10', reward: 10, color: '#6366f1', probability: 10, icon: 'gift' },
      { id: '6', label: '৳ 20', reward: 20, color: '#8b5cf6', probability: 5, icon: 'star' },
      { id: '7', label: '৳ 50', reward: 50, color: '#ec4899', probability: 2, icon: 'zap' },
      { id: '8', label: '৳ 100', reward: 100, color: '#f59e0b', probability: 1, icon: 'crown' },
    ],
  };
}

function getDefaultAdConfig(): AdNetworksConfig {
  return {
    adsterra: {
      enabled: true,
      bannerCode: '<!-- Adsterra 728x90 / 300x250 Banner Placement Slot -->',
      socialBarCode: '<!-- Adsterra Social Bar Interactive Push Slot -->',
      popunderCode: '<!-- Adsterra Clean Direct Popunder Slot -->',
    },
    monetag: {
      enabled: true,
      directLinkUrl: 'https://example.com/monetag-direct-link-placement',
      showRewardPlacement: true,
      showTaskGatePlacement: true,
    },
    customPlacements: [
      {
        id: 'cp_1',
        name: 'Sponsored Partner Banner (bKash Offers)',
        type: 'banner',
        content: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
        enabled: true,
        location: 'dashboard',
      },
    ],
  };
}

function getDefaultTasks(): Task[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'task_bangladesh_fintech_app',
      title: 'Explore Nagad & bKash Digital Services Review',
      titleBn: 'নগদ ও বিকাশ ডিজিটাল সেবা পর্যালোচনা করুন',
      description: 'Visit the fintech comparison portal, stay on page for 45 seconds, and complete the feedback questionnaire.',
      descriptionBn: 'ফিনটেক পোর্টাল ভিজিট করুন, ৪৫ সেকেন্ড অবস্থান করুন এবং প্রশ্নমালার উত্তর দিন।',
      instructions: [
        'Open the sponsor portal link',
        'Watch the 10-second security verification gate',
        'Browse through the page and read the safety guidelines for 45 seconds',
        'Return to this tab and claim your ৳ 12 reward'
      ],
      instructionsBn: [
        'স্পন্সর পোর্টাল লিংকে যান',
        '১০ সেকেন্ডের সিকিউরিটি ভেরিফিকেশন গেট সম্পূর্ণ করুন',
        'পেজে ৪৫ সেকেন্ড অবস্থান করে নিয়মাবলী পড়ুন',
        'এখানে ফিরে এসে ১২ ৳ রিওয়ার্ড গ্রহণ করুন'
      ],
      category: 'website_visit',
      reward: 12,
      durationSeconds: 45,
      gateSeconds: 10,
      dailyLimit: 1,
      totalLimit: 5000,
      completedCount: 382,
      status: 'active',
      externalUrl: 'https://bangladesh.gov.bd',
      createdAt: now,
    },
    {
      id: 'task_bd_tech_quiz',
      title: 'Digital Bangladesh ICT Knowledge Quiz',
      titleBn: 'ডিজিটাল বাংলাদেশ আইসিটি সাধারণ জ্ঞান কুইজ',
      description: 'Test your knowledge about Bangladesh telecommunications, mobile finance, and internet revolution.',
      descriptionBn: 'বাংলাদেশের টেলিকমিউনিকেশন ও মোবাইল ব্যাংকিং সম্পর্কিত সহজ কুইজের উত্তর দিন।',
      instructions: [
        'Pass the 10-second ad countdown gate',
        'Stay on the page for 60 seconds to complete reading the quiz materials',
        'Answer simple 3 questions',
        'Get ৳ 15 credited to your TakaEarn wallet instantly'
      ],
      instructionsBn: [
        '১০ সেকেন্ডের এড কাউন্টডাউন গেট অতিক্রম করুন',
        '৬০ সেকেন্ড স্টাডি ম্যাটেরিয়াল পড়ুন',
        'সহজ ৩টি প্রশ্নের উত্তর দিন',
        'তাত্ক্ষণিকভাবে ১৫ ৳ আপনার ওয়ালেটে যোগ হবে'
      ],
      category: 'quiz',
      reward: 15,
      durationSeconds: 60,
      gateSeconds: 10,
      dailyLimit: 2,
      totalLimit: 3000,
      completedCount: 812,
      status: 'active',
      externalUrl: 'https://en.wikipedia.org/wiki/Telecommunications_in_Bangladesh',
      createdAt: now,
    },
    {
      id: 'task_youtube_community',
      title: 'Watch & Follow Official BD Earning Guide',
      titleBn: 'অফিসিয়াল আর্নিং ভিডিও গাইড দেখুন',
      description: 'Watch the earning tips tutorial video on YouTube for 90 seconds to learn how to maximize daily spins and referrals.',
      descriptionBn: 'প্রতিদিনের স্পিন এবং রেফারেল বোনাস বাড়ানোর টিউটোরিয়াল ভিডিওটি ৯০ সেকেন্ড দেখুন।',
      instructions: [
        'Click Start Task and view the 10s partner sponsor screen',
        'Watch the official tutorial video for at least 90 seconds',
        'Click the verify button to receive your BDT reward'
      ],
      instructionsBn: [
        'টাস্ক শুরু করুন এবং ১০ সেকেন্ড পার্টনার স্ক্রিন দেখুন',
        'কমপক্ষে ৯০ সেকেন্ড ভিডিওটি মনোযোগ দিয়ে দেখুন',
        'ভেরিফাই বাটনে ক্লিক করে টাকা গ্রহণ করুন'
      ],
      category: 'video_watch',
      reward: 20,
      durationSeconds: 90,
      gateSeconds: 10,
      dailyLimit: 1,
      totalLimit: 2000,
      completedCount: 940,
      status: 'active',
      externalUrl: 'https://www.youtube.com',
      createdAt: now,
    },
    {
      id: 'task_social_telegram_join',
      title: 'Join Official Telegram Payment Proof Channel',
      titleBn: 'টেলিগ্রাম পেমেন্ট প্রুফ চ্যানেলে যুক্ত হন',
      description: 'Join our verified Telegram community to see daily bKash/Nagad withdrawal proofs and promo codes.',
      descriptionBn: 'প্রতিদিনের বিকাশ/নগদ পেমেন্ট প্রুফ ও স্পেশাল কোড পেতে আমাদের টেলিগ্রাম চ্যানেলে জয়েন করুন।',
      instructions: [
        'Complete the 10-second gateway verification',
        'Open Telegram and join the channel',
        'Stay in the channel and submit your Telegram username for quick approval'
      ],
      instructionsBn: [
        '১০ সেকেন্ড গেটওয়ে ভেরিফিকেশন সম্পন্ন করুন',
        'টেলিগ্রাম চ্যানেলে জয়েন করুন',
        'আপনার টেলিগ্রাম ইউজারনেম জমা দিন'
      ],
      category: 'social_follow',
      reward: 10,
      durationSeconds: 30,
      gateSeconds: 10,
      dailyLimit: 1,
      totalLimit: 10000,
      completedCount: 1420,
      status: 'active',
      requiresProof: true,
      proofPlaceholder: '@your_telegram_username',
      createdAt: now,
    },
    {
      id: 'task_bangla_lifestyle_survey',
      title: 'Consumer Survey on Mobile Shopping in Dhaka & Chittagong',
      titleBn: 'অনলাইন শপিং ও মোবাইল রিচার্জ সার্ভে',
      description: 'Share your shopping preferences and mobile recharge habits in our 2-minute market research survey.',
      descriptionBn: 'আপনার অনলাইন শপিং ও মোবাইল রিচার্জের অভিজ্ঞতা শেয়ার করুন।',
      instructions: [
        'Pass the 10-second sponsor screen',
        'Complete all survey questions truthfully (takes 75 seconds)',
        'Click Complete to credit ৳ 25 to your available balance'
      ],
      instructionsBn: [
        '১০ সেকেন্ড স্পন্সর স্ক্রিন পার করুন',
        '৭৫ সেকেন্ডে সব কয়টি প্রশ্নের সঠিক উত্তর দিন',
        'কমপ্লিট বাটনে ক্লিক করে ২৫ ৳ ওয়ালেটে নিন'
      ],
      category: 'survey',
      reward: 25,
      durationSeconds: 75,
      gateSeconds: 10,
      dailyLimit: 1,
      totalLimit: 1500,
      completedCount: 610,
      status: 'active',
      createdAt: now,
    },
  ];
}

export async function initDatabase(): Promise<DatabaseSchema> {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse database file, resetting to defaults', err);
    }
  }

  if (!db) {
    db = {
      users: [],
      adminUsers: [],
      tasks: getDefaultTasks(),
      taskSessions: [],
      taskCompletions: [],
      transactions: [],
      withdrawals: [],
      spinConfig: getDefaultSpinConfig(),
      adConfig: getDefaultAdConfig(),
      rewardSettings: getDefaultRewardSettings(),
      auditLogs: [],
    };
  }

  // Ensure default structures exist
  if (!db.tasks || db.tasks.length === 0) db.tasks = getDefaultTasks();
  if (!db.spinConfig) db.spinConfig = getDefaultSpinConfig();
  if (!db.adConfig) db.adConfig = getDefaultAdConfig();
  if (!db.rewardSettings) db.rewardSettings = getDefaultRewardSettings();
  if (!db.auditLogs) db.auditLogs = [];
  if (!db.taskSessions) db.taskSessions = [];
  if (!db.taskCompletions) db.taskCompletions = [];
  if (!db.transactions) db.transactions = [];
  if (!db.withdrawals) db.withdrawals = [];
  if (!db.users) db.users = [];
  if (!db.adminUsers) db.adminUsers = [];

  // Initialize administrator if configured via environment secret
  const envAdminPassword = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD;
  const targetAdminUser = process.env.ADMIN_INITIAL_USERNAME || 'mdratan';

  const existingAdmin = db.adminUsers.find(
    (a) => a.username.toLowerCase() === targetAdminUser.toLowerCase()
  );

  if (envAdminPassword && envAdminPassword.trim().length >= 6) {
    if (!existingAdmin) {
      const hash = await bcrypt.hash(envAdminPassword, 10);
      db.adminUsers.push({
        id: 'admin_initial_' + Date.now(),
        username: targetAdminUser,
        passwordHash: hash,
        role: 'superadmin',
        createdAt: new Date().toISOString(),
      });
      console.log(`Initialized administrator ${targetAdminUser} from environment configuration.`);
    } else {
      // If admin exists, update password if env explicitly provided
      const hash = await bcrypt.hash(envAdminPassword, 10);
      existingAdmin.passwordHash = hash;
    }
  }

  await saveDatabase();
  return db;
}

export async function saveDatabase(): Promise<void> {
  if (!db) return;

  writeQueue = writeQueue.then(async () => {
    try {
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      await fs.promises.writeFile(tmpFile, JSON.stringify(db, null, 2), 'utf-8');
      await fs.promises.rename(tmpFile, DB_FILE);
    } catch (e) {
      console.error('Failed to write database file atomically:', e);
    }
  });

  return writeQueue;
}

export function getDb(): DatabaseSchema {
  if (!db) {
    throw new Error('Database not initialized! Call initDatabase() first.');
  }
  return db;
}

/**
 * Atomically adjusts user balance with strict accounting ledger entry
 */
export async function adjustUserBalance(params: {
  userId: string;
  amount: number;
  type: TransactionType;
  description: string;
  descriptionBn?: string;
  referenceId?: string;
  adminUsername?: string;
}): Promise<{ user: User; transaction: WalletTransaction }> {
  const currentDb = getDb();
  const user = currentDb.users.find((u) => u.id === params.userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.status === 'suspended') {
    throw new Error('This account is suspended. Transactions are locked.');
  }

  const oldBalance = user.balance;
  const newBalance = Math.round((oldBalance + params.amount) * 100) / 100;

  if (newBalance < 0) {
    throw new Error('Insufficient balance for this operation.');
  }

  user.balance = newBalance;

  // Track earnings metrics for positive earnings
  if (params.amount > 0) {
    user.totalEarned = Math.round((user.totalEarned + params.amount) * 100) / 100;
    if (params.type === 'task_reward') {
      user.tasksCompleted += 1;
    } else if (params.type === 'referral_bonus') {
      user.referralEarnings = Math.round((user.referralEarnings + params.amount) * 100) / 100;
    } else if (params.type === 'video_ad_reward') {
      user.adEarnings = Math.round((user.adEarnings + params.amount) * 100) / 100;
    } else if (params.type === 'spin_reward') {
      user.spinEarnings = Math.round((user.spinEarnings + params.amount) * 100) / 100;
    }
  }

  const transaction: WalletTransaction = {
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    userId: user.id,
    type: params.type,
    amount: params.amount,
    balanceBefore: oldBalance,
    balanceAfter: newBalance,
    referenceId: params.referenceId,
    description: params.description,
    descriptionBn: params.descriptionBn,
    createdAt: new Date().toISOString(),
  };

  currentDb.transactions.unshift(transaction);

  if (params.adminUsername) {
    currentDb.auditLogs.unshift({
      id: 'audit_' + Date.now(),
      adminUsername: params.adminUsername,
      action: 'BALANCE_ADJUSTMENT',
      targetType: 'USER',
      targetId: user.id,
      details: `Adjusted user ${user.name} (${user.email || user.phone}) balance by ${params.amount >= 0 ? '+' : ''}${params.amount} BDT. Reason: ${params.description}`,
      timestamp: new Date().toISOString(),
    });
  }

  await saveDatabase();
  return { user, transaction };
}

/**
 * Records an administrator audit log
 */
export async function recordAuditLog(
  adminUsername: string,
  action: string,
  targetType: string,
  details: string,
  targetId?: string,
  ipAddress?: string
): Promise<void> {
  const currentDb = getDb();
  currentDb.auditLogs.unshift({
    id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    adminUsername,
    action,
    targetType,
    targetId,
    details,
    ipAddress,
    timestamp: new Date().toISOString(),
  });
  await saveDatabase();
}
