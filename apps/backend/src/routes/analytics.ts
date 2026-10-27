import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, hasPermission } from '@jastip/auth';

const prisma = new PrismaClient();
const router: Router = Router();

function requireTenantAccess(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user || !hasPermission(req.user.role, 'analytics:read')) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }
  next();
}

router.use(requireTenantAccess);

// GET /api/analytics/sales
router.get('/sales', async (req: AuthenticatedRequest, res: Response) => {
  const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

  const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.query.tenantId as string : req.user!.tenantId;

  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      createdAt: { gte: dateFrom, lte: dateTo },
      paymentStatus: 'PAID',
    },
    select: {
      createdAt: true,
      grandTotal: true,
      jastipFeeTotal: true,
    },
  });

  // Group by period
  const groups = new Map<string, { orders: number; revenue: number; jastipFee: number }>();

  for (const order of orders) {
    let key: string;
    const date = new Date(order.createdAt);
    
    if (period === 'daily') {
      key = date.toISOString().split('T')[0];
    } else if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    const existing = groups.get(key) || { orders: 0, revenue: 0, jastipFee: 0 };
    existing.orders += 1;
    existing.revenue += order.grandTotal;
    existing.jastipFee += order.jastipFeeTotal;
    groups.set(key, existing);
  }

  const data = Array.from(groups.entries())
    .map(([date, values]) => ({ date, ...values }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const summary = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum: number, o: { grandTotal: number }) => sum + o.grandTotal, 0),
    totalJastipFee: orders.reduce((sum: number, o: { jastipFeeTotal: number }) => sum + o.jastipFeeTotal, 0),
    avgOrderValue: orders.length > 0 ? orders.reduce((sum: number, o: { grandTotal: number }) => sum + o.grandTotal, 0) / orders.length : 0,
  };

  return res.json({ success: true, data: { period, data, summary } });
});

// GET /api/analytics/top-items
router.get('/top-items', async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

  const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.query.tenantId as string : req.user!.tenantId;

  const items = await prisma.orderItem.groupBy({
    by: ['menuItemId', 'name', 'category'],
    where: {
      order: { tenantId, createdAt: { gte: dateFrom, lte: dateTo }, paymentStatus: 'PAID' },
    },
    _sum: { quantity: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  const revenueData = await prisma.orderItem.groupBy({
    by: ['menuItemId'],
    where: {
      order: { tenantId, createdAt: { gte: dateFrom, lte: dateTo }, paymentStatus: 'PAID' },
    },
    _sum: { subtotal: true },
  });

  const revenueMap = new Map(revenueData.map((r: { menuItemId: string | null; _sum: { subtotal: number | null } }) => [r.menuItemId || '', r._sum.subtotal || 0]));

  const data = items.map((item: { menuItemId: string | null; name: string; category: string; _sum: { quantity: number | null }; _count: { id: number } }) => ({
    menuItemId: item.menuItemId || '',
    name: item.name,
    category: item.category,
    quantity: item._sum.quantity || 0,
    orderCount: item._count.id,
    revenue: revenueMap.get(item.menuItemId || '') || 0,
  }));

  return res.json({ success: true, data });
});

// GET /api/analytics/by-category
router.get('/by-category', async (req: AuthenticatedRequest, res: Response) => {
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

  const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.query.tenantId as string : req.user!.tenantId;

  const items = await prisma.orderItem.groupBy({
    by: ['category'],
    where: {
      order: { tenantId, createdAt: { gte: dateFrom, lte: dateTo }, paymentStatus: 'PAID' },
    },
    _sum: { quantity: true, subtotal: true },
    _count: { id: true },
    orderBy: { _sum: { subtotal: 'desc' } },
  });

  const data = items.map((item: { category: string; _sum: { quantity: number | null; subtotal: number | null }; _count: { id: number } }) => ({
    category: item.category,
    orders: item._count.id,
    items: item._sum.quantity || 0,
    revenue: item._sum.subtotal || 0,
  }));

  return res.json({ success: true, data });
});

// GET /api/analytics/revenue-by-restaurant
router.get('/revenue-by-restaurant', async (req: AuthenticatedRequest, res: Response) => {
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

  const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.query.tenantId as string : req.user!.tenantId;

  const fees = await prisma.orderRestaurantFee.groupBy({
    by: ['restaurantId', 'restaurantName'],
    where: {
      order: { tenantId, createdAt: { gte: dateFrom, lte: dateTo }, paymentStatus: 'PAID' },
    },
    _sum: { total: true, subtotal: true, finalFee: true, taxServiceAmount: true, taxChargeAmount: true },
    _count: { id: true },
    orderBy: { _sum: { total: 'desc' } },
  });

  const data = fees.map((f: { restaurantId: string; restaurantName: string; _sum: { subtotal: number | null; finalFee: number | null; taxServiceAmount: number | null; taxChargeAmount: number | null; total: number | null }; _count: { id: number } }) => ({
    restaurantId: f.restaurantId,
    restaurantName: f.restaurantName,
    orders: f._count.id,
    subtotal: f._sum.subtotal || 0,
    jastipFee: f._sum.finalFee || 0,
    taxService: f._sum.taxServiceAmount || 0,
    taxCharge: f._sum.taxChargeAmount || 0,
    total: f._sum.total || 0,
  }));

  return res.json({ success: true, data });
});

export { router as analyticsRouter };