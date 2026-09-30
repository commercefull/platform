import type { HttpHandler } from './http';

export interface HppOptions {
  /** Parameter names allowed to carry array values. */
  whitelist?: string[];
}

function dedupe(source: Record<string, unknown> | undefined, whitelist: Set<string>): void {
  if (!source || typeof source !== 'object') {
    return;
  }
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value) && !whitelist.has(key)) {
      source[key] = value[value.length - 1];
    }
  }
}

/**
 * HTTP Parameter Pollution protection — collapses repeated query/body
 * parameters to their last value unless the parameter is whitelisted.
 *
 * Mutates `req.query`/`req.body` in place so it works with Express 5's
 * getter-based `req.query`.
 */
export function hpp(options: HppOptions = {}): HttpHandler {
  const whitelist = new Set(options.whitelist ?? []);
  return (req, _res, next) => {
    dedupe(req.query as Record<string, unknown>, whitelist);
    dedupe(req.body as Record<string, unknown> | undefined, whitelist);
    next();
  };
}
