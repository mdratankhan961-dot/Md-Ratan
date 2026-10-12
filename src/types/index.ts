export type AccountStatus = 'active' | 'suspended';

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  referralCode: string;
  referredBy?: string;
  status: AccountStatus;
  balance: number;
  pendingWithdrawal: number;
  totalEarned: number;
  tasksCompleted: number;
  referralEarnings: number;
  adEarnings: number;
  spinEarnings: number;
  createdAt: string;
  lastLoginAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  role: 'superadmin' | 'admin';
  createdAt: string;
  lastLoginAt?: string;
}

export type TaskCategory = 'app_install' | 'survey' | 'website_visit' | 'social_follow' | 'video_watch' | 'quiz';

export type TaskStatus = 'active' | 'paused' | 'draft';

export interface Task {
  id: string;
  title: string;
  titleBn?: string;
  description: string;
  descriptionBn?: string;
  instructions: string[];
  instructionsBn?: string[];
  category: TaskCategory;
  reward: number; // in BDT
  durationSeconds: number; // e.g. 60s
  gateSeconds: number; // standard 10s countdown ad gate
  dailyLimit: number;
  totalLimit: number;
  completedCount: number;
  status: TaskStatus;
  externalUrl?: string;
  requiresProof?: boolean;
  proofPlaceholder?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface TaskSession {
  id: string;
  taskId: string;
  userId: string;
  token: string;
  startedAt: number; // server timestamp ms
  gatePassedAt?: number;
  completedAt?: number;
  status: 'started' | 'gate_passed' | 'completed' | 'abandoned';
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  userId: string;
  reward: number;
  completedAt: string;
  proofText?: string;
}

export type TransactionType =
  | 'task_reward'
  | 'video_ad_reward'
  | 'spin_reward'
  | 'referral_bonus'
  | 'signup_bonus'
  | 'withdrawal_reserve'
  | 'withdrawal_refund'
  | 'admin_adjustment';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // positive or negative
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string;
  description: string;
  descriptionBn?: string;
  createdAt: string;
}

export type WithdrawalMethod = 'bkash' | 'nagad' | 'rocket';
export type WithdrawalStatus = 'pending' | 'approved' | 'processing' | 'paid' | 'rejected' | 'cancelled';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  fee: number;
  payableAmount: number;
  method: WithdrawalMethod;
  accountNumber: string;
  accountType: 'personal' | 'agent';
  status: WithdrawalStatus;
  transactionRef?: string;
  adminNote?: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface SpinSegment {
  id: string;
  label: string;
  reward: number; // BDT
  color: string;
  probability: number; // weight
  icon?: string;
}

export interface SpinConfig {
  isEnabled: boolean;
  dailySpinLimit: number;
  freeSpinsDaily: number;
  spinCost: number; // BDT if not free
  cooldownSeconds: number;
  segments: SpinSegment[];
}

export interface AdNetworksConfig {
  adsterra: {
    enabled: boolean;
    bannerCode: string;
    socialBarCode: string;
    popunderCode: string;
  };
  monetag: {
    enabled: boolean;
    directLinkUrl: string;
    showRewardPlacement: boolean;
    showTaskGatePlacement: boolean;
  };
  customPlacements: Array<{
    id: string;
    name: string;
    type: 'banner' | 'link' | 'html';
    content: string;
    enabled: boolean;
    location: 'dashboard' | 'task_gate' | 'wallet' | 'spin';
  }>;
}

export interface RewardSettings {
  minWithdrawal: number;
  maxWithdrawal: number;
  withdrawalFeePercent: number;
  signupBonus: number;
  referralBonus: number;
  referralCommissionPercent: number;
  videoAdReward: number;
  dailyVideoAdLimit: number;
  videoAdCooldownSeconds: number;
  maintenanceMode: boolean;
  noticeBanner?: string;
  noticeBannerBn?: string;
}

export interface AdminAuditLog {
  id: string;
  adminUsername: string;
  action: string;
  targetType: string;
  targetId?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnedCommission: number;
  referralsList: Array<{
    id: string;
    name: string;
    createdAt: string;
    tasksCompleted: number;
    status: AccountStatus;
  }>;
}
