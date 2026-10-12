import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb } from './db.js';
import { User, AdminUser } from '../src/types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'takaearn_bd_super_secure_jwt_secret_key_2026';

export interface AuthUserPayload {
  userId: string;
  role: 'user';
}

export interface AuthAdminPayload {
  adminId: string;
  username: string;
  role: 'admin' | 'superadmin';
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  admin?: AdminUser;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateUserToken(user: User): string {
  return jwt.sign(
    { userId: user.id, role: 'user' } as AuthUserPayload,
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function generateAdminToken(admin: AdminUser): string {
  return jwt.sign(
    { adminId: admin.id, username: admin.username, role: admin.role } as AuthAdminPayload,
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function requireUserAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.user_token) {
      token = req.cookies.user_token;
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please log in.' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    if (decoded.role !== 'user') {
      res.status(403).json({ error: 'Invalid user token' });
      return;
    }

    const db = getDb();
    const user = db.users.find((u) => u.id === decoded.userId);

    if (!user) {
      res.status(401).json({ error: 'User no longer exists.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ error: 'Your account has been suspended by administration.' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
}

export function requireAdminAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.admin_token) {
      token = req.cookies.admin_token;
    }

    if (!token) {
      res.status(401).json({ error: 'Admin authorization required. Access denied.' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthAdminPayload;
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      res.status(403).json({ error: 'Administrative privilege required.' });
      return;
    }

    const db = getDb();
    const admin = db.adminUsers.find((a) => a.id === decoded.adminId);

    if (!admin) {
      res.status(401).json({ error: 'Administrator account not found.' });
      return;
    }

    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ error: 'Admin session expired or invalid. Re-authenticate.' });
  }
}

// In-memory rate limiting map
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export function rateLimiter(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${req.baseUrl || req.path}_${ip}`;
    const now = Date.now();

    const record = rateLimitMap.get(key);
    if (!record || record.expiresAt < now) {
      rateLimitMap.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (record.count >= limit) {
      res.status(429).json({
        error: 'Too many requests. Please slow down and try again in a few moments.',
      });
      return;
    }

    record.count += 1;
    next();
  };
}
