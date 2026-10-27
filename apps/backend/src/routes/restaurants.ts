import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest, hasPermission } from '@jastip/auth';

const prisma = new PrismaClient();
const router: Router = Router();

// Validation schemas
const createRestaurantSchema = z.object({
  name: z.string().min(2),
  jastipFee: z.number().int().nonnegative(),
  multiple: z.number().int().positive().default(1),
  taxService: z.number().int().nonnegative().default(0),
  taxCharge: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

const updateRestaurantSchema = createRestaurantSchema.partial();

function requireTenantAccess(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user || !hasPermission(req.user.role, 'restaurant:read')) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }
  next();
}

router.use(requireTenantAccess);

// GET /api/restaurants
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
  const skip = (page - 1) * limit;

  const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.query.tenantId as string : req.user!.tenantId;

  const where: any = { tenantId };
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { menus: true } },
      },
    }),
    prisma.restaurant.count({ where }),
  ]);

  // Get jastip overrides separately
  const restaurantIds = restaurants.map((r: { id: string }) => r.id);
  const overrides = await prisma.jastipOverride.findMany({
    where: { tenantId, restaurantId: { in: restaurantIds } },
  });
  const overrideMap = new Map(overrides.map((o: { restaurantId: string; fee: number }) => [o.restaurantId, o.fee]));

  const data = restaurants.map((r: { id: string }) => ({
    ...r,
    jastipOverride: overrideMap.get(r.id) || null,
  }));

  return res.json({
    success: true,
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/restaurants/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
    include: {
      menus: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!restaurant) {
    return res.status(404).json({ success: false, error: 'Restaurant not found' });
  }

  // Get jastip override separately
  const override = await prisma.jastipOverride.findUnique({
    where: { tenantId_restaurantId: { tenantId: tenantId!, restaurantId: restaurant.id } },
  });

  return res.json({
    success: true,
    data: {
      ...restaurant,
      jastipOverride: override?.fee || null,
    },
  });
});

// POST /api/restaurants
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = createRestaurantSchema.parse(req.body);
    const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.body.tenantId : req.user!.tenantId;

    const restaurant = await prisma.restaurant.create({
      data: { ...data, tenantId },
    });

    return res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// PATCH /api/restaurants/:id
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = updateRestaurantSchema.parse(req.body);
    const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

    const restaurant = await prisma.restaurant.update({
      where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
      data,
    });

    return res.json({ success: true, data: restaurant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// DELETE /api/restaurants/:id (soft delete)
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

  await prisma.restaurant.update({
    where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
    data: { isActive: false },
  });

  return res.json({ success: true, message: 'Restaurant deactivated' });
});

// POST /api/restaurants/:id/jastip-override
router.post('/:id/jastip-override', async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({ fee: z.number().int().nonnegative(), createdBy: z.string().optional() });
  const { fee, createdBy } = schema.parse(req.body);

  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

  const override = await prisma.jastipOverride.upsert({
    where: { tenantId_restaurantId: { tenantId: tenantId!, restaurantId: req.params.id } },
    update: { fee, createdBy: createdBy || req.user!.userId },
    create: { tenantId: tenantId!, restaurantId: req.params.id, fee, createdBy: createdBy || req.user!.userId },
  });

  return res.json({ success: true, data: override });
});

// DELETE /api/restaurants/:id/jastip-override
router.delete('/:id/jastip-override', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

  await prisma.jastipOverride.delete({
    where: { tenantId_restaurantId: { tenantId: tenantId!, restaurantId: req.params.id } },
  });

  return res.json({ success: true, message: 'Override removed' });
});

export { router as restaurantRouter };