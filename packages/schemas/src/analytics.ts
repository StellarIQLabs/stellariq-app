import { z } from 'zod';
import { assetIdSchema, timeframeSchema } from './common.js';

/** `GET /v1/analytics/volume` and `/v1/analytics/liquidity`. */
export const analyticsQuerySchema = z.object({
  timeframe: timeframeSchema.default('1D'),
  asset: assetIdSchema.optional(),
  protocol: z.string().max(32).optional(),
});

export const analyticsPointSchema = z.object({
  timestamp: z.number().int(),
  value: z.number(),
});

export const analyticsResponseSchema = z.object({
  metric: z.enum(['volume', 'liquidity']),
  timeframe: timeframeSchema,
  points: z.array(analyticsPointSchema),
});
