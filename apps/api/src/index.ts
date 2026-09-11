import 'dotenv/config';
import { loadEnv } from './env.js';
import { buildApp } from './app.js';
import { MockDataSource } from './data/mock.js';

async function main(): Promise<void> {
  const env = loadEnv();
  // TODO(data): construct a remote DataSource against env.dataApiUrl when set.
  const source = new MockDataSource();
  const app = await buildApp({ env, source });
  await app.listen({ host: env.host, port: env.port });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
