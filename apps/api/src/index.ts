import 'dotenv/config';
import { loadEnv } from './env.js';
import { buildApp } from './app.js';
import { MockDataSource } from './data/mock.js';
import { RemoteDataSource } from './data/remote.js';
import { FallbackDataSource } from './data/fallback.js';

async function main(): Promise<void> {
  const env = loadEnv();
  // With a data service configured, serve from it but fall back to the built-in
  // dataset if it is briefly unreachable (e.g. a free-tier cold start), so the
  // API never errors. Without one, serve the built-in dataset directly.
  const source = env.dataApiUrl
    ? new FallbackDataSource(
        new RemoteDataSource({ baseUrl: env.dataApiUrl }),
        new MockDataSource(),
      )
    : new MockDataSource();
  const app = await buildApp({ env, source });
  await app.listen({ host: env.host, port: env.port });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
