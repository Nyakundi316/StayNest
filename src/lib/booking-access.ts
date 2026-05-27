// HMAC-signed magic link tokens for anonymous guests to come back to their
// booking. Same secret as the admin/host session cookies. Tokens carry the
// booking id + email + expiry — they're not session cookies, they're shared
// via email link, so they're URL-safe base64.

const DEFAULT_TTL_DAYS = 90;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface BookingAccessPayload {
  bookingId: string;
  email: string;
  exp: number;
}

function secret(): string | null {
  return process.env.ADMIN_COOKIE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64UrlEncode(value: string): string {
  return bytesToBase64Url(encoder.encode(value));
}

function base64UrlDecode(value: string): string {
  return decoder.decode(base64UrlToBytes(value));
}

async function sign(value: string): Promise<string> {
  const key = secret();
  if (!key) throw new Error("ADMIN_COOKIE_SECRET or SUPABASE_SERVICE_ROLE_KEY must be configured.");
  const k = await crypto.subtle.importKey(
    "raw", encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", k, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(sig));
}

function constantTimeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export async function createBookingAccessToken(
  bookingId: string,
  email: string,
  ttlDays: number = DEFAULT_TTL_DAYS
): Promise<string> {
  const payload: BookingAccessPayload = {
    bookingId,
    email: email.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + ttlDays * 24 * 60 * 60
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(encoded);
  return `${encoded}.${signature}`;
}

export async function verifyBookingAccessToken(
  raw: string | null | undefined,
  expectedBookingId: string
): Promise<BookingAccessPayload | null> {
  if (!raw) return null;
  const [encoded, signature] = raw.split(".");
  if (!encoded || !signature) return null;

  try {
    const expected = await sign(encoded);
    if (!constantTimeEqual(signature, expected)) return null;

    const payload = JSON.parse(base64UrlDecode(encoded)) as BookingAccessPayload;
    if (!payload.bookingId || !payload.email || !payload.exp) return null;
    if (payload.bookingId !== expectedBookingId) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Pass the incoming request origin (req.nextUrl.origin) when you have one —
// that way emails sent during prod, staging, ngrok and localhost all link to
// the same hostname the user is actually visiting. Falls back to env vars
// for background jobs that don't have a request.
export function manageBookingUrl(
  bookingId: string,
  token: string,
  origin?: string | null
): string {
  const base = resolveBase(origin).replace(/\/$/, "");
  return `${base}/booking/${bookingId}/manage?token=${encodeURIComponent(token)}`;
}

function resolveBase(origin?: string | null): string {
  if (origin) return origin;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
