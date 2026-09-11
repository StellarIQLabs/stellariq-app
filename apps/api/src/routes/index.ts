import type { FastifyInstance } from 'fastify';
import type { DataSource } from '../data/source.js';
import { healthRoutes } from './health.js';
import { assetRoutes } from './assets.js';
import { priceRoutes } from './prices.js';
import { marketRoutes } from './markets.js';

/** A domain route module: registers its endpoints against the app. */
export type RouteModule = (app: FastifyInstance, source: DataSource) => void | Promise<void>;

/**
 * Modular route registry — every PRD §17 domain adds its module here.
 * Domain tasks append their module; nothing else changes.
 */
export const routeModules: RouteModule[] = [healthRoutes, assetRoutes, priceRoutes, marketRoutes];

export async function registerRoutes(app: FastifyInstance, source: DataSource): Promise<void> {
  for (const register of routeModules) {
    await register(app, source);
  }
}
