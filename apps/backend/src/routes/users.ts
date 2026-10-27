import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest, hasPermission } from '@jastip/auth';

const prisma = new PrismaClient();
const router: Router = Router();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['ADMIN_TENANT', 'STAFF']),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  role: z.enum(['ADMIN_TENANT', 'STAFF']).optional(),
  password: z.string().min(6).optional(),
});

// All user routes require ADMIN_TENANT or SUPER_ADMIN
function requireAdminOrSuper(req: AuthenticatedRequest, res: Response, next: () => void) {
  if (!req.user || !['ADMIN_TENANT', 'SUPER_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }
  next();
}

router.use(requireAdminOrSuper);

// GET /api/users
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const skip = (page - 1) * limit;

  const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.query.tenantId as string : req.user!.tenantId;

  const where = {
    tenantId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return res.json({
    success: true,
    data: users,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/users/:id
router.get('/:id', async (req: AuthenticatedRequest & { params: { id: string } }, res: Response): Promise<Response> => {
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;
  
  const user = await prisma.user.findFirst({
    where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tenantId: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  return res.json({ success: true, data: user });
});

// POST /api/users
(router.post as any)('/', async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
  try {
    const data = createUserSchema.parse(req.body || {});

    const tenantId = req.user!.role === 'SUPER_ADMIN' ? (req.body as any).tenantId : req.user!.tenantId;

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
        tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// PATCH /api/users/:id
(router.patch as any)('/:id', async (req: AuthenticatedRequest & { params: { id: string } }, res: Response): Promise<Response> => {
  try {
    const data = updateUserSchema.parse(req.body);

    const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

    const updateData: any = { ...data };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
      delete updateData.password;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        updatedAt: true,
      },
    });

    return res.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// DELETE /api/users/:id
(router.delete as any)('/:id', async (req: AuthenticatedRequest & { params: { id: string } }, res: Response): Promise<Response> => {
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

  await prisma.user.delete({ where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) } });
  return res.json({ success: true, message: 'User deleted' });
});

export { router as userRouter };