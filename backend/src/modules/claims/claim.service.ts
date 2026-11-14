import mongoose from 'mongoose';
import { Claim, IClaim } from './claim.model';
import { isMongoConnected } from '../../config/database';
import { inMemoryStore } from '../../services/sessionStore';
import { ApiError } from '../../utils/ApiError';

export class ClaimService {
  async getClaimsBySessionId(sessionId: string): Promise<any[]> {
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(sessionId)) {
      try {
        const claims = await Claim.find({ sessionId }).sort({ order: 1 }).lean();
        if (claims && claims.length > 0) {
          return claims;
        }
      } catch {
        // Fallback to in-memory store
      }
    }

    return inMemoryStore.getClaims(sessionId);
  }

  async getClaimById(claimId: string): Promise<any | null> {
    if (isMongoConnected() && mongoose.Types.ObjectId.isValid(claimId)) {
      try {
        const claim = await Claim.findById(claimId).lean();
        if (claim) return claim;
      } catch {
        // Fallback
      }
    }

    // Search across in-memory sessions
    return null;
  }
}

export const claimService = new ClaimService();
