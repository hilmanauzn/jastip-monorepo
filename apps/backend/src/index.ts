import express, { Express, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { resolveTenantFromRequest, authenticateRequest, getHeader, AuthenticatedRequest } from '@jastip/auth';

import { authRouter } from './routes/auth';
import { tenantRouter } from './routes/tenants';
import { userRouter } from './routes/users';
import { restaurantRouter } from './routes/restaurants';
import { menuRouter } from './routes/menu';
import { orderRouter } from './routes/orders';
import { customerRouter } from './routes/customers';
import { jastipRuleRouter } from './routes/jastip-rules';
import { settingsRouter } from './routes/settings';
import { analyticsRouter } from './routes/analytics';

const app: Express = express();
export const prisma = new PrismaClient();

// Trust proxy for Fly.io
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:3000',
  'http://localhost:4000',
  'https://admin.jastip.com',
  'https://toko-a.jastip.com',
  'https://toko-b.jastip.com',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug'],
}));

// Tenant resolution middleware
app.use(async (req: AuthenticatedRequest, res, next) => {
  // 1. Try to get tenant from JWT
  const authResult = await authenticateRequest(req);
  
  // 2. If no JWT or no tenant in JWT, try header
  if (!req.tenantId) {
    const tenantSlug = getHeader(req, 'x-tenant-slug');
    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      if (tenant?.isActive) {
        req.tenantId = tenant.id;
        req.tenant = tenant;
      }
    }
  }
  
  // 3. If still no tenant, try subdomain
  if (!req.tenantId) {
    const { slug, isAdmin, isApi } = resolveTenantFromRequest(req);
    if (slug && !isAdmin && !isApi) {
      const tenant = await prisma.tenant.findUnique({ where: { slug } });
      if (tenant?.isActive) {
        req.tenantId = tenant.id;
        req.tenant = tenant;
      }
    }
  }
  
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRouter);
app.use('/api/tenants', tenantRouter);
app.use('/api/users', userRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', orderRouter);
app.use('/api/customers', customerRouter);
app.use('/api/jastip-rules', jastipRuleRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/analytics', analyticsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err.name === 'ZodError') {
    return res.status(400).json({ success: false, error: 'Validation error', details: err });
  }
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, error: 'CORS not allowed' });
  }
  
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;