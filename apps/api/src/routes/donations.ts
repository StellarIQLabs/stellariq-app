import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { DataSource } from '../data/source.js';
import { badRequest, notFound, sendError, zodMessage } from '../errors.js';
import { getDonationsReader } from '../services/donations.js';

const idParams = z.object({ id: z.coerce.number().int().positive() });
const listQuery = z.object({
  status: z.enum(['active', 'closed', 'ended']).optional(),
});
const recentQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

/**
 * StellarIQ Give endpoints. Campaign and receipt data is read live from the
 * donations contract on Soroban, so the API never becomes a second source of
 * truth for where donations went.
 */
export async function donationRoutes(app: FastifyInstance, _source: DataSource): Promise<void> {
  const unavailable = (err: unknown, reply: Parameters<typeof sendError>[0]): void => {
    app.log.error(err, 'donations contract read failed');
    sendError(
      reply,
      503,
      'Service Unavailable',
      'Could not reach the Stellar network. Retry shortly.',
    );
  };

  app.get('/v1/campaigns', async (request, reply) => {
    const parsed = listQuery.safeParse(request.query);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    try {
      const reader = getDonationsReader();
      const all = await reader.listCampaigns();
      const data = parsed.data.status ? all.filter((c) => c.status === parsed.data.status) : all;
      await reply.send({ data, total: data.length, contractId: reader.contractId });
    } catch (err: unknown) {
      unavailable(err, reply);
    }
  });

  app.get('/v1/campaigns/:id', async (request, reply) => {
    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    try {
      const campaign = await getDonationsReader().getCampaign(parsed.data.id);
      if (!campaign) {
        notFound(reply, `Unknown campaign ${parsed.data.id}.`);
        return;
      }
      await reply.send(campaign);
    } catch (err: unknown) {
      unavailable(err, reply);
    }
  });

  app.get('/v1/campaigns/:id/donations', async (request, reply) => {
    const params = idParams.safeParse(request.params);
    const query = recentQuery.safeParse(request.query);
    if (!params.success || !query.success) {
      badRequest(reply, zodMessage((params.error ?? query.error) as z.ZodError));
      return;
    }
    try {
      const data = await getDonationsReader().recentReceipts(query.data.limit, params.data.id);
      await reply.send({ data, total: data.length });
    } catch (err: unknown) {
      unavailable(err, reply);
    }
  });

  app.get('/v1/donations', async (request, reply) => {
    const query = recentQuery.safeParse(request.query);
    if (!query.success) {
      badRequest(reply, zodMessage(query.error));
      return;
    }
    try {
      const data = await getDonationsReader().recentReceipts(query.data.limit);
      await reply.send({ data, total: data.length });
    } catch (err: unknown) {
      unavailable(err, reply);
    }
  });

  app.get('/v1/donations/stats', async (_request, reply) => {
    try {
      await reply.send(await getDonationsReader().stats());
    } catch (err: unknown) {
      unavailable(err, reply);
    }
  });

  app.get('/v1/receipts/:id', async (request, reply) => {
    const parsed = idParams.safeParse(request.params);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    try {
      const receipt = await getDonationsReader().getReceipt(parsed.data.id);
      if (!receipt) {
        notFound(reply, `Unknown receipt ${parsed.data.id}.`);
        return;
      }
      await reply.send(receipt);
    } catch (err: unknown) {
      unavailable(err, reply);
    }
  });
}
