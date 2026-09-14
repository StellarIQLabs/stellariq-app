import type { FastifyInstance } from 'fastify';
import { quoteQuerySchema } from '@stellariq/schemas';
import type { DataSource } from '../data/source.js';
import { badRequest, notFound, zodMessage } from '../errors.js';
import { evaluateRoutes, toQuote } from '../services/routing.js';

/** Best-execution quote orchestration (PRD §17 quotes). */
export async function quoteRoutes(app: FastifyInstance, source: DataSource): Promise<void> {
  app.get('/v1/quote', async (request, reply) => {
    const parsed = quoteQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    const { from, to, amount } = parsed.data;
    const routes = await evaluateRoutes(source, from, to, amount);
    const quote = toQuote(from, to, amount, routes);
    if (quote === null) {
      notFound(reply, `No route available for ${from} → ${to}.`);
      return;
    }
    await reply.send(quote);
  });
}
