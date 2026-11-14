import mongoose, { Model } from 'mongoose';
import { PipelineStage } from '../types/verification.types';
export interface IExecutionLog {
    _id: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    stage: PipelineStage;
    provider: 'bifrost' | 'tavily' | 'internal';
    model?: string;
    inputTokens?: number;
    outputTokens?: number;
    latencyMs: number;
    status: 'SUCCESS' | 'ERROR' | 'TIMEOUT' | 'SKIPPED';
    errorCode?: string;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}
export declare const ExecutionLog: Model<IExecutionLog>;
//# sourceMappingURL=ExecutionLog.d.ts.map