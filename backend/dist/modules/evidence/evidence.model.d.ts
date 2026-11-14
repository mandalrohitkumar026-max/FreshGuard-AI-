import mongoose, { Document, Model } from 'mongoose';
import { AuthorityTier } from '../../types/verification.types';
export interface IEvidenceSource extends Document {
    _id: mongoose.Types.ObjectId;
    claimId: mongoose.Types.ObjectId;
    sessionId: mongoose.Types.ObjectId;
    url: string;
    title: string;
    content: string;
    domain: string;
    tavilyScore: number;
    authorityScore: number;
    authorityTier: AuthorityTier;
    publishedDate?: Date;
    ageInDays?: number;
    usedInAnalysis: boolean;
    createdAt: Date;
}
export declare const EvidenceSource: Model<IEvidenceSource>;
//# sourceMappingURL=evidence.model.d.ts.map