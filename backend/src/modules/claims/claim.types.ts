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

export interface TextReference {
  start: number;
  end: number;
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
  originalTextReference: TextReference;
  extractionConfidence: number;
  dependencies?: string[];
  isDuplicate?: boolean;
  duplicateOf?: string;
  order?: number;
}

export interface ClaimExtractionResponse {
  verificationId: string;
  totalClaims: number;
  factualClaimsCount: number;
  nonFactualClaimsCount: number;
  claims: ExtractedClaim[];
  originalText: string;
  model: string;
  latencyMs: number;
}

export interface ClaimExtractionOptions {
  verificationId?: string;
  userId?: string;
  topicHint?: string;
  model?: string;
  persistToDb?: boolean;
}
