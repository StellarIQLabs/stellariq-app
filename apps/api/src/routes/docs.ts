import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { buildOpenApiDocument } from '../openapi.js';

const require = createRequire(import.meta.url);
const swaggerRoot = dirname(require.resolve('swagger-ui-dist/package.json'));

function docsHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>StellarIQ API Docs</title>
  <link rel="stylesheet" href="/docs-assets/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/docs-assets/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({ url: '/openapi.json', dom_id: '#swagger-ui' });
    };
  </script>
</body>
</html>`;
}

/** OpenAPI JSON plus Swagger UI (PRD §17 developer API as a first-class product). */
export async function docsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/openapi.json', async (_request, reply) => {
    await reply.send(buildOpenApiDocument());
  });

  await app.register(fastifyStatic, {
    root: join(swaggerRoot),
    prefix: '/docs-assets/',
    decorateReply: false,
  });

  app.get('/docs', async (_request, reply) => {
    await reply.type('text/html').send(docsHtml());
  });
}
