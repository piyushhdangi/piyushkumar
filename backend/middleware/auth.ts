import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/db.ts';
import type { UserRecord, UserRole } from '../../src/utils/campusLogic.ts';

export interface SessionData {
  token: string;
  userId: number;
  createdAt: number;
  expiresAt: number;
}

export interface AuthenticatedRequest extends Request {
  user?: Omit<UserRecord, 'password_hash'>;
  sessionToken?: string;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const sessions = new Map<string, SessionData>();

export function createSession(userId: number): string {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  sessions.set(token, {
    token,
    userId,
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  });
  return token;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const key = pair.slice(0, idx).trim();
      const val = decodeURIComponent(pair.slice(idx + 1).trim());
      result[key] = val;
    }
  });
  return result;
}

export function extractTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const customHeader = req.headers['x-session-token'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    return customHeader.trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.campus_sid) {
    return cookies.campus_sid;
  }
  return null;
}

export function attachOptionalUser(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractTokenFromRequest(req);
  if (token) {
    const session = sessions.get(token);
    if (session && session.expiresAt > Date.now()) {
      const user = db.findUserById(session.userId);
      if (user) {
        const { password_hash: _, ...safeUser } = user;
        req.user = safeUser;
        req.sessionToken = token;
      }
    } else if (session) {
      sessions.delete(token);
    }
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  attachOptionalUser(req, res, () => {});
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please sign in with your campus account.' });
    return;
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    attachOptionalUser(req, res, () => {});
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
      });
      return;
    }
    next();
  };
}
