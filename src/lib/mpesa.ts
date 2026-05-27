export type MpesaEnv = "sandbox" | "production";

export interface MpesaConfig {
  env: MpesaEnv;
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  shortcode: string;
  passkey: string;
  callbackUrl: string;
  callbackSecret: string;
}

const REQUIRED_ENV = [
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "MPESA_SHORTCODE",
  "MPESA_PASSKEY",
  "MPESA_CALLBACK_URL",
  "MPESA_CALLBACK_SECRET"
] as const;

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function getMpesaConfig():
  | { ok: true; config: MpesaConfig }
  | { ok: false; missing: string[] } {
  const missing = REQUIRED_ENV.filter((name) => !readEnv(name));
  if (missing.length > 0) return { ok: false, missing: [...missing] };

  const env: MpesaEnv = process.env.MPESA_ENV === "production" ? "production" : "sandbox";
  const callbackUrl = readEnv("MPESA_CALLBACK_URL");

  try {
    const parsed = new URL(callbackUrl);
    if (env === "production" && parsed.protocol !== "https:") {
      return { ok: false, missing: ["MPESA_CALLBACK_URL_HTTPS"] };
    }
  } catch {
    return { ok: false, missing: ["MPESA_CALLBACK_URL_VALID"] };
  }

  return {
    ok: true,
    config: {
      env,
      baseUrl:
        env === "production"
          ? "https://api.safaricom.co.ke"
          : "https://sandbox.safaricom.co.ke",
      consumerKey: readEnv("MPESA_CONSUMER_KEY"),
      consumerSecret: readEnv("MPESA_CONSUMER_SECRET"),
      shortcode: readEnv("MPESA_SHORTCODE"),
      passkey: readEnv("MPESA_PASSKEY"),
      callbackUrl,
      callbackSecret: readEnv("MPESA_CALLBACK_SECRET")
    }
  };
}

export function normalizeMpesaPhone(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/\D/g, "");
  const phone = digits.startsWith("254")
    ? digits
    : digits.startsWith("0")
      ? `254${digits.slice(1)}`
      : `254${digits}`;

  // Kenyan M-Pesa MSISDNs are sent to Daraja in 2547XXXXXXXX / 2541XXXXXXXX form.
  return /^254(?:7|1)\d{8}$/.test(phone) ? phone : null;
}

export function callbackUrlWithSecret(config: MpesaConfig): string {
  const url = new URL(config.callbackUrl);
  url.searchParams.set("token", config.callbackSecret);
  return url.toString();
}

export function timingSafeEqual(a: string, b: string): boolean {
  const max = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < max; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}
