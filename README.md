# StellarIQ Give - web app, API and SDK

**StellarIQ Give** makes charity donations on Stellar transparent. Donors give
to a campaign from their own wallet, the money goes straight to the charity's
wallet in the same transaction, and every donation leaves a public receipt on
chain that anyone can check.

This repo holds the user-facing product: the Next.js web app, the Fastify API
that reads campaigns and receipts from the donations contract, the TypeScript
SDK, and the shared design system. The market data, pool analytics and swap
router pages are still here: they power converting a donor's asset into the
token a charity accepts.

## Live demo

| Resource                           | Link                                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Web app**                        | https://stellariq-web.vercel.app                                                                                               |
| **API docs (Swagger UI)**          | https://stellariq-api-p1hz.onrender.com/docs                                                                                   |
| **API health**                     | https://stellariq-api-p1hz.onrender.com/health                                                                                 |
| **Campaigns API**                  | https://stellariq-api-p1hz.onrender.com/v1/campaigns                                                                           |
| **Donations contract (testnet)**   | [`CBCHKIDR...F2KX`](https://stellar.expert/explorer/testnet/contract/CBCHKIDRFJ4KO2DGJEP75NJPYN65YVD6QOVVHC5IU7PRTHGHW75OF2KX) |
| **Swap router contract (testnet)** | [`CC277AA6...VHSP`](https://stellar.expert/explorer/testnet/contract/CC277AA6E6WZIQRA4N45TQ3O6VV5MUSDMRZCNHO43QENMYXV6E5OVHSP) |

### Try a donation in 2 minutes

1. Install the [Freighter](https://www.freighter.app/) browser wallet and switch it to **Testnet**.
2. Open the web app and pick a campaign (the seeded ones are labelled "Demo").
3. Click **Connect Freighter to donate**, then **Get test XLM for this wallet** (Friendbot).
4. Choose an amount, add a message if you like, click **Donate** and approve in Freighter.
5. You land on your on-chain receipt. The campaign total and donor count update right away.

No wallet? `curl https://stellariq-api-p1hz.onrender.com/v1/campaigns` shows the
live on-chain data, and the contract repo explains how to donate from the CLI.

> The API runs on Render's free tier. A scheduled job keeps it awake, but if it
> has slept the first request can take up to a minute.

## Repository layout

```
stellariq-app/
├── apps/
│   ├── web/            # Next.js 14 dashboard (App Router)
│   └── api/            # Fastify REST + WebSocket API
├── packages/
│   ├── types/          # Shared domain types (Asset, Market, Pool, Swap, Price, Quote…)
│   ├── schemas/        # Zod request/response schemas (validation at the edge)
│   ├── ui/             # Design system: Tailwind tokens, primitives, charts, Storybook
│   └── sdk/            # Typed REST + WebSocket client for wallets, bots, agents
├── tests/
│   └── e2e/            # Playwright end-to-end suite (boots API + web)
└── .github/workflows/  # CI: quality, tests, build, e2e, images
```

Sibling repos: `stellariq-data` (data & intelligence - indexer, price engine,
analytics, routing; this API mocks it behind a `DataSource` seam until its API
lands), `stellariq-contract` (standalone Soroban contracts & deploy scripts), and
`stellariq-infra` (cloud, DB, K8s, CI/CD, image deployment).

## Prerequisites

| Tool               | Version                             | Notes                                                       |
| ------------------ | ----------------------------------- | ----------------------------------------------------------- |
| Node.js            | ≥ 20                                |                                                             |
| pnpm               | ≥ 9 (`packageManager: pnpm@9.15.9`) | via corepack shims or standalone install                    |
| Docker             | optional                            | image builds only; daemon not needed for dev                |
| Redis / PostgreSQL | optional                            | API degrades to in-memory counters + mock data without them |

## Quickstart

```bash
pnpm install

# Terminal 1 - API (http://localhost:4000, ws at /ws)
pnpm dev:api            # or: pnpm --filter @stellariq/api dev

# Terminal 2 - web (http://localhost:3000)
pnpm dev:web
```

Copy env templates first: root `.env.example`, `apps/web/.env.example`
(`NEXT_PUBLIC_*`), `apps/api/.env.example`. Every service fails fast with a
clear message when required config is missing.

## Scripts

Root (`pnpm <script>`):

| Script                        | What it does                                                               |
| ----------------------------- | -------------------------------------------------------------------------- |
| `build`                       | `pnpm -r build` - topological builds of all workspaces                     |
| `lint` / `typecheck` / `test` | recursive gates (`--if-present`)                                           |
| `test:e2e`                    | Playwright suite in `tests/e2e` (boots API + production web automatically) |
| `format` / `format:check`     | Prettier write/check                                                       |
| `dev:web` / `dev:api`         | focused dev servers                                                        |

Per workspace: `apps/web` (`dev`, `build`, `start`, `typecheck`, `lint`,
`test` = `vitest run`, `test:watch`), `apps/api` (`dev` via `tsx watch`,
`build`, `start` = `node dist/index.js`, `typecheck`, `lint`,
`test` = `node --import tsx --test`), `packages/*` (`build`, `typecheck`,
`lint`; `ui` adds `storybook`/`build-storybook`, `sdk` adds `test`). Contracts are in `StellarIQLabs/stellariq-contract`.

## Web dashboard (`apps/web`)

Next.js App Router + Tailwind (preset shared from `@stellariq/ui`) +
`lightweight-charts` for OHLCV.

| Route                         | Page                                                                                                                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                           | StellarIQ Give home: giving totals, open campaigns, latest donations                                                                                                 |
| `/campaigns/[id]`             | Campaign progress, verification links, donation feed and the Freighter donate form                                                                                   |
| `/receipts/[id]`              | Public on-chain donation receipt                                                                                                                                     |
| `/overview`                   | DeFi overview: network totals, top markets, top pools, live whale-swap feed                                                                                          |
| `/assets`, `/assets/[asset]`  | Searchable registry (code, issuer, verification badge, price) + asset intelligence                                                                                   |
| `/markets`, `/markets/[pair]` | Volume-sorted catalog + detail (price header, timeframe tabs, OHLCV, volume/liquidity history, trades)                                                               |
| `/pools`, `/pools/[pool]`     | Protocol-filtered catalog + detail (reserves, TVL, fees, volume/TVL, price impact, 7-day note)                                                                       |
| `/swap`                       | Swap terminal: validated input → debounced quotes → best execution → route comparison → impact/fee breakdown → review modal → Freighter sign → submit → confirmation |

Global shell (header, sidebar, mobile drawer, breadcrumbs, footer) wraps every
page; `loading.tsx` / `error.tsx` / `not-found.tsx` cover async states.
Private keys never touch the app - signing happens exclusively in the wallet.

## API (`apps/api`)

Fastify 5 + Zod validation, consistent `{ error, message, statusCode }`
envelopes, CORS, Helmet, global input sanitization, per-tier rate limits
(`Retry-After` + `x-ratelimit-*` headers), optional `x-api-key` auth
(anonymous = free tier; invalid keys get 401).

| Method & path                                              | Description                                                                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `GET /health`, `GET /ready`                                | Liveness; readiness probing the data layer (503 when down)                                                     |
| `GET /v1/campaigns`, `GET /v1/campaigns/{id}`              | Campaigns read live from the donations contract (`status=active\|ended\|closed`)                               |
| `GET /v1/campaigns/{id}/donations`, `GET /v1/donations`    | Latest donation receipts, per campaign or across all campaigns                                                 |
| `GET /v1/receipts/{id}`                                    | One donation receipt                                                                                           |
| `GET /v1/donations/stats`                                  | Total raised, donations, donors, active campaigns                                                              |
| `GET /v1/assets`, `GET /v1/assets/{asset}`                 | Registry with `search`, `verified`, pagination                                                                 |
| `GET /v1/prices/{asset}`, `GET /v1/prices/{asset}/history` | Aggregated price (confidence, timestamp, sources) + OHLCV (`timeframe=1H\|4H\|1D\|1W\|1M`)                     |
| `GET /v1/markets`, `GET /v1/markets/{pair}`                | Catalog (`protocol`, `sort`) + aggregated cross-protocol pair view                                             |
| `GET /v1/pools`, `GET /v1/pools/{pool}`                    | Catalog + reserves/TVL/fees/analytics                                                                          |
| `GET /v1/swaps`, `GET /v1/swaps/recent`                    | Paginated + latest swaps (`asset`, `protocol`, `pool` filters)                                                 |
| `GET /v1/quote?from=&to=&amount=`                          | Best execution from the routing engine (constant-product direct / multi-hop / split, ranked by **net output**) |
| `GET /v1/routes`                                           | All evaluated routes with steps, impact and fees                                                               |
| `GET /v1/analytics/volume`, `GET /v1/analytics/liquidity`  | Time-bucketed series                                                                                           |
| `POST /v1/keys`                                            | Key issuance (guarded by `ADMIN_TOKEN`; disabled without it)                                                   |
| `GET /openapi.json`, `GET /docs`                           | OpenAPI 3.0 spec + Swagger UI (offline bundle)                                                                 |

WebSocket (`/ws`, JSON `{ action, channel }`): `socket.subscribe("XLM/USDC:price")`
(also `:trades`, `:liquidity`) → `price_update` / `trade_update` /
`liquidity_update` events, `subscribed`/`unsubscribed` acks, protocol ping plus
`{ action: "ping" }` → `{ type: "pong" }`.

### Tiers & limits (requests/minute)

`free` 60 · `developer` 600 · `pro` 6000 · `enterprise` 60000. Counters live in
Redis when `REDIS_URL` is set, otherwise in memory with a startup warning.

### Data seam

Route handlers depend only on the `DataSource` interface
(`apps/api/src/data/source.ts`). `MockDataSource` serves deterministic seed
data (XLM/USDC/EURC/AQUA, 6 markets, 6 pools, 24 swaps); point it at the real
`stellariq-data` API when that lands (`DATA_API_URL`, marked `TODO(data)` in code).

## Packages

- **`@stellariq/types`** - `Asset`, `AssetWithMarket`, `Market`,
  `AggregatedMarket`, `Pool`, `Swap`, `Price`, `Quote`, `SwapRoute`,
  `RoutesResponse`, `Protocol`, `Timeframe`, `OhlcvCandle`, pagination/error/WS
  shapes. Imported by web and api.
- **`@stellariq/schemas`** - Zod schemas for every request/response above;
  handlers `safeParse` at the edge and return 400 envelopes on failure.
- **`@stellariq/ui`** - `stellariqPreset` Tailwind preset, `Button`, `Card`,
  `Table` (sortable), `Stat`/`Badge`/`Spinner`/`EmptyState`, dependency-free
  SVG `LineChart`/`BarsChart`/`PriceChart`; Storybook stories + config
  (`pnpm --filter @stellariq/ui storybook`).
- **`@stellariq/sdk`** - `StellarIQClient` (all REST endpoints, timeout,
  429/5xx retries honoring `Retry-After`, typed `StellarIQError`) and
  `StellarIQSocket` (`subscribe("XLM/USDC:price", handler)` with channel
  multiplexing and auto-reconnect replay). Usage + examples:
  [`packages/sdk/README.md`](packages/sdk/README.md).

## Contracts (standalone repo)

Soroban contracts have moved to [`StellarIQLabs/stellariq-contract`](https://github.com/StellarIQLabs/stellariq-contract)
(Rust + `stellar-cli`, `example/` hello-world proving `cargo test` + `stellar contract build` to WASM).
`apps/web/src/lib/` in this repo holds the integration side: `contracts.ts` (router
interfaces, leg mapping, `StubRouterClient`), `txBuilder.ts` (selected route →
unsigned XDR via `@stellar/stellar-sdk`), `wallet.ts` + `useWallet` +
`WalletButton` (Freighter connect/sign, Soroban-RPC submit/poll). Deploys are driven from the contract repo and `stellariq-infra/scripts/deploy-contracts.sh`.

## Testing

- Web unit: `pnpm --filter @stellariq/web test` - Vitest + Testing Library
  (formatters, router stubs, sortable table, OHLCV chart with mocked
  `lightweight-charts`, debounced/stale-safe `useQuote`, validated `SwapForm`).
- API/SDK: `pnpm --filter @stellariq/api test`,
  `pnpm --filter @stellariq/sdk test` - `node:test` suites (engine ranking,
  keys, rate limits, sanitization, full route matrix incl. 429 flow, SDK retry
  - error mapping, live WS reconnect across server restart).
- E2E: `pnpm test:e2e` - Playwright (overview, navigation, swap validation)
  against a real API + production web build.
- Contracts: now in `StellarIQLabs/stellariq-contract` (`cargo test`, `cargo fmt`, `cargo clippy`).

## Docker

Production images, multi-stage, non-root `appuser`, env injection:

```bash
docker build -f apps/api/Dockerfile -t stellariq-api .
docker build -f apps/web/Dockerfile -t stellariq-web \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.example.com \
  --build-arg NEXT_PUBLIC_WS_URL=wss://api.example.com/ws .
```

The API image runs `node dist/index.js` (`HEALTHCHECK` on `/health`); the web
image runs the Next.js standalone server. `NEXT_PUBLIC_*` values bake in at
web build time - pass them as build args.

## CI

`.github/workflows/ci.yml` (push to `main`, all PRs): Node quality
(lint+typecheck), Node tests, Node build, Playwright e2e, then image builds - pushed
to GHCR on `main` only. Contract checks run in `StellarIQLabs/stellariq-contract`.

## Environment reference

| Variable                                                                                  | Service | Default                                         |
| ----------------------------------------------------------------------------------------- | ------- | ----------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_WS_URL`                                         | web     | `http://localhost:4000…`                        |
| `NEXT_PUBLIC_STELLAR_NETWORK` / `NEXT_PUBLIC_HORIZON_URL` / `NEXT_PUBLIC_SOROBAN_RPC_URL` | web     | testnet endpoints                               |
| `NEXT_PUBLIC_SWAP_ROUTER_ID`                                                              | web     | unset (quoting works; signing waits for deploy) |
| `API_PORT` / `API_HOST` / `LOG_LEVEL`                                                     | api     | `4000` / `0.0.0.0` / `info`                     |
| `DATA_API_URL`                                                                            | api     | unset → built-in mock source                    |
| `DATABASE_URL` / `REDIS_URL`                                                              | api     | local defaults; Redis absent → memory counters  |
| `API_KEY_SALT` / `ADMIN_TOKEN` / `SEED_DEV_KEYS`                                          | api     | dev salt; issuance disabled; `false`            |

## License

See [LICENSE](LICENSE).
