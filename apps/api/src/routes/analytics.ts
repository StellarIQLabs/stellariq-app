import type { FastifyInstance } from 'fastify';
import { analyticsQuerySchema } from '@stellariq/schemas';
import type { DataSource } from '../data/source.js';
import { badRequest, zodMessage } from '../errors.js';

/** Network analytics endpoints (PRD §17 analytics) with timeframe params. */
export async function analyticsRoutes(app: FastifyInstance, source: DataSource): Promise<void> {
  app.get('/v1/analytics/volume', async (request, reply) => {
    const parsed = analyticsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    await reply.send({
      metric: 'volume',
      timeframe: parsed.data.timeframe,
      points: source.volumeSeries(parsed.data.timeframe),
    });
  });

  app.get('/v1/analytics/liquidity', async (request, reply) => {
    const parsed = analyticsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    await reply.send({
      metric: 'liquidity',
      timeframe: parsed.data.timeframe,
      points: source.liquiditySeries(parsed.data.asset, parsed.data.timeframe),
    });
  });
}
