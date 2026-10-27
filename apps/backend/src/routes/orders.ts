import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest, hasPermission } from '@jastip/auth';

const prisma = new PrismaClient();
const router: Router = Router();

// Utility functions
function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${random}`;
}

function formatCurrency(amount: number, currency = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Validation schemas
const orderItemSchema = z.object({
  menuItemId: z.string().cuid().optional().nullable(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().int().positive(),
  basePrice: z.number().int().positive().optional().nullable(),
  quantity: z.number().int().positive().default(1),
  category: z.string().min(1),
  includeJastip: z.boolean().default(true),
  jastipFeeSpecial: z.number().int().nonnegative().optional().nullable(),
  selectedAddon: z.string().optional().nullable(),
  isManual: z.boolean().default(false),
});

const createOrderSchema = z.object({
  customerId: z.string().cuid().optional().nullable(),
  customerName: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  ongkir: z.number().int().nonnegative().default(0),
  destination: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  jastipOverrides: z.record(z.number().int().nonnegative()).optional(),
});

const previewOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  ongkir: z.number().int().nonnegative().default(0),
  destination: z.string().optional().nullable(),
  jastipOverrides: z.record(z.number().int().nonnegative()).optional(),
});

function requireTenantAccess(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user || !hasPermission(req.user.role, 'order:read')) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }
  next();
}

router.use(requireTenantAccess);

// GET /api/orders
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const customerId = req.query.customerId as string;
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;
  const skip = (page - 1) * limit;

  const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.query.tenantId as string : req.user!.tenantId;

  const where: any = { tenantId };
  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: true,
        restaurantFees: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return res.json({
    success: true,
    data: orders,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/orders/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

  const order = await prisma.order.findFirst({
    where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
    include: {
      customer: true,
      items: true,
      restaurantFees: true,
    },
  });

  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  return res.json({ success: true, data: order });
});

// POST /api/orders/preview
router.post('/preview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = previewOrderSchema.parse(req.body);
    const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.body.tenantId : req.user!.tenantId;

    // Get tenant jastip rule
    const tenantRule = await prisma.jastipRuleTenant.findUnique({ where: { tenantId } });
    const globalRule = await prisma.jastipRuleGlobal.findFirst({ where: { isActive: true } });

    const rule = tenantRule?.useGlobalRule === false ? tenantRule : globalRule;

    // Calculate per restaurant
    const restaurantGroups = new Map<string, typeof data.items>();
    for (const item of data.items) {
      const restId = item.menuItemId 
        ? (await prisma.menuItem.findUnique({ where: { id: item.menuItemId }, select: { restaurantId: true } }))?.restaurantId
        : 'manual';
      const key = restId || 'manual';
      if (!restaurantGroups.has(key)) restaurantGroups.set(key, []);
      restaurantGroups.get(key)!.push(item);
    }

    const restaurantFees = [];
    let subtotal = 0;
    let totalJastipFee = 0;
    let totalTaxService = 0;
    let totalTaxCharge = 0;

    for (const [restaurantId, items] of restaurantGroups) {
      const restaurant = restaurantId !== 'manual' 
        ? await prisma.restaurant.findUnique({ where: { id: restaurantId } })
        : null;

      const override = restaurant 
        ? await prisma.jastipOverride.findUnique({ where: { tenantId_restaurantId: { tenantId, restaurantId } } })
        : null;

      const restSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const qtyIncludeJastip = items.filter((i) => i.includeJastip).reduce((sum, i) => sum + i.quantity, 0);

      let jastipFee = 0;
      if (rule) {
        const fee = override?.fee ?? rule.fee ?? 0;
        const multiple = rule.multiple ?? 1;
        const appliesTo = rule.appliesTo ?? 'INCLUDE_JASTIP';
        const minOrderQty = rule.minOrderQty ?? 1;

        if (qtyIncludeJastip >= minOrderQty) {
          switch (rule.type) {
            case 'PER_UNIT':
              jastipFee = qtyIncludeJastip * fee;
              break;
            case 'PER_MULTIPLE':
              jastipFee = Math.ceil(qtyIncludeJastip / multiple) * fee;
              break;
            case 'PER_ORDER':
              jastipFee = fee;
              break;
            case 'TIERED':
              // Simplified - would need tier lookup
              jastipFee = qtyIncludeJastip * fee;
              break;
          }
        }
      }

      const taxServiceAmount = restaurant ? Math.round((restSubtotal * restaurant.taxService) / 100) : 0;
      const taxChargeAmount = restaurant ? Math.round((restSubtotal * restaurant.taxCharge) / 100) : 0;

      const finalFee = override ? override.fee : jastipFee;

      restaurantFees.push({
        restaurantId: restaurantId === 'manual' ? null : restaurantId,
        restaurantName: restaurant?.name || 'Manual Item',
        subtotal: restSubtotal,
        calculatedFee: jastipFee,
        overrideFee: override?.fee || null,
        finalFee,
        taxServiceAmount,
        taxChargeAmount,
        total: restSubtotal + finalFee + taxServiceAmount + taxChargeAmount,
        totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
        qtyIncludeJastip,
        multiple: rule?.multiple || 1,
        batches: rule?.type === 'PER_MULTIPLE' ? Math.ceil(qtyIncludeJastip / (rule.multiple || 1)) : 0,
        hasMultipleWarning: false,
      });

      subtotal += restSubtotal;
      totalJastipFee += finalFee;
      totalTaxService += taxServiceAmount;
      totalTaxCharge += taxChargeAmount;
    }

    const grandTotal = subtotal + totalJastipFee + totalTaxService + totalTaxCharge + data.ongkir;

    return res.json({
      success: true,
      data: {
        subtotal,
        jastipFeeTotal: totalJastipFee,
        taxServiceTotal: totalTaxService,
        taxChargeTotal: totalTaxCharge,
        ongkir: data.ongkir,
        grandTotal,
        restaurantFees,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// POST /api/orders
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.body.tenantId : req.user!.tenantId;

    // Use preview logic to calculate fees
    const previewData = { ...data, tenantId };
    const previewRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/orders/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: req.headers.authorization || '' },
      body: JSON.stringify(previewData),
    });
    const preview: any = await previewRes.json();

    if (!preview.success) {
      return res.status(400).json({ success: false, error: 'Preview calculation failed' });
    }

    const calc = preview.data;

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: data.customerId,
        customerName: data.customerName,
        status: 'DRAFT',
        subtotal: calc.subtotal,
        jastipFeeTotal: calc.jastipFeeTotal,
        taxServiceTotal: calc.taxServiceTotal,
        taxChargeTotal: calc.taxChargeTotal,
        grandTotal: calc.grandTotal,
        ongkir: data.ongkir,
        destination: data.destination,
        notes: data.notes,
        paymentStatus: 'UNPAID',
        tenantId,
        items: { create: data.items.map((i) => ({ ...i, subtotal: i.price * i.quantity })) },
        restaurantFees: { create: calc.restaurantFees },
      },
      include: { items: true, restaurantFees: true, customer: true },
    });

    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({ status: z.enum(['DRAFT', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']) });
  const { status } = schema.parse(req.body);

  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

  const order = await prisma.order.update({
    where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
    data: { status },
    include: { items: true, restaurantFees: true },
  });

  return res.json({ success: true, data: order });
});

// PATCH /api/orders/:id/payment
router.patch('/:id/payment', async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({ paymentStatus: z.enum(['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED']) });
  const { paymentStatus } = schema.parse(req.body);

  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

  const order = await prisma.order.update({
    where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
    data: { paymentStatus },
    include: { items: true, restaurantFees: true },
  });

  return res.json({ success: true, data: order });
});

// DELETE /api/orders/:id (soft delete)
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

  await prisma.order.update({
    where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
    data: { status: 'CANCELLED' },
  });

  return res.json({ success: true, message: 'Order cancelled' });
});

export { router as orderRouter };