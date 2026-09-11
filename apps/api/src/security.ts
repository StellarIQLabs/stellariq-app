import type { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';

/** Hard cap for any single inbound string (query, params, body). */
export const MAX_INPUT_STRING = 1024;
/** Maximum JSON body size (1 MiB). */
export const MAX_BODY_BYTES = 1024 * 1024;

/** NFKC-normalizes, strips control characters, trims and caps length. */
const CONTROL_CODES: ReadonlySet<number> = new Set([
  ...Array.from({ length: 0x20 }, (_, code) => code),
  0x7f,
]);
export function sanitizeString(input: string): string {
  const stripped = Array.from(input.normalize('NFKC'))
    .filter((ch) => !CONTROL_CODES.has(ch.codePointAt(0) ?? 0x20))
    .join('');
  return stripped.trim().slice(0, MAX_INPUT_STRING);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Sanitizes string leaves in place (bounded depth, no prototype keys). */
export function sanitizeInPlace(target: Record<string, unknown>, depth = 0): void {
  for (const key of Object.keys(target)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      delete target[key];
      continue;
    }
    const value = target[key];
    if (typeof value === 'string') {
      target[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item: unknown = value[i];
        if (typeof item === 'string') {
          value[i] = sanitizeString(item);
        } else if (isRecord(item) && depth < 5) {
          sanitizeInPlace(item, depth + 1);
        }
      }
    } else if (isRecord(value) && depth < 5) {
      sanitizeInPlace(value, depth + 1);
    }
  }
}

/**
 * Global hardening (PRD §29 security): security headers via helmet, a JSON
 * body cap, and input sanitization of query/params/body before validation.
 * Every route keeps its own zod schema on top of this baseline.
 */
export async function registerSecurity(app: FastifyInstance): Promise<void> {
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  app.addHook('onRequest', async (request) => {
    if (isRecord(request.query)) {
      sanitizeInPlace(request.query as Record<string, unknown>);
    }
    if (isRecord(request.params)) {
      sanitizeInPlace(request.params as Record<string, unknown>);
    }
  });

  app.addHook('preValidation', async (request) => {
    if (isRecord(request.body)) {
      sanitizeInPlace(request.body as Record<string, unknown>);
    }
  });
}
