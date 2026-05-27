// Central StayNest contact + brand config.
// One accountable StayNest line handles booking, viewing, payment,
// complaints and refunds — every CTA on the site routes here.

export const SITE = {
  name: "StayNest",
  phoneDisplay: "+254 708 781 407",
  phoneTel: "+254708781407",
  // Digits only, international format — used to build wa.me links.
  whatsapp: "254708781407",
  email: "nyakundibrian316@gmail.com",
  city: "Nairobi, Kenya",
  responseTime: "Typically replies within 1 hour"
} as const;

export type WhatsAppIntent =
  | "ask"
  | "viewing"
  | "directions"
  | "availability"
  | "mpesa";

// Prebuilt, intent-specific openers so the StayNest agent immediately
// knows what the visitor needs.
function intentMessage(intent: WhatsAppIntent, propertyName?: string): string {
  const ref = propertyName ? ` for "${propertyName}"` : "";
  switch (intent) {
    case "viewing":
      return `Hi StayNest, I'd like to schedule a viewing${ref}.`;
    case "directions":
      return `Hi StayNest, could you share directions${ref}?`;
    case "availability":
      return `Hi StayNest, can you confirm current availability${ref}?`;
    case "mpesa":
      return `Hi StayNest, I'm ready to pay${ref} — please send the M-Pesa prompt.`;
    case "ask":
    default:
      return `Hi StayNest, I have a question${ref}.`;
  }
}

/** Build a wa.me deep link with a prefilled, intent-aware message. */
export function whatsappLink(intent: WhatsAppIntent, propertyName?: string): string {
  const text = encodeURIComponent(intentMessage(intent, propertyName));
  return `https://wa.me/${SITE.whatsapp}?text=${text}`;
}
