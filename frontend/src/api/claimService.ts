import apiClient from './apiClient';
import { ApiResponse } from '../types/api.types';

export type ClaimType =
  | 'FACTUAL'
  | 'OPINION'
  | 'PREDICTION'
  | 'RECOMMENDATION'
  | 'HYPOTHETICAL'
  | 'QUESTION'
  | 'INSTRUCTION';

export type ClaimCategory =
  | 'TECHNOLOGY'
  | 'BUSINESS'
  | 'FINANCE'
  | 'GOVERNMENT'
  | 'EDUCATION'
  | 'HISTORY'
  | 'SCIENCE'
  | 'GENERAL';

export type EntityType =
  | 'PERSON'
  | 'ORGANIZATION'
  | 'COMPANY'
  | 'PRODUCT'
  | 'SOFTWARE'
  | 'TECHNOLOGY'
  | 'LOCATION'
  | 'DATE'
  | 'CURRENCY'
  | 'NUMERICAL_VALUE'
  | 'REGULATION'
  | 'OTHER';

export interface ExtractedEntity {
  text: string;
  type: EntityType;
}

export interface NumericalValue {
  value: string;
  unit?: string;
}

export interface ExtractedClaim {
  claimId: string;
  claimText: string;
  claimType: ClaimType;
  category: ClaimCategory;
  entities: ExtractedEntity[];
  dates: string[];
  numericalValues: NumericalValue[];
  context: string;
  originalTextReference: {
    start: number;
    end: number;
  };
  extractionConfidence: number;
  dependencies?: string[];
  isDuplicate?: boolean;
  duplicateOf?: string;
  order?: number;
}

export interface ClaimExtractionResult {
  verificationId: string;
  totalClaims: number;
  factualClaimsCount: number;
  nonFactualClaimsCount: number;
  claims: ExtractedClaim[];
  originalText: string;
  model: string;
  latencyMs: number;
}

export const claimService = {
  /**
   * Extract atomic claims with entities, categories, and temporal markers from an AI answer.
   */
  async extractClaims(params: {
    answer: string;
    verificationId?: string;
    topicHint?: string;
    model?: string;
  }): Promise<ClaimExtractionResult> {
    const res = await apiClient.post<ApiResponse<ClaimExtractionResult>>(
      '/claims/extract',
      params,
    );
    return res.data?.data || (res.data as any);
  },

  /**
   * Retrieve extracted claims for a verification session.
   */
  async getClaimsByVerification(
    verificationId: string,
  ): Promise<{ verificationId: string; totalClaims: number; claims: ExtractedClaim[] }> {
    const res = await apiClient.get<ApiResponse<any>>(
      `/claims/verification/${verificationId}`,
    );
    return res.data?.data || (res.data as any);
  },
};
