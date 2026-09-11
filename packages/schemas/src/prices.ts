import { z } from 'zod';
import { assetIdSchema, timeframeSchema } from './common.js';

export const priceSchema = z.object({
  asset: z.string(),
  price: z.number(),
  currency: z.string(),
  timestamp: z.number().int(),
  sources: z.number().int(),
  confidence: z.number().min(0).max(1),
});

export const getPriceParamsSchema = z.object({
  asset: assetIdSchema,
});

export const priceHistoryQuerySchema = z.object({
  timeframe: timeframeSchema.default('1D'),
});

export const ohlcvCandleSchema = z.object({
  timestamp: z.number().int(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number(),
});
