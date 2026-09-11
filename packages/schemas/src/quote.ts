import { z } from 'zod';
import { assetIdSchema, protocolSchema } from './common.js';

/** `GET /v1/quote?from=&to=&amount=` — best execution for a given input. */
export const quoteQuerySchema = z.object({
  from: assetIdSchema,
  to: assetIdSchema,
  amount: z.coerce.number().positive().max(1_000_000_000),
});

export const routeStepSchema = z.object({
  protocol: protocolSchema,
  poolId: z.string(),
  inputAsset: z.string(),
  outputAsset: z.string(),
});

export const routeSchema = z.object({
  id: z.enum(['A', 'B', 'C']),
  kind: z.enum(['direct', 'multi-hop', 'split']),
  outputAmount: z.number(),
  priceImpact: z.number(),
  networkFee: z.number(),
  protocolFee: z.number(),
  steps: z.array(routeStepSchema),
  isBest: z.boolean(),
});

export const quoteResponseSchema = z.object({
  from: z.string(),
  to: z.string(),
  inputAmount: z.number(),
  outputAmount: z.number(),
  priceImpact: z.number(),
  fees: z.number(),
  routeId: z.string(),
});

/** `GET /v1/routes` — every evaluated route ranked by net output. */
export const routesQuerySchema = quoteQuerySchema;

export const routesResponseSchema = z.object({
  from: z.string(),
  to: z.string(),
  inputAmount: z.number(),
  routes: z.array(routeSchema),
  bestRouteId: z.string(),
});
