import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';

async function bootstrap(): Promise<void> {
  // 1. Start HTTP server first so endpoints are accessible
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 FreshGuard AI API running on port ${env.PORT}`, {
      port: env.PORT,
      env: env.NODE_ENV,
      bifrostUrl: env.BIFROST_BASE_URL,
    });
    logger.info(`📋 Health check: http://localhost:${env.PORT}/api/v1/health`);
  });

  // 2. Connect to MongoDB gracefully (non-fatal if local mongod is not yet started)
  try {
    await connectDB();
  } catch (err) {
    logger.warn('⚠️ MongoDB connection could not be established immediately. Start MongoDB or configure MONGODB_URI in backend/.env', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // 3. Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      const { freshnessWatchService } = await import('./modules/verification/freshnessWatchService');
      freshnessWatchService.stopScheduler();
      const { disconnectDB } = await import('./config/db');
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection', { reason });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  });
}

bootstrap();
