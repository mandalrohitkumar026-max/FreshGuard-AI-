import mongoose from 'mongoose';
import { Response } from 'express';
export declare function sendSSE(res: Response, event: object): void;
/**
 * Verification Service — The 12-Stage Pipeline Orchestrator
 *
 * Runs the complete verification pipeline for a session.
 * Sends SSE progress events to the client at each stage.
 * Seamlessly supports both MongoDB and high-availability in-memory store.
 */
export declare function runVerificationPipeline(sessionId: mongoose.Types.ObjectId | string, userId: mongoose.Types.ObjectId | string, answerText: string, context: {
    topic?: string;
    sourceModel?: string;
} | undefined, res: Response): Promise<void>;
//# sourceMappingURL=verificationService.d.ts.map