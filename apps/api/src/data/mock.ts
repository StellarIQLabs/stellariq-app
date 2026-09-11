import type {
  AggregatedMarket,
  Asset,
  AssetWithMarket,
  Market,
  OhlcvCandle,
  Pool,
  Protocol,
  Swap,
  Timeframe,
} from '@stellariq/types';
import type { DataSource, ListOptions, Paged, SeriesPoint } from './source.js';

const HOUR = 3600;
const BOOT_TIME = Math.floor(Date.now() / 1000);

const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const EURC_ISSUER = 'GDHUJ4J247Q4U5MTYEL4Y65QZQ4ZKXK7XKZQ4W5MTYEL4Y65QZQ4ZV';
const AQUA_ISSUER = 'GBNZILSTVQZ4R7IKKDQ6C2K7XKZQ4W5MTYEL4Y65QZQ4ZVAQUA1';

const ASSETS: Asset[] = [
  {
    id: 'XLM',
    code: 'XLM',
    issuer: null,
    name: 'Stellar Lumens',
    decimals: 7,
    verificationStatus: 'verified',
    createdAt: '2015-01-01T00:00:00.000Z',
    price: 0.2374,
    volume24h: 4200000,
    liquidity: 8700000,
  },
  {
    id: `USDC:${USDC_ISSUER}`,
    code: 'USDC',
    issuer: USDC_ISSUER,
    name: 'USD Coin',
    decimals: 7,
    verificationStatus: 'verified',
    createdAt: '2021-06-01T00:00:00.000Z',
    price: 1.0,
    volume24h: 6100000,
    liquidity: 12300000,
  },
  {
    id: `EURC:${EURC_ISSUER}`,
    code: 'EURC',
    issuer: EURC_ISSUER,
    name: 'Euro Coin',
    decimals: 7,
    verificationStatus: 'verified',
    createdAt: '2022-03-01T00:00:00.000Z',
    price: 1.08,
    volume24h: 1200000,
    liquidity: 2400000,
  },
  {
    id: `AQUA:${AQUA_ISSUER}`,
    code: 'AQUA',
    issuer: AQUA_ISSUER,
    name: 'Aquarius',
    decimals: 7,
    verificationStatus: 'unverified',
    createdAt: '2021-12-01T00:00:00.000Z',
    price: 0.0012,
    volume24h: 84000,
    liquidity: 310000,
  },
];

const MARKETS: Market[] = [
  {
    id: 'XLM/USDC',
    baseAsset: 'XLM',
    quoteAsset: 'USDC',
    protocol: 'stellar-dex',
    poolId: 'xlm-usdc-stellar-dex',
    price: 0.2374,
    priceChange24h: 2.14,
    volume24h: 4200000,
    liquidity: 4200000,
    trades24h: 18294,
    spread: 0.0011,
  },
  {
    id: 'XLM/USDC',
    baseAsset: 'XLM',
    quoteAsset: 'USDC',
    protocol: 'soroswap',
    poolId: 'xlm-usdc-soroswap',
    price: 0.2368,
    priceChange24h: 1.98,
    volume24h: 1800000,
    liquidity: 2800000,
    trades24h: 6210,
    spread: 0.0018,
  },
  {
    id: 'XLM/USDC',
    baseAsset: 'XLM',
    quoteAsset: 'USDC',
    protocol: 'phoenix',
    poolId: 'xlm-usdc-phoenix',
    price: 0.2394,
    priceChange24h: 2.31,
    volume24h: 900000,
    liquidity: 1700000,
    trades24h: 2980,
    spread: 0.0022,
  },
  {
    id: 'XLM/EURC',
    baseAsset: 'XLM',
    quoteAsset: 'EURC',
    protocol: 'stellar-dex',
    poolId: 'xlm-eurc-stellar-dex',
    price: 0.2198,
    priceChange24h: 1.42,
    volume24h: 760000,
    liquidity: 1500000,
    trades24h: 3120,
    spread: 0.0025,
  },
  {
    id: 'USDC/EURC',
    baseAsset: 'USDC',
    quoteAsset: 'EURC',
    protocol: 'soroswap',
    poolId: 'usdc-eurc-soroswap',
    price: 0.9259,
    priceChange24h: -0.18,
    volume24h: 540000,
    liquidity: 1100000,
    trades24h: 1980,
    spread: 0.0015,
  },
  {
    id: 'XLM/AQUA',
    baseAsset: 'XLM',
    quoteAsset: 'AQUA',
    protocol: 'aqua',
    poolId: 'xlm-aqua-aqua',
    price: 197.83,
    priceChange24h: -1.2,
    volume24h: 84000,
    liquidity: 310000,
    trades24h: 640,
    spread: 0.004,
  },
];

const POOLS: Pool[] = [
  {
    id: 'xlm-usdc-stellar-dex',
    protocol: 'stellar-dex',
    tokenA: 'XLM',
    tokenB: 'USDC',
    reserveA: 17700000,
    reserveB: 4200000,
    tvl: 8400000,
    fee: 0,
    volume24h: 4200000,
    volumeTvlRatio: 0.5,
    liquidityChange7d: 0.34,
    tradeCount24h: 18294,
    estimatedPriceImpact: 0.0018,
  },
  {
    id: 'xlm-usdc-soroswap',
    protocol: 'soroswap',
    tokenA: 'XLM',
    tokenB: 'USDC',
    reserveA: 11800000,
    reserveB: 2800000,
    tvl: 5600000,
    fee: 0.003,
    volume24h: 1800000,
    volumeTvlRatio: 0.321,
    liquidityChange7d: 0.12,
    tradeCount24h: 6210,
    estimatedPriceImpact: 0.0024,
  },
  {
    id: 'xlm-usdc-phoenix',
    protocol: 'phoenix',
    tokenA: 'XLM',
    tokenB: 'USDC',
    reserveA: 7100000,
    reserveB: 1700000,
    tvl: 3400000,
    fee: 0.003,
    volume24h: 900000,
    volumeTvlRatio: 0.265,
    liquidityChange7d: -0.06,
    tradeCount24h: 2980,
    estimatedPriceImpact: 0.0031,
  },
  {
    id: 'xlm-eurc-stellar-dex',
    protocol: 'stellar-dex',
    tokenA: 'XLM',
    tokenB: 'EURC',
    reserveA: 6800000,
    reserveB: 1390000,
    tvl: 3000000,
    fee: 0,
    volume24h: 760000,
    volumeTvlRatio: 0.253,
    liquidityChange7d: 0.08,
    tradeCount24h: 3120,
    estimatedPriceImpact: 0.0042,
  },
  {
    id: 'usdc-eurc-soroswap',
    protocol: 'soroswap',
    tokenA: 'USDC',
    tokenB: 'EURC',
    reserveA: 1180000,
    reserveB: 1090000,
    tvl: 2200000,
    fee: 0.002,
    volume24h: 540000,
    volumeTvlRatio: 0.245,
    liquidityChange7d: 0.03,
    tradeCount24h: 1980,
    estimatedPriceImpact: 0.0015,
  },
  {
    id: 'xlm-aqua-aqua',
    protocol: 'aqua',
    tokenA: 'XLM',
    tokenB: 'AQUA',
    reserveA: 1300000,
    reserveB: 257000000,
    tvl: 620000,
    fee: 0.003,
    volume24h: 84000,
    volumeTvlRatio: 0.135,
    liquidityChange7d: -0.02,
    tradeCount24h: 640,
    estimatedPriceImpact: 0.0098,
  },
];

function buildSwaps(): Swap[] {
  const pairs: [string, string, Protocol, string][] = [
    ['XLM', 'USDC', 'stellar-dex', 'xlm-usdc-stellar-dex'],
    ['XLM', 'USDC', 'soroswap', 'xlm-usdc-soroswap'],
    ['USDC', 'XLM', 'phoenix', 'xlm-usdc-phoenix'],
    ['XLM', 'EURC', 'stellar-dex', 'xlm-eurc-stellar-dex'],
  ];
  return Array.from({ length: 24 }, (_, i) => {
    const [inputAsset, outputAsset, protocol, pool] = pairs[i % pairs.length] as [
      string,
      string,
      Protocol,
      string,
    ];
    const large = i % 5 === 4;
    const inputAmount = large ? 500000 + i * 1000 : 100 + i * 37;
    return {
      id: `swap-${String(i + 1).padStart(4, '0')}`,
      transactionHash: `txhash${String(i + 1).padStart(56, '0')}`,
      protocol,
      pool,
      user: `GUSER${String(i + 1).padStart(51, '0')}`,
      inputAsset,
      outputAsset,
      inputAmount,
      outputAmount: Math.round(inputAmount * 0.237 * 100) / 100,
      timestamp: BOOT_TIME - i * 900,
      ...(large ? { isLarge: true as const } : {}),
    };
  });
}

const SWAPS: Swap[] = buildSwaps();

const TIMEFRAME_POINTS: Record<Timeframe, { points: number; step: number }> = {
  '1H': { points: 60, step: 60 },
  '4H': { points: 96, step: 240 },
  '1D': { points: 96, step: 900 },
  '1W': { points: 84, step: 7200 },
  '1M': { points: 120, step: 21600 },
};

function basePrice(asset: string): number {
  const found = ASSETS.find((a) => a.id === asset || a.code === asset);
  return found?.price ?? 1;
}

function paginate<T>(items: T[], { page, limit }: ListOptions): Paged<T> {
  const start = (page - 1) * limit;
  return { data: items.slice(start, start + limit), page, limit, total: items.length };
}

/** Deterministic in-memory dataset implementing the DataSource seam. */
export class MockDataSource implements DataSource {
  listAssets(opts: { search?: string; verifiedOnly?: boolean } & ListOptions): Paged<Asset> {
    const q = (opts.search ?? '').toLowerCase();
    const filtered = ASSETS.filter(
      (a) =>
        (!opts.verifiedOnly || a.verificationStatus === 'verified') &&
        (q === '' ||
          a.code.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          (a.issuer ?? '').toLowerCase().includes(q)),
    );
    return paginate(filtered, opts);
  }

  getAsset(id: string): AssetWithMarket | null {
    const asset = ASSETS.find((a) => a.id === id || a.code === id);
    if (!asset) {
      return null;
    }
    const markets = MARKETS.filter(
      (m) => m.baseAsset === asset.code || m.quoteAsset === asset.code,
    ).map((m) => m.id);
    return { ...asset, priceChange24h: 2.14, markets: [...new Set(markets)] };
  }

  listMarkets(
    opts: { protocol?: Protocol; sort: 'volume' | 'liquidity' | 'change' } & ListOptions,
  ): Paged<Market> {
    const filtered = MARKETS.filter((m) => !opts.protocol || m.protocol === opts.protocol);
    const sorted = [...filtered].sort((a, b) => {
      if (opts.sort === 'liquidity') {
        return (b.liquidity ?? 0) - (a.liquidity ?? 0);
      }
      if (opts.sort === 'change') {
        return Math.abs(b.priceChange24h ?? 0) - Math.abs(a.priceChange24h ?? 0);
      }
      return (b.volume24h ?? 0) - (a.volume24h ?? 0);
    });
    return paginate(sorted, opts);
  }

  getMarket(pair: string): AggregatedMarket | null {
    const entries = MARKETS.filter((m) => m.id === pair);
    if (entries.length === 0) {
      return null;
    }
    const first = entries[0] as Market;
    const volume24h = entries.reduce((sum, m) => sum + (m.volume24h ?? 0), 0);
    const liquidity = entries.reduce((sum, m) => sum + (m.liquidity ?? 0), 0);
    const prices = entries.map((m) => m.price ?? 0);
    const spread =
      Math.max(...prices) > 0
        ? (Math.max(...prices) - Math.min(...prices)) / Math.max(...prices)
        : 0;
    return {
      id: pair,
      baseAsset: first.baseAsset,
      quoteAsset: first.quoteAsset,
      price: first.price ?? 0,
      priceChange24h: first.priceChange24h ?? 0,
      volume24h,
      liquidity,
      trades24h: entries.reduce((sum, m) => sum + (m.trades24h ?? 0), 0),
      spread,
      sources: entries.map((m) => ({
        protocol: m.protocol,
        poolId: m.poolId,
        price: m.price ?? 0,
        liquidity: m.liquidity ?? 0,
        volume24h: m.volume24h ?? 0,
      })),
    };
  }

  listPools(opts: { protocol?: Protocol; sort: 'tvl' | 'volume' } & ListOptions): Paged<Pool> {
    const filtered = POOLS.filter((p) => !opts.protocol || p.protocol === opts.protocol);
    const sorted = [...filtered].sort((a, b) =>
      opts.sort === 'volume' ? (b.volume24h ?? 0) - (a.volume24h ?? 0) : b.tvl - a.tvl,
    );
    return paginate(sorted, opts);
  }

  getPool(id: string): Pool | null {
    return POOLS.find((p) => p.id === id) ?? null;
  }

  listSwaps(
    opts: { asset?: string; pool?: string; protocol?: Protocol } & ListOptions,
  ): Paged<Swap> {
    const filtered = SWAPS.filter(
      (s) =>
        (!opts.asset || s.inputAsset === opts.asset || s.outputAsset === opts.asset) &&
        (!opts.pool || s.pool === opts.pool) &&
        (!opts.protocol || s.protocol === opts.protocol),
    );
    return paginate(filtered, opts);
  }

  recentSwaps(limit: number): Swap[] {
    return SWAPS.slice(0, limit);
  }

  swapsTotal(): number {
    return 84291;
  }

  priceHistory(asset: string, timeframe: Timeframe): OhlcvCandle[] {
    const { points, step } = TIMEFRAME_POINTS[timeframe];
    const base = basePrice(asset);
    return Array.from({ length: points }, (_, i) => {
      const drift = Math.sin(i / 6) * 0.012 + Math.sin(i / 17) * 0.006;
      const open = base * (1 + drift);
      const close = base * (1 + drift + Math.sin(i / 3) * 0.004);
      return {
        timestamp: BOOT_TIME - (points - 1 - i) * step,
        open,
        high: Math.max(open, close) * 1.002,
        low: Math.min(open, close) * 0.998,
        close,
        volume: Math.round(20000 + Math.abs(Math.sin(i / 4)) * 60000),
      };
    });
  }

  volumeSeries(): SeriesPoint[] {
    return Array.from({ length: 24 }, (_, i) => ({
      timestamp: BOOT_TIME - (23 - i) * HOUR,
      value: Math.round(380000 + Math.abs(Math.sin(i / 3)) * 320000),
    }));
  }

  liquiditySeries(asset?: string): SeriesPoint[] {
    const scale = asset ? 0.4 : 1;
    return Array.from({ length: 24 }, (_, i) => ({
      timestamp: BOOT_TIME - (23 - i) * HOUR,
      value: Math.round((36000000 + i * 420000) * scale),
    }));
  }

  poolReserves(
    assetA: string,
    assetB: string,
  ): { poolId: string; protocol: Protocol; reserveA: number; reserveB: number; fee: number }[] {
    const code = (id: string): string => {
      const asset = ASSETS.find((a) => a.id === id);
      return asset ? asset.code : id;
    };
    const a = code(assetA);
    const b = code(assetB);
    return POOLS.filter(
      (p) => (p.tokenA === a && p.tokenB === b) || (p.tokenA === b && p.tokenB === a),
    ).map((p) =>
      p.tokenA === a
        ? {
            poolId: p.id,
            protocol: p.protocol,
            reserveA: p.reserveA,
            reserveB: p.reserveB,
            fee: p.fee,
          }
        : {
            poolId: p.id,
            protocol: p.protocol,
            reserveA: p.reserveB,
            reserveB: p.reserveA,
            fee: p.fee,
          },
    );
  }
}
