import { z } from 'zod';
import { paginationQuerySchema, protocolSchema } from './common.js';

export const poolSchema = z.object({
  id: z.string(),
  protocol: protocolSchema,
  tokenA: z.string(),
  tokenB: z.string(),
  reserveA: z.number(),
  reserveB: z.number(),
  tvl: z.number(),
  fee: z.number().min(0).max(1),
  volume24h: z.number().optional(),
  volumeTvlRatio: z.number().optional(),
  liquidityChange7d: z.number().optional(),
  tradeCount24h: z.number().optional(),
  estimatedPriceImpact: z.number().optional(),
});

export const listPoolsQuerySchema = paginationQuerySchema.extend({
  protocol: protocolSchema.optional(),
  sort: z.enum(['tvl', 'volume']).default('tvl'),
});

export const getPoolParamsSchema = z.object({
  pool: z.string().min(1).max(120),
});
