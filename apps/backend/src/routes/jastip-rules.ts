import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest, hasPermission } from '@jastip/auth';

const prisma = new PrismaClient();
const router: Router = Router();

// Validation schemas
const globalRuleSchema = z.object({
  type: z.enum(['PER_UNIT', 'PER_MULTIPLE', 'PER_ORDER', 'TIERED']).optional(),
  multiple: z.number().int().positive().optional(),
  fee: z.number().int().nonnegative().optional(),
  appliesTo: z.enum(['ALL', 'INCLUDE_JASTIP']).optional(),
  minOrderQty: z.number().int().positive().optional(),
  maxFee: z.number().int().nonnegative().optional().nullable(),
  isActive: z.boolean().optional(),
});

const tenantRuleSchema = z.object({
  type: z.enum(['PER_UNIT', 'PER_MULTIPLE', 'PER_ORDER', 'TIERED']).optional().nullable(),
  multiple: z.number().int().positive().optional().nullable(),
  fee: z.number().int().nonnegative().optional().nullable(),
  appliesTo: z.enum(['ALL', 'INCLUDE_JASTIP']).optional().nullable(),
  minOrderQty: z.number().int().positive().optional().nullable(),
  maxFee: z.number().int().nonnegative().optional().nullable(),
  useGlobalRule: z.boolean().optional(),
});

// GET /api/jastip-rules/global
router.get('/global', async (req: AuthenticatedRequest, res: Response) => {
  const rule = await prisma.jastipRuleGlobal.findFirst({ where: { isActive: true } });
  return res.json({ success: true, data: rule });
});

// PATCH /api/jastip-rules/global (Super Admin only)
router.patch('/global', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ success: false, error: 'Super Admin required' });
  }

  try {
    const data = globalRuleSchema.parse(req.body);

    const rule = await prisma.jastipRuleGlobal.update({
      where: { id: (await prisma.jastipRuleGlobal.findFirst({ where: { isActive: true } }))?.id || '' },
      data,
    });

    return res.json({ success: true, data: rule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

// GET /api/jastip-rules/tenant
router.get('/tenant', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.query.tenantId as string : req.user!.tenantId;

  const rule = await prisma.jastipRuleTenant.findUnique({ where: { tenantId } });
  
  // If no tenant rule, return global
  if (!rule) {
    const global = await prisma.jastipRuleGlobal.findFirst({ where: { isActive: true } });
    return res.json({ success: true, data: { ...global, useGlobalRule: true, tenantId } });
  }

  return res.json({ success: true, data: rule });
});

// PATCH /api/jastip-rules/tenant
router.patch('/tenant', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !hasPermission(req.user.role, 'rule:update')) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }

  try {
    const data = tenantRuleSchema.parse(req.body);
    const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.body.tenantId : req.user!.tenantId;

    const rule = await prisma.jastipRuleTenant.upsert({
      where: { tenantId },
      update: data,
      create: { tenantId, ...data },
    });

    return res.json({ success: true, data: rule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

export { router as jastipRuleRouter };