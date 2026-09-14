import type { FastifyInstance } from 'fastify';
import { routesQuerySchema } from '@stellariq/schemas';
import type { DataSource } from '../data/source.js';
import { badRequest, notFound, zodMessage } from '../errors.js';
import { evaluateRoutes, toRoutesResponse } from '../services/routing.js';

/** Ranked route evaluation (PRD §17 routes). */
export async function routeRoutes(app: FastifyInstance, source: DataSource): Promise<void> {
  app.get('/v1/routes', async (request, reply) => {
    const parsed = routesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    const { from, to, amount } = parsed.data;
    const routes = await evaluateRoutes(source, from, to, amount);
    if (routes.length === 0) {
      notFound(reply, `No routes available for ${from} → ${to}.`);
      return;
    }
    await reply.send(toRoutesResponse(from, to, amount, routes));
  });
}
