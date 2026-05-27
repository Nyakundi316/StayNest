export const ADMIN_SESSION_COOKIE = "staynest_admin_session";

const SESSION_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

interface AdminSessionPayload {
  email: string;
  exp: number;
}

function cookieSecret(): string | null {
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
  const secret = cookieSecret();
  if (!secret) {
    throw new Error("ADMIN_COOKIE_SECRET or SUPABASE_SERVICE_ROLE_KEY must be configured.");
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

function constantTimeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function adminSessionMaxAge(): number {
  return SESSION_SECONDS;
}

export async function createAdminSessionCookie(email: string): Promise<string> {
  const payload: AdminSessionPayload = {
    email: email.toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = await sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifyAdminSessionCookie(raw?: string): Promise<AdminSessionPayload | null> {
  if (!raw) return null;
  const [encodedPayload, signature] = raw.split(".");
  if (!encodedPayload || !signature) return null;

  try {
    const expected = await sign(encodedPayload);
    if (!constantTimeEqual(signature, expected)) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AdminSessionPayload;
    if (!payload.email || !payload.exp) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
