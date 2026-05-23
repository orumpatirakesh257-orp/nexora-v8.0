import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Nexora monorepo root (contains client/, server/, .env). */
export function getProjectRoot(): string {
  let dir = path.resolve(__dirname, '..');
  for (let i = 0; i < 6; i++) {
    if (
      existsSync(path.join(dir, 'package.json')) &&
      existsSync(path.join(dir, 'client')) &&
      existsSync(path.join(dir, 'server'))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(__dirname, '../..');
}

export function getEnvPath(): string {
  return path.join(getProjectRoot(), '.env');
}

export function getClientDistPath(): string {
  return path.join(getProjectRoot(), 'client', 'dist');
}
