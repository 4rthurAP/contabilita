import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

const TOKEN_BLACKLIST_PREFIX = 'token:blacklist:';

@Injectable()
export class TokenBlacklistService {
  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async blacklist(token: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(`${TOKEN_BLACKLIST_PREFIX}${token}`, '1', 'EX', ttlSeconds);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.redis.get(`${TOKEN_BLACKLIST_PREFIX}${token}`);
    return result !== null;
  }
}
