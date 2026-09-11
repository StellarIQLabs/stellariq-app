import { z } from 'zod';
import { assetIdSchema, paginationQuerySchema, protocolSchema } from './common.js';

export const swapSchema = z.object({
  id: z.string(),
  transactionHash: z.string(),
  protocol: protocolSchema,
  pool: z.string(),
  user: z.string(),
  inputAsset: z.string(),
  outputAsset: z.string(),
  inputAmount: z.number(),
  outputAmount: z.number(),
  timestamp: z.number().int(),
  isLarge: z.boolean().optional(),
});

export const listSwapsQuerySchema = paginationQuerySchema.extend({
  asset: assetIdSchema.optional(),
  protocol: protocolSchema.optional(),
  pool: z.string().max(120).optional(),
});

export const recentSwapsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  asset: assetIdSchema.optional(),
  protocol: protocolSchema.optional(),
});
