import 'dotenv/config';
import { loadEnv } from './env.js';
import { buildApp } from './app.js';
import { MockDataSource } from './data/mock.js';
import { RemoteDataSource } from './data/remote.js';

async function main(): Promise<void> {
  const env = loadEnv();
  const source = env.dataApiUrl
    ? new RemoteDataSource({ baseUrl: env.dataApiUrl })
    : new MockDataSource();
  const app = await buildApp({ env, source });
  await app.listen({ host: env.host, port: env.port });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
