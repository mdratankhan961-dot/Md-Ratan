import { Router, Response } from 'express';
import { getDb, saveDatabase, adjustUserBalance } from '../db.js';
import {
  hashPassword,
  comparePassword,
  generateUserToken,
  requireUserAuth,
  AuthenticatedRequest,
  rateLimiter,
} from '../auth.js';
import { User } from '../../src/types/index.js';

const router = Router();

// Helper to generate referral code
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TK';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// User Registration
router.post('/register', rateLimiter(15, 60000), async (req, res): Promise<void> => {
  try {
    const { name, email, phone, password, referralCode } = req.body;

    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter a valid full name (minimum 2 characters).' });
      return;
    }

    if (!phone && !email) {
      res.status(400).json({ error: 'Please enter your mobile number or email.' });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const db = getDb();
    const cleanPhone = phone ? phone.trim().replace(/[^0-9+]/g, '') : '';
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (cleanPhone) {
      const existingPhone = db.users.find((u) => u.phone === cleanPhone);
      if (existingPhone) {
        res.status(400).json({ error: 'This phone number is already registered. Please log in.' });
        return;
      }
    }

    if (cleanEmail) {
      const existingEmail = db.users.find((u) => u.email === cleanEmail);
      if (existingEmail) {
        res.status(400).json({ error: 'This email is already registered. Please log in.' });
        return;
      }
    }

    // Verify referrer if provided
    let referrer: User | undefined;
    if (referralCode && referralCode.trim()) {
      const cleanRefCode = referralCode.trim().toUpperCase();
      referrer = db.users.find((u) => u.referralCode.toUpperCase() === cleanRefCode);
      if (!referrer) {
        // We allow registration even if referral code is mistyped, but inform user or ignore
      }
    }

    // Create unique referral code for new user
    let userReferralCode = generateReferralCode();
    while (db.users.some((u) => u.referralCode === userReferralCode)) {
      userReferralCode = generateReferralCode();
    }

    const passwordHash = await hashPassword(password);
    const signupBonus = db.rewardSettings.signupBonus || 10;

    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      passwordHash,
      referralCode: userReferralCode,
      referredBy: referrer ? referrer.id : undefined,
      status: 'active',
      balance: 0,
      pendingWithdrawal: 0,
      totalEarned: 0,
      tasksCompleted: 0,
      referralEarnings: 0,
      adEarnings: 0,
      spinEarnings: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    await saveDatabase();

    // Credit signup bonus
    if (signupBonus > 0) {
      await adjustUserBalance({
        userId: newUser.id,
        amount: signupBonus,
        type: 'signup_bonus',
        description: `Welcome signup bonus of ৳ ${signupBonus}`,
        descriptionBn: `স্বাগতম বোনাস ৳ ${signupBonus}`,
      });
    }

    // If referred by another user, award referral bonus to referrer
    if (referrer && db.rewardSettings.referralBonus > 0) {
      const refBonus = db.rewardSettings.referralBonus;
      try {
        await adjustUserBalance({
          userId: referrer.id,
          amount: refBonus,
          type: 'referral_bonus',
          description: `Referral bonus for inviting ${newUser.name}`,
          descriptionBn: `${newUser.name}-কে রেফার করার জন্য বোনাস`,
          referenceId: newUser.id,
        });
      } catch (e) {
        console.error('Error awarding referrer bonus:', e);
      }
    }

    const token = generateUserToken(newUser);
    const { passwordHash: _, ...safeUser } = newUser;

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome bonus credited.',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// User Login
router.post('/login', rateLimiter(20, 60000), async (req, res): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: 'Please enter your phone/email and password.' });
      return;
    }

    const db = getDb();
    const cleanId = identifier.trim();

    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === cleanId.toLowerCase() ||
        u.phone.replace(/[^0-9]/g, '') === cleanId.replace(/[^0-9]/g, '')
    );

    if (!user) {
      res.status(401).json({ error: 'No account found with this phone number or email.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        error: 'Your account has been suspended by administration. Contact support on Telegram/WhatsApp.',
      });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Incorrect password. Please try again.' });
      return;
    }

    user.lastLoginAt = new Date().toISOString();
    await saveDatabase();

    const token = generateUserToken(user);
    const { passwordHash: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// Get Current User Profile
router.get('/me', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Update Profile
router.put('/profile', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { name, phone, email } = req.body;

    if (name && name.trim().length >= 2) {
      user.name = name.trim();
    }
    if (phone && phone.trim()) {
      user.phone = phone.trim();
    }
    if (email && email.trim()) {
      user.email = email.trim().toLowerCase();
    }

    await saveDatabase();
    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Profile update failed' });
  }
});

// Change Password
router.post('/change-password', requireUserAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters.' });
      return;
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    await saveDatabase();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Password update failed' });
  }
});

// Forgot Password / Reset
router.post('/forgot-password', rateLimiter(10, 60000), async (req, res): Promise<void> => {
  const { identifier } = req.body;
  if (!identifier) {
    res.status(400).json({ error: 'Please provide registered email or mobile number.' });
    return;
  }
  const db = getDb();
  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === identifier.trim().toLowerCase() ||
      u.phone.replace(/[^0-9]/g, '') === identifier.trim().replace(/[^0-9]/g, '')
  );

  if (!user) {
    // For privacy, don't expose account non-existence
    res.json({
      success: true,
      message: 'If an account matches this detail, instructions have been sent.',
    });
    return;
  }

  // Generate temporary 6-digit reset token
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  res.json({
    success: true,
    message: 'Reset verification code sent. (Demo verification code: ' + resetCode + ')',
    demoCode: resetCode,
  });
});

export default router;
