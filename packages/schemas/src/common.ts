import { z } from 'zod';

/** Liquidity source filter shared by catalog endpoints. */
export const protocolSchema = z.enum(['stellar-dex', 'soroswap', 'phoenix', 'aqua']);

/** Chart / analytics timeframe selector. */
export const timeframeSchema = z.enum(['1H', '4H', '1D', '1W', '1M']);

export const verificationStatusSchema = z.enum(['verified', 'unverified', 'suspicious']);

/** `?page=&limit=` pagination, capped to protect the data layer. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Canonical asset id, e.g. `XLM` or `USDC:<issuer>`. */
export const assetIdSchema = z.string().min(1).max(120);

/** Canonical pair id, e.g. `XLM/USDC`. */
export const pairIdSchema = z
  .string()
  .min(3)
  .max(241)
  .regex(/^[^/]+\/[^/]+$/, 'pair must look like BASE/QUOTE');

/** Consistent error envelope (PRD §29 request validation). */
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
});
