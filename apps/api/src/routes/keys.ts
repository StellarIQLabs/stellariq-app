import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { API_TIERS, type KeyStore } from '../auth/keys.js';
import type { ApiEnv } from '../env.js';
import { badRequest, sendError, zodMessage } from '../errors.js';

const issueSchema = z.object({
  name: z.string().min(1).max(80),
  tier: z.enum(API_TIERS),
});

/**
 * Key issuance endpoint, guarded by the admin token. Absent `ADMIN_TOKEN`
 * means issuance is disabled (403) — keys are then provisioned out of band.
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
}
