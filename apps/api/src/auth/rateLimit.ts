import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createClient, type RedisClientType } from 'redis';
import type { ApiTier } from './keys.js';
import { tooManyRequests } from '../errors.js';

/** Requests per 60s window per tier (PRD §30 monetization). */
export const TIER_LIMITS: Record<ApiTier, number> = {
  free: 60,
  developer: 600,
  pro: 6000,
  enterprise: 60000,
};

export const RATE_WINDOW_S = 60;

export interface RateStore {
  /** Increments the window counter, returning the new count and TTL seconds. */
  hit(bucket: string): Promise<{ count: number; ttl: number }>;
  close(): Promise<void>;
}

/** Fixed-window in-memory counters (default; also the Redis fallback). */
export class MemoryRateStore implements RateStore {
  private readonly windows = new Map<string, { count: number; resetAt: number }>();

  async hit(bucket: string): Promise<{ count: number; ttl: number }> {
    const now = Date.now();
    const entry = this.windows.get(bucket);
    if (!entry || now >= entry.resetAt) {
      const resetAt = now + RATE_WINDOW_S * 1000;
      this.windows.set(bucket, { count: 1, resetAt });
      return { count: 1, ttl: RATE_WINDOW_S };
    }
    entry.count += 1;
    return { count: entry.count, ttl: Math.ceil((entry.resetAt - now) / 1000) };
  }

  async close(): Promise<void> {
    this.windows.clear();
  }
}

/** Redis fixed-window counters (`siq:rl:{bucket}`). */
export class RedisRateStore implements RateStore {
  private readonly client: RedisClientType;

  constructor(client: RedisClientType) {
    this.client = client;
  }

  static async connect(url: string): Promise<RedisRateStore> {
    const client = createClient({ url });
    await client.connect();
    return new RedisRateStore(client as RedisClientType);
  }

  async hit(bucket: string): Promise<{ count: number; ttl: number }> {
    const key = `siq:rl:${bucket}`;
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, RATE_WINDOW_S);
    }
    const ttl = await this.client.ttl(key);
    return { count, ttl: ttl > 0 ? ttl : RATE_WINDOW_S };
  }

  async close(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }
}

/**
 * Tier enforcement: every request consumes from the caller's 60s budget —
 * keyed by key prefix for authenticated callers, by IP for anonymous ones —
 * and over-budget requests get a 429 with `Retry-After`.
 */
export async function registerRateLimit(app: FastifyInstance, store: RateStore): Promise<void> {
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.url === '/health' || request.url === '/ready') {
      return;
    }
    const tier: ApiTier = request.apiKey?.tier ?? 'free';
    const identity = request.apiKey ? `key:${request.apiKey.prefix}` : `ip:${request.ip}`;
    const windowId = Math.floor(Date.now() / (RATE_WINDOW_S * 1000));
    const { count, ttl } = await store.hit(`${identity}:${windowId}`);
    const limit = TIER_LIMITS[tier];
    // NOTE: reply.header() is synchronous — never await it. Fastify replies
    // are thenable, so awaiting one here would wait for a send that never
    // comes and deadlock the request.
    reply.header('x-ratelimit-limit', limit);
    reply.header('x-ratelimit-remaining', Math.max(0, limit - count));
    if (count > limit) {
      reply.header('Retry-After', ttl);
      tooManyRequests(reply, `Rate limit exceeded for the ${tier} tier (${limit}/min).`);
      return;
    }
  });
}

export async function createRateStore(
  app: FastifyInstance,
  redisUrl: string | null,
): Promise<RateStore> {
  if (!redisUrl) {
    return new MemoryRateStore();
  }
  try {
    const store = await RedisRateStore.connect(redisUrl);
    app.log.info('rate limiting with Redis counters');
    return store;
  } catch (err: unknown) {
    app.log.warn(err, 'Redis unavailable; falling back to in-memory rate limits');
    return new MemoryRateStore();
  }
}
