import type { FastifyInstance } from 'fastify';
import { getAssetParamsSchema, listAssetsQuerySchema } from '@stellariq/schemas';
import type { DataSource } from '../data/source.js';
import { badRequest, notFound, zodMessage } from '../errors.js';

/** Asset registry endpoints (PRD §17 assets) with pagination and search. */
export async function assetRoutes(app: FastifyInstance, source: DataSource): Promise<void> {
  app.get('/v1/assets', async (request, reply) => {
    const parsed = listAssetsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    const { search, verified, page, limit } = parsed.data;
    const result = source.listAssets({
      ...(search !== undefined ? { search } : {}),
      ...(verified !== undefined ? { verifiedOnly: verified } : {}),
      page,
      limit,
    });
    await reply.send({ data: result.data, page, limit, total: result.total });
  });

  app.get('/v1/assets/:asset', async (request, reply) => {
    const parsed = getAssetParamsSchema.safeParse(request.params);
    if (!parsed.success) {
      badRequest(reply, zodMessage(parsed.error));
      return;
    }
    const asset = source.getAsset(parsed.data.asset);
    if (asset === null) {
      notFound(reply, `Unknown asset "${parsed.data.asset}".`);
      return;
    }
    await reply.send(asset);
  });
}
