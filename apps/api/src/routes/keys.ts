import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { API_TIERS, type KeyStore } from '../auth/keys.js';
import type { ApiEnv } from '../env.js';
import { badRequest, notFound, sendError, zodMessage } from '../errors.js';

const issueSchema = z.object({
  name: z.string().min(1).max(80),
  tier: z.enum(API_TIERS),
});

/**
 * Key issuance and revocation endpoints, guarded by the admin token. Absent
 * `ADMIN_TOKEN` means all mutation endpoints are disabled (403) — keys are
 * then provisioned out of band.
 */
export async function keyRoutes(app: FastifyInstance, keys: KeyStore, env: ApiEnv): Promise<void> {
  app.post('/v1/keys', async (request, reply) => {
    const admin = request.headers['x-admin-token'];
    if (!env.adminToken || admin !== env.adminToken) {
      sendError(reply, 403, 'Forbidden', 'Key issuance is disabled on this instance.');
      return;
    }
    const parsed = issueSchema.safeParse(request.body);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    const issued = keys.issue(parsed.data.name, parsed.data.tier);
    await reply.status(201).send({
      key: issued.key,
      id: issued.record.id,
      prefix: issued.record.prefix,
      name: issued.record.name,
      tier: issued.record.tier,
      createdAt: issued.record.createdAt,
    });
  });

  app.delete('/v1/keys/:id', async (request, reply) => {
    const admin = request.headers['x-admin-token'];
    if (!env.adminToken || admin !== env.adminToken) {
      sendError(reply, 403, 'Forbidden', 'Key management is disabled on this instance.');
      return;
    }
    const id = (request.params as { id?: string }).id;
    if (!id) {
      badRequest(reply, 'Missing key id.');
      return;
    }
    const revoked = keys.revoke(id);
    if (!revoked) {
      notFound(reply, `Key "${id}" not found or already revoked.`);
      return;
    }
    await reply.send({ id, revoked: true });
  });

  app.get('/v1/keys', async (request, reply) => {
    const admin = request.headers['x-admin-token'];
    if (!env.adminToken || admin !== env.adminToken) {
      sendError(reply, 403, 'Forbidden', 'Key listing is disabled on this instance.');
      return;
    }
    const records = keys.list();
    await reply.send({
      data: records.map((r) => ({
        id: r.id,
        prefix: r.prefix,
        name: r.name,
        tier: r.tier,
        createdAt: r.createdAt,
        revokedAt: r.revokedAt,
      })),
      total: records.length,
    });
  });
}
