import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthenticatedRequest, hasPermission } from '@jastip/auth';

const prisma = new PrismaClient();
const router: Router = Router();

const updateSettingsSchema = z.object({
  shopName: z.string().optional(),
  tagline: z.string().optional(),
  bankAccounts: z.array(z.object({ bank: z.string(), number: z.string(), name: z.string() })).optional(),
  qrisImageUrl: z.string().url().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});

// GET /api/settings
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.query.tenantId as string : req.user!.tenantId;

  const settings = await prisma.settings.findUnique({ where: { tenantId } });
  
  if (!settings) {
    return res.status(404).json({ success: false, error: 'Settings not found' });
  }

  return res.json({
    success: true,
    data: {
      ...settings,
      bankAccounts: JSON.parse(settings.bankAccounts || '[]'),
    },
  });
});

// PATCH /api/settings
router.patch('/', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || !hasPermission(req.user.role, 'settings:update')) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }

  try {
    const data = updateSettingsSchema.parse(req.body);
    const tenantId = req.user!.role === 'SUPER_ADMIN' ? req.body.tenantId : req.user!.tenantId;

    const updateData: any = { ...data };
    if (data.bankAccounts) updateData.bankAccounts = JSON.stringify(data.bankAccounts);

    const settings = await prisma.settings.upsert({
      where: { tenantId },
      update: updateData,
      create: { tenantId, ...updateData },
    });

    return res.json({
      success: true,
      data: { ...settings, bankAccounts: JSON.parse(settings.bankAccounts || '[]') },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    throw error;
  }
});

export { router as settingsRouter };