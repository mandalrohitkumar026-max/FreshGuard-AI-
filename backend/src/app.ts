import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerDocument } from './docs/swagger';

// Middleware
import { standardRateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFound } from './middleware/errorHandler';

// Modular Routes (Phase 03, 04 & 05)
import authRoutes from './modules/auth/auth.routes';
import verificationRoutes from './modules/verification/verification.routes';
import reportRoutes from './modules/reports/report.routes';
import integrationsRoutes from './modules/integrations/integrations.routes';
import aiRoutes from './modules/ai/ai.routes';
import searchRoutes from './modules/search/search.routes';
import claimRoutes from './modules/claims/claim.routes';
import freshnessRoutes from './modules/freshness/freshness.routes';
import watchesRoutes from './modules/verification/freshnessWatch.routes';
import developerRoutes from './modules/developer/developer.routes';
import scoringRoutes from './modules/scoring/scoring.routes';
import notificationRoutes from './modules/verification/notification.routes';

// System & Compatibility Routes
import healthRoutes from './routes/healthRoutes';
import verifyRoutes from './routes/verifyRoutes';
import legacyReportRoutes from './routes/reportRoutes';
import historyRoutes from './routes/historyRoutes';

export const app = express();

// ── Security Middleware ───────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI assets
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

const allowedOrigins = (env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, health checks)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      // Allow Vercel preview deploys matching regex or fallback to allowed
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Api-Key'],
  }),
);

// ── General Middleware ────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

if (env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// ── Global Rate Limiting ──────────────────────────────────────────────────
app.use('/api/', standardRateLimiter);

// ── OpenAPI / Swagger Documentation ───────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ── Phase 03, 04 & 05 Modular API Endpoints ──────────────────────────────
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/integrations', integrationsRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/verification', verificationRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/claims', claimRoutes);
app.use('/api/v1/freshness', freshnessRoutes);
app.use('/api/v1/watches', watchesRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/developer', developerRoutes);
app.use('/api/v1/scoring', scoringRoutes);

// ── Backward Compatibility Endpoints (Phase 02 Frontend Support) ─────────
app.use('/api/v1/verify', verifyRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/history', historyRoutes);

// ── 404 & Global Error Handling ──────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
