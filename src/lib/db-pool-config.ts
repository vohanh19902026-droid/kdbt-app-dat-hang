const DEFAULT_POOL_MAX = 2;
const MAX_POOL_MAX = 20;

export function getDbPoolMax(raw = process.env.DB_POOL_MAX): number {
  if (!raw) return DEFAULT_POOL_MAX;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return DEFAULT_POOL_MAX;
  return Math.min(parsed, MAX_POOL_MAX);
}
