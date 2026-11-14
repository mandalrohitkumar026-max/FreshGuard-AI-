import mongoose from 'mongoose';
import { EvidenceSource, IEvidenceSource } from './evidence.model';
import { isMongoConnected } from '../../config/database';
import { inMemoryStore } from '../../services/sessionStore';

export class EvidenceService {
  async getEvidenceBySessionId(sessionId: string): Promise<any[]> {
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(sessionId)) {
      try {
        const evidence = await EvidenceSource.find({ sessionId }).sort({ authorityScore: -1 }).lean();
        if (evidence && evidence.length > 0) {
          return evidence;
        }
      } catch {
        // Fallback
      }
    }
    return inMemoryStore.getEvidence(sessionId);
  }

  async getEvidenceByClaimId(claimId: string): Promise<any[]> {
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(claimId)) {
      try {
        return await EvidenceSource.find({ claimId }).sort({ authorityScore: -1 }).lean();
      } catch {
        // Fallback
      }
    }
    return [];
  }
}

export const evidenceService = new EvidenceService();
