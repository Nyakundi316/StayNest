import { NextRequest } from "next/server";

// Upstash Redis via plain REST — no npm dep, edge-runtime safe.
// Provision a database at https://console.upstash.com/, then set:
//   UPSTASH_REDIS_REST_URL=https://<region>-<name>.upstash.io
//   UPSTASH_REDIS_REST_TOKEN=<the REST token>
// If either is missing, every request is allowed (fail-open) so local
// dev and preview deploys don't break — a warning is logged so you notice.

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the current window resets. */
  resetIn: number;
}

interface RateLimitOpts {
  /** Logical name of the limited action, e.g. "booking-find". */
  key: string;
  /** Per-IP identifier; usually `clientIp(req)`. */
  identifier: string;
  /** Max requests allowed inside the window. */
  max: number;
  /** Window length in seconds. */
  windowSec: number;
}

export async function rateLimit(opts: RateLimitOpts): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      console.warn(`[rate-limit] UPSTASH_* missing — '${opts.key}' is unguarded`);
    }
    return { ok: true, remaining: opts.max, resetIn: opts.windowSec };
  }

  const bucket = Math.floor(Date.now() / 1000 / opts.windowSec);
  const bucketKey = `rl:${opts.key}:${opts.identifier}:${bucket}`;

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      // INCR atomically counts; EXPIRE NX sets the TTL only on the first
      // hit, so the window can't be extended by a sustained attacker.
      body: JSON.stringify([
        ["INCR", bucketKey],
        ["EXPIRE", bucketKey, String(opts.windowSec), "NX"]
      ]),
      cache: "no-store"
    });

    if (!res.ok) {
      console.error("[rate-limit] upstream non-200:", res.status, await res.text());
      return { ok: true, remaining: opts.max, resetIn: opts.windowSec };
    }

    const parsed = (await res.json()) as Array<{ result: number | string }>;
    const count = Number(parsed[0]?.result ?? 0);

    const nextBucketStart = (bucket + 1) * opts.windowSec;
    const resetIn = Math.max(1, nextBucketStart - Math.floor(Date.now() / 1000));

    return {
      ok: count <= opts.max,
      remaining: Math.max(0, opts.max - count),
      resetIn
    };
  } catch (err) {
    console.error("[rate-limit] error:", err);
    return { ok: true, remaining: opts.max, resetIn: opts.windowSec };
  }
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "anon";
}
