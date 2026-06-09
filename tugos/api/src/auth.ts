import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthContext, Role } from './types.js';

const ACCESS_TOKEN_TTL = '15m'; // blueprint: short-lived web access tokens
const BCRYPT_COST = 12;

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s || s.trim() === '') throw new Error('Missing required environment variable: JWT_SECRET');
  return s;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

interface TokenClaims {
  sub: string;
  company_id: string;
  role: Role;
}

export function signAccessToken(ctx: AuthContext): string {
  const claims: TokenClaims = { sub: ctx.userId, company_id: ctx.companyId, role: ctx.role };
  return jwt.sign(claims, secret(), { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string): AuthContext {
  const decoded = jwt.verify(token, secret()) as TokenClaims;
  return { userId: decoded.sub, companyId: decoded.company_id, role: decoded.role };
}
