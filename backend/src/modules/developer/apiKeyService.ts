import crypto from 'crypto';
import { logger } from '../../config/logger';

export interface DeveloperApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  userId: string;
  rateLimitPerMinute: number;
  lastUsedAt?: string;
  createdAt: string;
  revoked: boolean;
}

export class ApiKeyService {
  private keys: Map<string, DeveloperApiKey> = new Map(); // keyHash -> DeveloperApiKey
  private rawKeyStore: Map<string, string> = new Map(); // id -> rawKey for demo retrieval

  constructor() {
    // Seed default developer test key for hackathon evaluation
    this.seedDefaultKey();
  }

  private hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  private seedDefaultKey() {
    const rawDemoKey = 'fg_live_demo_hackathon2026';
    const hash = this.hashKey(rawDemoKey);
    const id = 'key-demo-2026';

    const keyObj: DeveloperApiKey = {
      id,
      name: 'Hackathon 2026 Evaluation Key',
      keyPrefix: 'fg_live_demo',
      keyHash: hash,
      userId: '000000000000000000000001',
      rateLimitPerMinute: 60,
      createdAt: new Date().toISOString(),
      revoked: false,
    };

    this.keys.set(hash, keyObj);
    this.rawKeyStore.set(id, rawDemoKey);
  }

  generateKey(userId: string, name: string): { key: DeveloperApiKey; rawKey: string } {
    const randomHex = crypto.randomBytes(20).toString('hex');
    const rawKey = `fg_live_${randomHex}`;
    const hash = this.hashKey(rawKey);
    const id = `key-${Date.now()}`;

    const keyObj: DeveloperApiKey = {
      id,
      name: name || 'Default Developer Key',
      keyPrefix: rawKey.slice(0, 15) + '...',
      keyHash: hash,
      userId,
      rateLimitPerMinute: 60,
      createdAt: new Date().toISOString(),
      revoked: false,
    };

    this.keys.set(hash, keyObj);
    this.rawKeyStore.set(id, rawKey);

    logger.info('Developer API key generated', { id, prefix: keyObj.keyPrefix });
    return { key: keyObj, rawKey };
  }

  validateKey(rawKey: string): DeveloperApiKey | null {
    if (!rawKey) return null;
    const hash = this.hashKey(rawKey.trim());
    const keyObj = this.keys.get(hash);

    if (!keyObj || keyObj.revoked) {
      return null;
    }

    keyObj.lastUsedAt = new Date().toISOString();
    return keyObj;
  }

  listKeys(userId: string): Array<Omit<DeveloperApiKey, 'keyHash'>> {
    return Array.from(this.keys.values())
      .filter((k) => k.userId === userId && !k.revoked)
      .map(({ keyHash, ...rest }) => rest);
  }

  revokeKey(id: string, userId: string): boolean {
    for (const [hash, key] of this.keys.entries()) {
      if (key.id === id && key.userId === userId) {
        key.revoked = true;
        this.keys.set(hash, key);
        logger.info('Developer API key revoked', { id });
        return true;
      }
    }
    return false;
  }
}

export const apiKeyService = new ApiKeyService();
