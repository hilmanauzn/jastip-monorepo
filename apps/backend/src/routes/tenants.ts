import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest, hasPermission } from '@jastip/auth';

const prisma = new PrismaClient();
const router: Router = Router();

// Validation schemas
const createTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  domain: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  settings: z.record(z.unknown()).optional(),
});

const updateTenantSchema = createTenantSchema.partial();

// All tenant routes require SUPER_ADMIN
function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, error: 'Super Admin required' });
  }
  next();
}

router.use(requireSuperAdmin);

// GET /api/tenants
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { slug: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { restaurants: true, users: true, orders: true } },
      },
    }),
    prisma.tenant.count({ where }),
  ]);

  return res.json({
    success: true,
    data: tenants,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/tenants/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { restaurants: true, users: true, orders: true, menus: true } },
      restaurants: { where: { isActive: true }, take: 10 },
      users: { take: 10 },
    },
  });

  if (!tenant) {
    return res.status(404).json({ success: false, error: 'Tenant not found' });
  }

  return res.json({ success: true, data: tenant });
});

// POST /api/tenants
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = createTenantSchema.parse(req.body);

    // Check slug uniqueness
    const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Slug already exists' });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        logoUrl: data.logoUrl,
        settings: data.settings ? JSON.stringify(data.settings) : null,
      },
    });

    // Create default settings
    await prisma.settings.create({
      data: {
        tenantId: tenant.id,
        shopName: tenant.name,
        tagline: 'Jasa Titip Makanan',
        bankAccounts: JSON.stringify([]),
      },
    });

    // Create default jastip rule (use global)
    await prisma.jastipRuleTenant.create({
      data: {
        tenantId: tenant.id,
        useGlobalRule: true,
      },
    });

    return res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// PATCH /api/tenants/:id
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = updateTenantSchema.parse(req.body);

    const updateData: any = { ...data };
    if (data.settings !== undefined) {
      updateData.settings = data.settings ? JSON.stringify(data.settings) : null;
    }

    const tenant = await prisma.tenant.update({
      where: { id: req.params.id },
      data: updateData,
    });

    return res.json({ success: true, data: tenant });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// DELETE /api/tenants/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  await prisma.tenant.delete({ where: { id: req.params.id } });
  return res.json({ success: true, message: 'Tenant deleted' });
});

// GET /api/tenants/:id/stats
router.get('/:id/stats', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.params.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalRestaurants,
    totalMenus,
    totalUsers,
    totalOrders,
    totalRevenue,
    ordersThisMonth,
    revenueThisMonth,
    ordersLastMonth,
    revenueLastMonth,
  ] = await Promise.all([
    prisma.restaurant.count({ where: { tenantId, isActive: true } }),
    prisma.menuItem.count({ where: { tenantId, isAvailable: true } }),
    prisma.user.count({ where: { tenantId } }),
    prisma.order.count({ where: { tenantId } }),
    prisma.order.aggregate({
      where: { tenantId, paymentStatus: 'PAID' },
      _sum: { grandTotal: true },
    }),
    prisma.order.count({
      where: { tenantId, createdAt: { gte: startOfMonth } },
    }),
    prisma.order.aggregate({
      where: { tenantId, createdAt: { gte: startOfMonth }, paymentStatus: 'PAID' },
      _sum: { grandTotal: true },
    }),
    prisma.order.count({
      where: { tenantId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    prisma.order.aggregate({
      where: { tenantId, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, paymentStatus: 'PAID' },
      _sum: { grandTotal: true },
    }),
  ]);

  return res.json({
    success: true,
    data: {
      totalRestaurants,
      totalMenus,
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue._sum.grandTotal || 0,
      ordersThisMonth,
      revenueThisMonth: revenueThisMonth._sum.grandTotal || 0,
      ordersLastMonth,
      revenueLastMonth: revenueLastMonth._sum.grandTotal || 0,
      orderGrowth: ordersLastMonth > 0 ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100 : 0,
      revenueGrowth: (revenueLastMonth._sum.grandTotal || 0) > 0
        ? ((revenueThisMonth._sum.grandTotal || 0) - (revenueLastMonth._sum.grandTotal || 0)) / (revenueLastMonth._sum.grandTotal || 1) * 100
        : 0,
    },
  });
});

export { router as tenantRouter };