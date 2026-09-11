import { z } from 'zod';
import { assetIdSchema, paginationQuerySchema, verificationStatusSchema } from './common.js';

export const assetSchema = z.object({
  id: z.string(),
  code: z.string(),
  issuer: z.string().nullable(),
  name: z.string(),
  decimals: z.number().int().min(0).max(18),
  verificationStatus: verificationStatusSchema,
  createdAt: z.string(),
  price: z.number().optional(),
  volume24h: z.number().optional(),
  liquidity: z.number().optional(),
});

export const assetWithMarketSchema = assetSchema.extend({
  priceChange24h: z.number().optional(),
  markets: z.array(z.string()).optional(),
});

export const listAssetsQuerySchema = paginationQuerySchema.extend({
  search: z.string().max(120).optional(),
  verified: z.coerce.boolean().optional(),
});

export const getAssetParamsSchema = z.object({
  asset: assetIdSchema,
});

export const assetListResponseSchema = z.object({
  data: z.array(assetSchema),
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
});
