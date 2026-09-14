import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ApiKeyRecord } from './keys.js';

/**
 * Optional persistence back-end for `KeyStore`. When present, issued keys
 * survive process restarts; when absent, keys live only in memory.
 */
export interface KeyPersistence {
  load(): ApiKeyRecord[];
  save(records: ApiKeyRecord[]): void;
}

/** File-backed persistence: JSON array on disk, written synchronously on every mutation. */
export class FileKeyPersistence implements KeyPersistence {
  private readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  load(): ApiKeyRecord[] {
    try {
      const raw = readFileSync(this.path, 'utf-8');
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed as ApiKeyRecord[];
    } catch {
      return [];
    }
  }

  save(records: ApiKeyRecord[]): void {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(records, null, 2) + '\n', 'utf-8');
  }
}
