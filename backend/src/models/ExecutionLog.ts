import mongoose, { Document, Schema, Model } from 'mongoose';
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

const executionLogSchema = new Schema<IExecutionLog>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: 'VerificationSession', required: true, index: true },
    stage: {
      type: String,
      enum: [
        'ANSWER_PARSING', 'CLAIM_EXTRACTION', 'TIME_SENSITIVITY', 'QUERY_GENERATION',
        'TAVILY_SEARCH', 'EVIDENCE_VALIDATION', 'AI_ANALYSIS', 'SCORING',
        'RISK_CLASSIFICATION', 'CORRECTION', 'REPORT_GENERATION',
      ],
      required: true,
    },
    provider: { type: String, enum: ['bifrost', 'tavily', 'internal'], required: true },
    model: { type: String },
    inputTokens: { type: Number },
    outputTokens: { type: Number },
    latencyMs: { type: Number, required: true },
    status: {
      type: String,
      enum: ['SUCCESS', 'ERROR', 'TIMEOUT', 'SKIPPED'],
      required: true,
    },
    errorCode: { type: String },
    errorMessage: { type: String },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true },
);

// TTL index: auto-delete logs after 90 days
executionLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7_776_000 });

export const ExecutionLog: Model<IExecutionLog> =
  mongoose.models.ExecutionLog ||
  mongoose.model<IExecutionLog>(
    'ExecutionLog',
    executionLogSchema,
  );
