import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest, hasPermission } from '@jastip/auth';

const prisma = new PrismaClient();
const router: Router = Router();

// Validation schemas
const createCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
});

const updateCustomerSchema = createCustomerSchema.partial();

function requireTenantAccess(req: AuthenticatedRequest, res: Response, next: Function) {
  if (!req.user || !hasPermission(req.user.role, 'customer:read')) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }
  next();
}

router.use(requireTenantAccess);

// GET /api/customers
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;
  const skip = (page - 1) * limit;

  const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.query.tenantId as string : req.user!.tenantId;

  const where: any = { tenantId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { orders: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return res.json({
    success: true,
    data: customers,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/customers/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

  const customer = await prisma.customer.findFirst({
    where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
    include: { orders: { take: 10, orderBy: { createdAt: 'desc' } } },
  });

  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }

  return res.json({ success: true, data: customer });
});

// POST /api/customers
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = createCustomerSchema.parse(req.body);
    const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.body.tenantId : req.user!.tenantId;

    const customer = await prisma.customer.create({
      data: { ...data, tenantId },
    });

    return res.status(201).json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// PATCH /api/customers/:id
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = updateCustomerSchema.parse(req.body);
    const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

    const customer = await prisma.customer.update({
      where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) },
      data,
    });

    return res.json({ success: true, data: customer });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.tenantId;

  await prisma.customer.delete({ where: { id: req.params.id, ...(tenantId ? { tenantId } : {}) } });
  return res.json({ success: true, message: 'Customer deleted' });
});

export { router as customerRouter };