import { z } from 'zod';
import { paginationQuerySchema, pairIdSchema, protocolSchema } from './common.js';

export const marketSchema = z.object({
  id: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  protocol: protocolSchema,
  poolId: z.string(),
  price: z.number().optional(),
  priceChange24h: z.number().optional(),
  volume24h: z.number().optional(),
  liquidity: z.number().optional(),
  trades24h: z.number().optional(),
  spread: z.number().optional(),
});

export const marketSourceSchema = z.object({
  protocol: protocolSchema,
  poolId: z.string(),
  price: z.number(),
  liquidity: z.number(),
  volume24h: z.number(),
});

export const aggregatedMarketSchema = z.object({
  id: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  price: z.number().optional(),
  priceChange24h: z.number().optional(),
  volume24h: z.number().optional(),
  liquidity: z.number().optional(),
  trades24h: z.number().optional(),
  spread: z.number().optional(),
  sources: z.array(marketSourceSchema),
});

export const listMarketsQuerySchema = paginationQuerySchema.extend({
  protocol: protocolSchema.optional(),
  sort: z.enum(['volume', 'liquidity', 'change']).default('volume'),
});

export const getMarketParamsSchema = z.object({
  pair: pairIdSchema,
});
