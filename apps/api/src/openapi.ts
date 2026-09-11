import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version }: { version: string } = require('../package.json') as { version: string };

function paginated(itemRef: object) {
  return {
    type: 'object',
    required: ['data', 'page', 'limit', 'total'],
    properties: {
      data: { type: 'array', items: itemRef },
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 20 },
      total: { type: 'integer', example: 4 },
    },
  };
}

function errorResponses() {
  return {
    '400': {
      description: 'Invalid request',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
    },
    '404': {
      description: 'Not found',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
    },
    '429': {
      description: 'Rate limited',
      content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
    },
  };
}

/**
 * OpenAPI 3.0 document for every PRD §17 endpoint with example payloads.
 * Served as JSON at /openapi.json and rendered at /docs.
 */
export function buildOpenApiDocument(): Record<string, unknown> {
  return {
    openapi: '3.0.3',
    info: {
      title: 'StellarIQ API',
      version,
      description:
        'Intelligence for Stellar DeFi: assets, prices, markets, pools, swaps, quotes, routes and analytics.',
    },
    servers: [{ url: 'http://localhost:4000', description: 'Local development' }],
    tags: [
      { name: 'system', description: 'Probes' },
      { name: 'assets' },
      { name: 'prices' },
      { name: 'markets' },
      { name: 'pools' },
      { name: 'swaps' },
      { name: 'quotes' },
      { name: 'routes' },
      { name: 'analytics' },
      { name: 'keys' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['system'],
          summary: 'Liveness probe',
          responses: {
            '200': {
              description: 'Alive',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      version: { type: 'string', example: version },
                      uptime: { type: 'integer', example: 123 },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/ready': {
        get: {
          tags: ['system'],
          summary: 'Readiness probe (checks the data layer)',
          responses: {
            '200': {
              description: 'Ready',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ready' },
                      checks: {
                        type: 'object',
                        properties: {
                          data: { type: 'string', example: 'ok' },
                          assets: { type: 'integer', example: 4 },
                        },
                      },
                    },
                  },
                },
              },
            },
            '503': {
              description: 'Data layer unreachable',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/v1/assets': {
        get: {
          tags: ['assets'],
          summary: 'List indexed assets',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'verified', in: 'query', schema: { type: 'boolean' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          ],
          responses: {
            '200': {
              description: 'Asset page',
              content: {
                'application/json': { schema: paginated({ $ref: '#/components/schemas/Asset' }) },
              },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/assets/{asset}': {
        get: {
          tags: ['assets'],
          summary: 'Get a single asset',
          parameters: [
            {
              name: 'asset',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: 'XLM',
            },
          ],
          responses: {
            '200': {
              description: 'Asset',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Asset' } } },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/prices/{asset}': {
        get: {
          tags: ['prices'],
          summary: 'Aggregated asset price',
          parameters: [
            {
              name: 'asset',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: 'XLM',
            },
          ],
          responses: {
            '200': {
              description: 'Price',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Price' } } },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/prices/{asset}/history': {
        get: {
          tags: ['prices'],
          summary: 'OHLCV price history',
          parameters: [
            {
              name: 'asset',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: 'XLM',
            },
            {
              name: 'timeframe',
              in: 'query',
              schema: { type: 'string', enum: ['1H', '4H', '1D', '1W', '1M'], default: '1D' },
            },
          ],
          responses: {
            '200': {
              description: 'Candles',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/OhlcvCandle' } },
                },
              },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/markets': {
        get: {
          tags: ['markets'],
          summary: 'List markets',
          parameters: [
            {
              name: 'protocol',
              in: 'query',
              schema: { type: 'string', enum: ['stellar-dex', 'soroswap', 'phoenix', 'aqua'] },
            },
            {
              name: 'sort',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['volume', 'liquidity', 'change'],
                default: 'volume',
              },
            },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          ],
          responses: {
            '200': {
              description: 'Market page',
              content: {
                'application/json': { schema: paginated({ $ref: '#/components/schemas/Market' }) },
              },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/markets/{pair}': {
        get: {
          tags: ['markets'],
          summary: 'Aggregated pair view across protocols',
          parameters: [
            {
              name: 'pair',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: 'XLM/USDC',
            },
          ],
          responses: {
            '200': {
              description: 'Pair',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/AggregatedMarket' } },
              },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/pools': {
        get: {
          tags: ['pools'],
          summary: 'List pools',
          parameters: [
            {
              name: 'protocol',
              in: 'query',
              schema: { type: 'string', enum: ['stellar-dex', 'soroswap', 'phoenix', 'aqua'] },
            },
            {
              name: 'sort',
              in: 'query',
              schema: { type: 'string', enum: ['tvl', 'volume'], default: 'tvl' },
            },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          ],
          responses: {
            '200': {
              description: 'Pool page',
              content: {
                'application/json': { schema: paginated({ $ref: '#/components/schemas/Pool' }) },
              },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/pools/{pool}': {
        get: {
          tags: ['pools'],
          summary: 'Get a single pool with analytics',
          parameters: [
            {
              name: 'pool',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              example: 'xlm-usdc-soroswap',
            },
          ],
          responses: {
            '200': {
              description: 'Pool',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Pool' } } },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/swaps': {
        get: {
          tags: ['swaps'],
          summary: 'List swaps with filters',
          parameters: [
            { name: 'asset', in: 'query', schema: { type: 'string' } },
            {
              name: 'protocol',
              in: 'query',
              schema: { type: 'string', enum: ['stellar-dex', 'soroswap', 'phoenix', 'aqua'] },
            },
            { name: 'pool', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          ],
          responses: {
            '200': {
              description: 'Swap page',
              content: {
                'application/json': { schema: paginated({ $ref: '#/components/schemas/Swap' }) },
              },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/swaps/recent': {
        get: {
          tags: ['swaps'],
          summary: 'Most recent swaps',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            { name: 'asset', in: 'query', schema: { type: 'string' } },
            {
              name: 'protocol',
              in: 'query',
              schema: { type: 'string', enum: ['stellar-dex', 'soroswap', 'phoenix', 'aqua'] },
            },
          ],
          responses: {
            '200': {
              description: 'Swaps',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Swap' } },
                },
              },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/quote': {
        get: {
          tags: ['quotes'],
          summary: 'Best execution for an input',
          parameters: [
            {
              name: 'from',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              example: 'XLM',
            },
            {
              name: 'to',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              example: 'USDC',
            },
            {
              name: 'amount',
              in: 'query',
              required: true,
              schema: { type: 'number' },
              example: 10000,
            },
          ],
          responses: {
            '200': {
              description: 'Quote',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Quote' } } },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/routes': {
        get: {
          tags: ['routes'],
          summary: 'All evaluated routes ranked by net output',
          parameters: [
            {
              name: 'from',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              example: 'XLM',
            },
            {
              name: 'to',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              example: 'USDC',
            },
            {
              name: 'amount',
              in: 'query',
              required: true,
              schema: { type: 'number' },
              example: 10000,
            },
          ],
          responses: {
            '200': {
              description: 'Routes',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/RoutesResponse' } },
              },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/analytics/volume': {
        get: {
          tags: ['analytics'],
          summary: 'Volume series',
          parameters: [
            {
              name: 'timeframe',
              in: 'query',
              schema: { type: 'string', enum: ['1H', '4H', '1D', '1W', '1M'], default: '1D' },
            },
            { name: 'asset', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Series',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/AnalyticsSeries' } },
              },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/analytics/liquidity': {
        get: {
          tags: ['analytics'],
          summary: 'Liquidity series',
          parameters: [
            {
              name: 'timeframe',
              in: 'query',
              schema: { type: 'string', enum: ['1H', '4H', '1D', '1W', '1M'], default: '1D' },
            },
            { name: 'asset', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: 'Series',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/AnalyticsSeries' } },
              },
            },
            ...errorResponses(),
          },
        },
      },
      '/v1/keys': {
        post: {
          tags: ['keys'],
          summary: 'Issue an API key (admin token required)',
          parameters: [
            { name: 'x-admin-token', in: 'header', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'tier'],
                  properties: {
                    name: { type: 'string', example: 'trading-bot' },
                    tier: { type: 'string', enum: ['free', 'developer', 'pro', 'enterprise'] },
                  },
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Issued key (raw key shown once)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      key: { type: 'string', example: 'siq_…' },
                      id: { type: 'string' },
                      prefix: { type: 'string' },
                      name: { type: 'string' },
                      tier: { type: 'string' },
                      createdAt: { type: 'string' },
                    },
                  },
                },
              },
            },
            '403': {
              description: 'Issuance disabled',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' },
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error', 'message', 'statusCode'],
          properties: {
            error: { type: 'string', example: 'Not Found' },
            message: { type: 'string', example: 'Unknown asset "NOPE".' },
            statusCode: { type: 'integer', example: 404 },
          },
        },
        Asset: {
          type: 'object',
          required: ['id', 'code', 'issuer', 'name', 'decimals', 'verificationStatus', 'createdAt'],
          properties: {
            id: { type: 'string', example: 'XLM' },
            code: { type: 'string', example: 'XLM' },
            issuer: { type: 'string', nullable: true, example: null },
            name: { type: 'string', example: 'Stellar Lumens' },
            decimals: { type: 'integer', example: 7 },
            verificationStatus: { type: 'string', enum: ['verified', 'unverified', 'suspicious'] },
            createdAt: { type: 'string', example: '2015-01-01T00:00:00.000Z' },
            price: { type: 'number', example: 0.2374 },
            volume24h: { type: 'number', example: 4200000 },
            liquidity: { type: 'number', example: 8700000 },
          },
        },
        Price: {
          type: 'object',
          required: ['asset', 'price', 'currency', 'timestamp', 'sources', 'confidence'],
          properties: {
            asset: { type: 'string', example: 'XLM' },
            price: { type: 'number', example: 0.2374 },
            currency: { type: 'string', example: 'USD' },
            timestamp: { type: 'integer', example: 1789060000 },
            sources: { type: 'integer', example: 8 },
            confidence: { type: 'number', example: 0.998 },
          },
        },
        OhlcvCandle: {
          type: 'object',
          required: ['timestamp', 'open', 'high', 'low', 'close', 'volume'],
          properties: {
            timestamp: { type: 'integer', example: 1789060000 },
            open: { type: 'number', example: 0.2374 },
            high: { type: 'number', example: 0.2381 },
            low: { type: 'number', example: 0.2369 },
            close: { type: 'number', example: 0.2377 },
            volume: { type: 'number', example: 42000 },
          },
        },
        Market: {
          type: 'object',
          required: ['id', 'baseAsset', 'quoteAsset', 'protocol', 'poolId'],
          properties: {
            id: { type: 'string', example: 'XLM/USDC' },
            baseAsset: { type: 'string', example: 'XLM' },
            quoteAsset: { type: 'string', example: 'USDC' },
            protocol: { type: 'string', example: 'soroswap' },
            poolId: { type: 'string', example: 'xlm-usdc-soroswap' },
            price: { type: 'number', example: 0.2368 },
            priceChange24h: { type: 'number', example: 1.98 },
            volume24h: { type: 'number', example: 1800000 },
            liquidity: { type: 'number', example: 2800000 },
            trades24h: { type: 'integer', example: 6210 },
            spread: { type: 'number', example: 0.0018 },
          },
        },
        AggregatedMarket: {
          type: 'object',
          required: ['id', 'baseAsset', 'quoteAsset', 'sources'],
          properties: {
            id: { type: 'string', example: 'XLM/USDC' },
            baseAsset: { type: 'string', example: 'XLM' },
            quoteAsset: { type: 'string', example: 'USDC' },
            price: { type: 'number', example: 0.2374 },
            priceChange24h: { type: 'number', example: 2.14 },
            volume24h: { type: 'number', example: 6900000 },
            liquidity: { type: 'number', example: 8700000 },
            trades24h: { type: 'integer', example: 27484 },
            spread: { type: 'number', example: 0.011 },
            sources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  protocol: { type: 'string', example: 'stellar-dex' },
                  poolId: { type: 'string', example: 'xlm-usdc-stellar-dex' },
                  price: { type: 'number', example: 0.2374 },
                  liquidity: { type: 'number', example: 4200000 },
                  volume24h: { type: 'number', example: 4200000 },
                },
              },
            },
          },
        },
        Pool: {
          type: 'object',
          required: ['id', 'protocol', 'tokenA', 'tokenB', 'reserveA', 'reserveB', 'tvl', 'fee'],
          properties: {
            id: { type: 'string', example: 'xlm-usdc-soroswap' },
            protocol: { type: 'string', example: 'soroswap' },
            tokenA: { type: 'string', example: 'XLM' },
            tokenB: { type: 'string', example: 'USDC' },
            reserveA: { type: 'number', example: 11800000 },
            reserveB: { type: 'number', example: 2800000 },
            tvl: { type: 'number', example: 5600000 },
            fee: { type: 'number', example: 0.003 },
            volume24h: { type: 'number', example: 1800000 },
            volumeTvlRatio: { type: 'number', example: 0.321 },
            liquidityChange7d: { type: 'number', example: 0.12 },
            tradeCount24h: { type: 'integer', example: 6210 },
            estimatedPriceImpact: { type: 'number', example: 0.0024 },
          },
        },
        Swap: {
          type: 'object',
          required: [
            'id',
            'transactionHash',
            'protocol',
            'pool',
            'user',
            'inputAsset',
            'outputAsset',
            'inputAmount',
            'outputAmount',
            'timestamp',
          ],
          properties: {
            id: { type: 'string', example: 'swap-0001' },
            transactionHash: { type: 'string', example: 'txhash0000…' },
            protocol: { type: 'string', example: 'stellar-dex' },
            pool: { type: 'string', example: 'xlm-usdc-stellar-dex' },
            user: { type: 'string', example: 'GUSER…' },
            inputAsset: { type: 'string', example: 'XLM' },
            outputAsset: { type: 'string', example: 'USDC' },
            inputAmount: { type: 'number', example: 125000 },
            outputAmount: { type: 'number', example: 29625 },
            timestamp: { type: 'integer', example: 1789060000 },
            isLarge: { type: 'boolean', example: true },
          },
        },
        Quote: {
          type: 'object',
          required: ['from', 'to', 'inputAmount', 'outputAmount', 'priceImpact', 'fees', 'routeId'],
          properties: {
            from: { type: 'string', example: 'XLM' },
            to: { type: 'string', example: 'USDC' },
            inputAmount: { type: 'number', example: 10000 },
            outputAmount: { type: 'number', example: 2370.42 },
            priceImpact: { type: 'number', example: 0.0018 },
            fees: { type: 'number', example: 7.35 },
            routeId: { type: 'string', example: 'C' },
          },
        },
        SwapRoute: {
          type: 'object',
          required: [
            'id',
            'kind',
            'outputAmount',
            'priceImpact',
            'networkFee',
            'protocolFee',
            'steps',
            'isBest',
          ],
          properties: {
            id: { type: 'string', example: 'C' },
            kind: { type: 'string', enum: ['direct', 'multi-hop', 'split'] },
            outputAmount: { type: 'number', example: 2372.03 },
            priceImpact: { type: 'number', example: 0.0016 },
            networkFee: { type: 'number', example: 0.24 },
            protocolFee: { type: 'number', example: 7.11 },
            steps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  protocol: { type: 'string', example: 'soroswap' },
                  poolId: { type: 'string', example: 'xlm-usdc-soroswap' },
                  inputAsset: { type: 'string', example: 'XLM' },
                  outputAsset: { type: 'string', example: 'USDC' },
                },
              },
            },
            isBest: { type: 'boolean', example: true },
          },
        },
        RoutesResponse: {
          type: 'object',
          required: ['from', 'to', 'inputAmount', 'routes', 'bestRouteId'],
          properties: {
            from: { type: 'string', example: 'XLM' },
            to: { type: 'string', example: 'USDC' },
            inputAmount: { type: 'number', example: 10000 },
            routes: { type: 'array', items: { $ref: '#/components/schemas/SwapRoute' } },
            bestRouteId: { type: 'string', example: 'C' },
          },
        },
        AnalyticsSeries: {
          type: 'object',
          required: ['metric', 'timeframe', 'points'],
          properties: {
            metric: { type: 'string', enum: ['volume', 'liquidity'] },
            timeframe: { type: 'string', example: '1D' },
            points: {
              type: 'array',
              items: {
                type: 'object',
                required: ['timestamp', 'value'],
                properties: {
                  timestamp: { type: 'integer', example: 1789060000 },
                  value: { type: 'number', example: 420000 },
                },
              },
            },
          },
        },
      },
    },
    security: [{ apiKey: [] }],
  };
}
