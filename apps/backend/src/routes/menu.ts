import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest, hasPermission } from '@jastip/auth';

const prisma = new PrismaClient();
const router: Router = Router();

// Validation schemas
const createMenuItemSchema = z.object({
  restaurantId: z.string().cuid(),
  externalId: z.string().optional().nullable(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().int().positive(),
  category: z.string().min(1),
  includeJastip: z.boolean().default(true),
  jastipFeeSpecial: z.number().int().nonnegative().optional().nullable(),
  addons: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional().nullable(),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const updateMenuItemSchema = createMenuItemSchema.partial();

const bulkMenuSchema = z.object({
  items: z.array(createMenuItemSchema),
});

function requireTenantAccess(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user || !hasPermission(req.user.role, 'menu:read')) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }
  next();
}

router.use(requireTenantAccess);

// GET /api/menu
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const search = req.query.search as string;
  const category = req.query.category as string;
  const restaurantId = req.query.restaurantId as string;
  const isAvailable = req.query.isAvailable === 'true' ? true : req.query.isAvailable === 'false' ? false : undefined;
  const skip = (page - 1) * limit;

  const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.query.tenantId as string : req.user!.tenantId;

  const where: any = { tenantId };
  if (isAvailable !== undefined) where.isAvailable = isAvailable;
  if (restaurantId) where.restaurantId = restaurantId;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.menuItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ restaurant: { name: 'asc' } }, { sortOrder: 'asc' }, { name: 'asc' }],
      include: { restaurant: { select: { id: true, name: true } } },
    }),
    prisma.menuItem.count({ where }),
  ]);

  return res.json({
    success: true,
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/menu/categories
router.get('/categories', async (req: AuthenticatedRequest, res: Response) => {
  const restaurantId = req.query.restaurantId as string;
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.query.tenantId as string : req.user!.tenantId;

  const categories = await prisma.menuCategory.findMany({
    where: { tenantId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  // Also get unique categories from menu items
  const menuCategories = await prisma.menuItem.findMany({
    where: { tenantId, isAvailable: true, ...(restaurantId ? { restaurantId } : {}) },
    select: { category: true },
    distinct: ['category'],
  });

  const allCategories = [...new Set([...categories.map((c: { name: string }) => c.name), ...menuCategories.map((m: { category: string }) => m.category)])];

  return res.json({ success: true, data: allCategories });
});

// GET /api/menu/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

  const item = await prisma.menuItem.findFirst({
    where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
    include: { restaurant: true },
  });

  if (!item) {
    return res.status(404).json({ success: false, error: 'Menu item not found' });
  }

  return res.json({ success: true, data: item });
});

// POST /api/menu
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = createMenuItemSchema.parse(req.body);
    const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.body.tenantId : req.user!.tenantId;

    // Verify restaurant belongs to tenant
    const restaurant = await prisma.restaurant.findFirst({
      where: { id: data.restaurantId, tenantId },
    });
    if (!restaurant) {
      return res.status(400).json({ success: false, error: 'Restaurant not found' });
    }

    const item = await prisma.menuItem.create({
      data: { ...data, tenantId, addons: JSON.stringify(data.addons) },
    });

    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// PATCH /api/menu/:id
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = updateMenuItemSchema.parse(req.body);
    const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

    const updateData: any = { ...data };
    if (data.addons) updateData.addons = JSON.stringify(data.addons);

    const item = await prisma.menuItem.update({
      where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
      data: updateData,
    });

    return res.json({ success: true, data: item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// DELETE /api/menu/:id (soft delete)
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

  await prisma.menuItem.update({
    where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
    data: { isAvailable: false },
  });

  return res.json({ success: true, message: 'Menu item deactivated' });
});

// POST /api/menu/bulk
router.post('/bulk', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { items } = bulkMenuSchema.parse(req.body);
    const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.body.tenantId : req.user!.tenantId;

    // Verify all restaurants belong to tenant
    const restaurantIds = [...new Set(items.map((i) => i.restaurantId))];
    const restaurants = await prisma.restaurant.findMany({
      where: { id: { in: restaurantIds }, tenantId },
    });
    if (restaurants.length !== restaurantIds.length) {
      return res.status(400).json({ success: false, error: 'Some restaurants not found' });
    }

    const created = await Promise.all(
      items.map((item) =>
        prisma.menuItem.create({
          data: { ...item, tenantId, addons: JSON.stringify(item.addons) },
        })
      )
    );

    return res.status(201).json({ success: true, data: created, count: created.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

export { router as menuRouter };