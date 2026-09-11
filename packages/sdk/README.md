# @stellariq/sdk

Typed client for the StellarIQ REST and WebSocket APIs — market data, prices,
pools, swaps, quotes, routes and live streams for wallets, bots and agents.

## Install

```bash
pnpm add @stellariq/sdk
```

## REST quickstart

```ts
import { StellarIQClient } from '@stellariq/sdk';

const client = new StellarIQClient({
  baseUrl: 'http://localhost:4000',
  apiKey: process.env.STELLARIQ_API_KEY, // optional; anonymous calls use free-tier limits
});

// Markets
const markets = await client.listMarkets({ sort: 'volume', limit: 10 });
for (const market of markets.data) {
  console.log(market.id, market.price, market.volume24h);
}

const pair = await client.getMarket('XLM/USDC');
console.log(pair.sources.length, 'protocol sources');
```

## Endpoint coverage

```ts
// Assets
await client.listAssets({ search: 'XLM', verified: true, page: 1, limit: 20 });
await client.getAsset('XLM');

// Prices
await client.getPrice('XLM'); // { asset, price, currency, timestamp, sources, confidence }
await client.getPriceHistory('XLM', '1D'); // OHLCV candles, timeframes 1H|4H|1D|1W|1M

// Markets
await client.listMarkets({ protocol: 'soroswap', sort: 'liquidity' });
await client.getMarket('XLM/USDC');

// Pools
await client.listPools({ protocol: 'phoenix', sort: 'tvl' });
await client.getPool('xlm-usdc-soroswap');

// Swaps
await client.listSwaps({ asset: 'XLM', protocol: 'stellar-dex', page: 1, limit: 20 });
await client.recentSwaps({ limit: 10 });

// Quotes and routes
const quote = await client.getQuote('XLM', 'USDC', 10_000);
console.log(quote.outputAmount, quote.priceImpact, quote.fees, quote.routeId);
const routes = await client.getRoutes('XLM', 'USDC', 10_000);
console.log(
  routes.bestRouteId,
  routes.routes.map((r) => [r.id, r.kind, r.outputAmount]),
);

// Analytics
await client.getVolume('1D');
await client.getLiquidity('XLM', '1W');

// Service probes
await client.health();
await client.ready();
```

## WebSocket streams

```ts
import { StellarIQSocket } from '@stellariq/sdk';

const socket = new StellarIQSocket({ wsUrl: 'ws://localhost:4000/ws' });

const unsubscribePrice = await socket.subscribe('XLM/USDC:price', (event) => {
  if (event.type === 'price_update') {
    console.log(event.pair, event.price, event.timestamp);
  }
});

await socket.subscribe('XLM/USDC:trades', (event) => {
  if (event.type === 'trade_update') {
    console.log(event.swap.transactionHash, event.swap.inputAmount);
  }
});

await socket.subscribe('XLM/USDC:liquidity', (event) => {
  if (event.type === 'liquidity_update') {
    console.log(event.pair, event.liquidity);
  }
});

// Later:
unsubscribePrice();
socket.stop(); // closes the connection and stops reconnect timers
```

Subscriptions survive reconnects automatically: the client replays every
active channel with backoff, and answers application-level pings. Browsers
pass the native implementation explicitly:

```ts
const socket = new StellarIQSocket({ wsUrl, socketImpl: WebSocket });
```

## Auth and tiers

Keys are issued out of band (`POST /v1/keys` with an admin token) and sent
as `x-api-key`. Tiers — `free`, `developer`, `pro`, `enterprise` — raise the
per-minute budget (60 / 600 / 6000 / 60000). Anonymous callers share the free
budget by IP.

## Errors and retries

```ts
import { StellarIQClient, StellarIQError } from '@stellariq/sdk';

try {
  await client.getMarket('NOPE/USDC');
} catch (err) {
  if (err instanceof StellarIQError) {
    console.log(err.status, err.code, err.message, err.retryable);
  }
}
```

The client retries 429/5xx with backoff honoring `Retry-After`
(`maxRetries`, default 2) and aborts hung requests after `timeoutMs`
(default 10s). Pass a custom `fetchImpl` to plug in instrumentation.
