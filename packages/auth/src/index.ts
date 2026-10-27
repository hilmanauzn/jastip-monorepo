import { SignJWT, jwtVerify } from 'jose';
import * as bcrypt from 'bcryptjs';
import type { User, Tenant } from '@jastip/shared-types';
import type { Request } from 'express';

export type Role = 'SUPER_ADMIN' | 'ADMIN_TENANT' | 'STAFF';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  tenantId: string;
  tenantSlug?: string;
  type: 'access' | 'refresh';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAccessToken(user: User, tenant: Tenant): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    tenantSlug: tenant.slug,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function createRefreshToken(user: User, tenant: Tenant): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    tenantSlug: tenant.slug,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const payload = await verifyToken(token);
  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return payload;
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  const payload = await verifyToken(token);
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return payload;
}

// Role-based access control
type PermissionsMap = Record<Role, readonly string[]>;

const permissions: PermissionsMap = {
  SUPER_ADMIN: ['*'],
  ADMIN_TENANT: [
    'tenant:read', 'tenant:update',
    'menu:create', 'menu:read', 'menu:update', 'menu:delete',
    'order:create', 'order:read', 'order:update', 'order:delete',
    'rule:read', 'rule:update',
    'analytics:read',
    'user:create', 'user:read', 'user:update', 'user:delete',
    'customer:create', 'customer:read', 'customer:update', 'customer:delete',
    'restaurant:create', 'restaurant:read', 'restaurant:update', 'restaurant:delete',
    'settings:read', 'settings:update',
  ],
  STAFF: [
    'menu:read',
    'order:create', 'order:read', 'order:update',
    'customer:create', 'customer:read',
    'analytics:read',
    'restaurant:read',
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  const rolePermissions = permissions[role];
  if (!rolePermissions) return false;
  if (rolePermissions.includes('*')) return true;
  return rolePermissions.includes(permission);
}

export function requirePermission(role: Role, permission: string): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Insufficient permissions: ${permission} required`);
  }
}

// Middleware helpers for Express
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  tenantId?: string;
  tenant?: Tenant;
  query: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
  body: any;
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

export function getHeader(req: AuthenticatedRequest, name: string): string | undefined {
  // Express headers are lowercase
  const header = req.headers[name.toLowerCase()];
  return Array.isArray(header) ? header[0] : header;
}

export async function authenticateRequest(req: AuthenticatedRequest): Promise<JwtPayload | null> {
  const token = extractTokenFromHeader(getHeader(req, 'authorization'));
  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);
    req.user = payload;
    req.tenantId = payload.tenantId;
    return payload;
  } catch {
    return null;
  }
}

// Tenant resolution from subdomain or header
export function resolveTenantFromRequest(req: AuthenticatedRequest): { slug: string | null; isAdmin: boolean; isApi: boolean } {
  const hostname = getHeader(req, 'host') || '';
  const slug = hostname.split('.')[0];

  if (slug === 'admin') return { slug: null, isAdmin: true, isApi: false };
  if (slug === 'api') return { slug: null, isAdmin: false, isApi: true };
  if (['www', 'localhost'].includes(slug)) return { slug: null, isAdmin: false, isApi: false };

  return { slug, isAdmin: false, isApi: false };
}