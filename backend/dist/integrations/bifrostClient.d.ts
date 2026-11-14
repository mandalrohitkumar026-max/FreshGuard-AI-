import OpenAI from 'openai';
import mongoose from 'mongoose';
import { ZodSchema } from 'zod';
export interface BifrostChatOptions {
    model?: string;
    messages: OpenAI.Chat.ChatCompletionMessageParam[];
    temperature?: number;
    maxTokens?: number;
    sessionId?: mongoose.Types.ObjectId;
    stage?: string;
}
export interface BifrostChatResult {
    content: string;
    model: string;
    usage: {
        inputTokens: number;
        outputTokens: number;
    };
    latencyMs: number;
}
/**
 * Send a chat completion request through Bifrost Gateway.
 * Falls back to deterministic engine when Bifrost local proxy is offline.
 */
export declare function bifrostChat(options: BifrostChatOptions): Promise<BifrostChatResult>;
/**
 * Parse a Bifrost response as JSON, validated by a Zod schema.
 */
export declare function bifrostChatJson<T>(options: BifrostChatOptions, schema: ZodSchema<T>): Promise<T>;
/**
 * Check whether the Bifrost gateway is reachable.
 */
export declare function checkBifrostHealth(): Promise<{
    ok: boolean;
    latencyMs: number;
    model?: string;
}>;
//# sourceMappingURL=bifrostClient.d.ts.map