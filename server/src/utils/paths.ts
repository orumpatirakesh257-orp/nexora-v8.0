import { existsSync } from 'fs';
import path from 'path';

/** Nexora monorepo root (contains client/, server/, .env). */
export function getProjectRoot(): string {
  let dir = path.resolve(process.cwd());
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
  return path.resolve(process.cwd(), '..');
}

export function getEnvPath(): string {
  return path.join(getProjectRoot(), '.env');
}

export function getClientDistPath(): string {
  return path.join(getProjectRoot(), 'client', 'dist');
}
