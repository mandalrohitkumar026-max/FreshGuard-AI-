import mongoose from 'mongoose';
import { checkBifrostHealth } from '../../integrations/bifrostClient';
import { checkTavilyHealth } from '../../integrations/tavilyService';
import { isMongoConnected } from '../../config/database';

export class IntegrationsService {
  async getStatus() {
    const [bifrost, tavily] = await Promise.allSettled([
      checkBifrostHealth(),
      checkTavilyHealth(),
    ]);

    const bifrostResult =
      bifrost.status === 'fulfilled'
        ? {
            status: bifrost.value.ok ? 'connected' : 'fallback_mode',
            latencyMs: bifrost.value.latencyMs,
            model: bifrost.value.model,
            message: bifrost.value.ok ? 'Bifrost AI gateway operational' : 'Bifrost proxy offline, running in resilient deterministic mode',
          }
        : { status: 'error', message: bifrost.reason?.message };

    const tavilyResult =
      tavily.status === 'fulfilled'
        ? {
            status: tavily.value.ok ? 'connected' : 'fallback_mode',
            latencyMs: tavily.value.latencyMs,
            message: tavily.value.ok ? 'Tavily live search operational' : 'Live public web retrieval fallback operational',
          }
        : { status: 'error', message: tavily.reason?.message };

    const mongoStatus = isMongoConnected() ? 'connected' : 'in_memory_mode';

    return {
      status: 'operational',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: {
        status: mongoStatus,
        driver: 'mongoose',
        host: mongoose.connection.host || 'local-in-memory',
      },
      integrations: {
        bifrost: bifrostResult,
        tavily: tavilyResult,
      },
    };
  }
}

export const integrationsService = new IntegrationsService();
