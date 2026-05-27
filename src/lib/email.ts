// Email sending via Resend REST API.
// All functions degrade gracefully when RESEND_API_KEY is not set.

const FROM = process.env.EMAIL_FROM ?? "StayNest <onboarding@resend.dev>";
const AGENT_EMAIL = process.env.AGENT_EMAIL ?? "nyakundibrian316@gmail.com";

async function send(to: string | string[], subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — skipping:", subject);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from: FROM, to: Array.isArray(to) ? to : [to], subject, html })
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("[email] Resend error:", res.status, body);
  }
}

// ---- HTML base ----

function base(content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:system-ui,-apple-system,sans-serif;color:#11151c">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding:32px 16px">
      <table width="100%" style="max-width:560px" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td style="background:#ef6a2b;padding:20px 28px;border-radius:12px 12px 0 0">
          <span style="color:white;font-size:22px;font-weight:600;font-family:Georgia,serif;letter-spacing:-0.5px">StayNest</span>
        </td></tr>
        <tr><td style="background:white;padding:32px 28px;border-radius:0 0 12px 12px;line-height:1.6">
          ${content}
        </td></tr>
        <tr><td style="padding:20px;text-align:center;color:#7a8497;font-size:12px">
          StayNest &middot; Nairobi, Kenya &middot; <a href="mailto:${AGENT_EMAIL}" style="color:#7a8497">Contact us</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 0;color:#566073;font-size:14px;width:140px">${label}</td>
    <td style="padding:6px 0;font-size:14px;font-weight:500">${value}</td>
  </tr>`;
}

function divider() {
  return `<div style="border-top:1px solid #eceef1;margin:20px 0"></div>`;
}

function pill(text: string, color = "#ef6a2b") {
  return `<span style="display:inline-block;background:${color}1a;color:${color};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:3px 10px;border-radius:99px">${text}</span>`;
}

// ---- Guest: booking received ----

export async function emailBookingReceived(opts: {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  propertyName: string;
  propertyLocation: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  manageUrl?: string | null;
}) {
  const firstName = opts.guestName.split(" ")[0];
  const html = base(`
    <p style="font-size:15px;margin:0 0 4px">Hi ${firstName},</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.2">We&rsquo;ve received your booking request.</h1>
    <p style="color:#566073;font-size:14px;margin:0 0 20px">
      Our team will reach out to confirm your stay and arrange payment. You&rsquo;ll hear from us on <strong>${opts.guestPhone}</strong> shortly.
    </p>
    ${divider()}
    <p style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#566073;margin:0 0 12px">Booking summary</p>
    <table cellpadding="0" cellspacing="0" width="100%">
      ${row("Property", opts.propertyName)}
      ${row("Location", opts.propertyLocation)}
      ${row("Check-in", opts.checkIn)}
      ${row("Check-out", opts.checkOut)}
      ${row("Nights", String(opts.nights))}
      ${row("Total", `KSH ${opts.total.toLocaleString("en-KE")}`)}
    </table>
    ${opts.manageUrl ? `
      ${divider()}
      <p style="font-size:13px;color:#566073;margin:0 0 12px">
        Need to view or cancel your booking? Use this private link — keep it safe.
      </p>
      <a href="${opts.manageUrl}" style="display:inline-block;background:#ef6a2b;color:white;text-decoration:none;font-size:14px;font-weight:600;padding:10px 22px;border-radius:10px">
        Manage your booking
      </a>
    ` : ""}
    ${divider()}
    <p style="font-size:13px;color:#566073;margin:0">
      Questions? Reply to this email or call us at +254 708 781 407.
    </p>
  `);
  await send(opts.guestEmail, `Booking request received — ${opts.propertyName}`, html);
}

// ---- Agent: new booking notification ----

export async function emailBookingAlert(opts: {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  ownerPayout: number;
  agentProfit: number;
  bookingId: string;
}) {
  const html = base(`
    <p style="margin:0 0 4px">${pill("New booking")}</p>
    <h1 style="margin:8px 0 16px;font-size:22px;font-weight:700;line-height:1.2">${opts.propertyName}</h1>
    <table cellpadding="0" cellspacing="0" width="100%">
      ${row("Guest", opts.guestName)}
      ${row("Phone", opts.guestPhone)}
      ${row("Email", opts.guestEmail)}
      ${row("Check-in", opts.checkIn)}
      ${row("Check-out", opts.checkOut)}
      ${row("Nights", String(opts.nights))}
    </table>
    ${divider()}
    <table cellpadding="0" cellspacing="0" width="100%">
      ${row("Client total", `KSH ${opts.total.toLocaleString("en-KE")}`)}
      ${row("Owner payout", `KSH ${opts.ownerPayout.toLocaleString("en-KE")}`)}
      ${row("Your profit", `<strong style="color:#ef6a2b">KSH ${opts.agentProfit.toLocaleString("en-KE")}</strong>`)}
    </table>
    ${divider()}
    <p style="font-size:12px;color:#7a8497;margin:0">Booking ID: ${opts.bookingId}</p>
  `);
  await send(AGENT_EMAIL, `New booking — ${opts.propertyName} (${opts.nights} nights)`, html);
}

// ---- Guest: payment confirmed ----

export async function emailPaymentConfirmed(opts: {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  receiptNumber?: string | null;
  manageUrl?: string | null;
}) {
  const firstName = opts.guestName.split(" ")[0];
  const html = base(`
    <p style="margin:0 0 4px">${pill("Confirmed", "#059669")}</p>
    <h1 style="margin:8px 0 16px;font-size:22px;font-weight:700;line-height:1.2">You&rsquo;re all set, ${firstName}!</h1>
    <p style="color:#566073;font-size:14px;margin:0 0 20px">
      Your payment was received and your stay at <strong>${opts.propertyName}</strong> is confirmed.
    </p>
    ${divider()}
    <table cellpadding="0" cellspacing="0" width="100%">
      ${row("Property", opts.propertyName)}
      ${row("Check-in", opts.checkIn)}
      ${row("Check-out", opts.checkOut)}
      ${row("Nights", String(opts.nights))}
      ${row("Amount paid", `KSH ${opts.total.toLocaleString("en-KE")}`)}
      ${opts.receiptNumber ? row("M-Pesa receipt", `<code style="font-family:monospace">${opts.receiptNumber}</code>`) : ""}
    </table>
    ${opts.manageUrl ? `
      ${divider()}
      <p style="font-size:13px;color:#566073;margin:0 0 12px">
        Need to view your booking later? Use your private link.
      </p>
      <a href="${opts.manageUrl}" style="display:inline-block;background:#ef6a2b;color:white;text-decoration:none;font-size:14px;font-weight:600;padding:10px 22px;border-radius:10px">
        Manage your booking
      </a>
    ` : ""}
    ${divider()}
    <p style="font-size:13px;color:#566073;margin:0">
      Need to make changes? Contact us at +254 708 781 407.
    </p>
  `);
  await send(opts.guestEmail, `Booking confirmed — ${opts.propertyName}`, html);
}

// ---- Guest: booking cancelled ----

export async function emailBookingCancelled(opts: {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
}) {
  const firstName = opts.guestName.split(" ")[0];
  const html = base(`
    <p style="margin:0 0 4px">${pill("Cancelled", "#dc2626")}</p>
    <h1 style="margin:8px 0 16px;font-size:22px;font-weight:700;line-height:1.2">Your booking has been cancelled.</h1>
    <p style="color:#566073;font-size:14px;margin:0 0 20px">
      Hi ${firstName}, your booking for <strong>${opts.propertyName}</strong> (${opts.checkIn} → ${opts.checkOut}) has been cancelled.
      If this was unexpected, please contact us immediately.
    </p>
    ${divider()}
    <p style="font-size:13px;color:#566073;margin:0">
      Reach us at +254 708 781 407 or reply to this email.
    </p>
  `);
  await send(opts.guestEmail, `Booking cancelled — ${opts.propertyName}`, html);
}

// ---- Host: guest cancelled their booking ----

export async function emailBookingCancelledHost(opts: {
  hostName: string;
  hostEmail: string;
  guestName: string;
  propertyName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  reason?: string | null;
  isLate: boolean;
}) {
  const firstName = opts.hostName.split(" ")[0];
  const html = base(`
    <p style="margin:0 0 4px">${pill("Cancelled", "#dc2626")}</p>
    <h1 style="margin:8px 0 16px;font-size:22px;font-weight:700;line-height:1.2">
      A booking on ${opts.propertyName} was cancelled.
    </h1>
    <p style="color:#566073;font-size:14px;margin:0 0 20px">
      Hi ${firstName}, ${opts.guestName} cancelled their stay.
      ${opts.isLate
        ? "This is a <strong>late cancellation</strong> — within 48 hours of check-in."
        : "This is a free cancellation — more than 48 hours before check-in."}
    </p>
    ${divider()}
    <table cellpadding="0" cellspacing="0" width="100%">
      ${row("Guest", opts.guestName)}
      ${row("Check-in", opts.checkIn)}
      ${row("Check-out", opts.checkOut)}
      ${row("Nights", String(opts.nights))}
    </table>
    ${opts.reason ? `${divider()}<p style="font-size:14px;color:#2e3543;font-style:italic">&ldquo;${opts.reason}&rdquo;</p>` : ""}
    ${divider()}
    <p style="font-size:13px;color:#566073;margin:0">
      Sign in to your host dashboard to see the updated calendar.
    </p>
  `);
  await send(opts.hostEmail, `Cancelled — ${opts.propertyName} (${opts.checkIn})`, html);
}

// ---- Guest: resend their manage links ----

export async function emailBookingLinks(opts: {
  email: string;
  bookings: Array<{
    propertyName: string;
    checkIn: string;
    checkOut: string;
    status: string;
    manageUrl: string;
  }>;
}) {
  if (opts.bookings.length === 0) return;
  const rows = opts.bookings.map((b) => `
    <tr><td style="padding:14px 0;border-top:1px solid #eceef1">
      <div style="font-weight:600;font-size:15px">${b.propertyName}</div>
      <div style="color:#566073;font-size:13px;margin-top:2px">
        ${b.checkIn} → ${b.checkOut} · ${b.status}
      </div>
      <a href="${b.manageUrl}" style="display:inline-block;margin-top:8px;background:#ef6a2b;color:white;text-decoration:none;font-size:13px;font-weight:600;padding:8px 16px;border-radius:8px">
        Open booking
      </a>
    </td></tr>
  `).join("");
  const html = base(`
    <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;line-height:1.2">Your booking links</h1>
    <p style="color:#566073;font-size:14px;margin:0 0 16px">
      Here ${opts.bookings.length === 1 ? "is the booking" : `are the ${opts.bookings.length} active bookings`} we found on this email.
      Each link is private — keep it to yourself.
    </p>
    <table cellpadding="0" cellspacing="0" width="100%">
      ${rows}
    </table>
    ${divider()}
    <p style="font-size:13px;color:#566073;margin:0">
      Didn&rsquo;t request this? You can safely ignore the email.
    </p>
  `);
  await send(opts.email, `Your StayNest booking link${opts.bookings.length > 1 ? "s" : ""}`, html);
}

// ---- Guest: inquiry received ----

const INQUIRY_LABELS: Record<string, string> = {
  viewing: "viewing request",
  offer: "offer",
  lease_application: "lease application"
};

export async function emailInquiryReceived(opts: {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  kind: string;
}) {
  const firstName = opts.guestName.split(" ")[0];
  const kindLabel = INQUIRY_LABELS[opts.kind] ?? opts.kind;
  const html = base(`
    <p style="font-size:15px;margin:0 0 4px">Hi ${firstName},</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.2">
      We&rsquo;ve received your ${kindLabel}.
    </h1>
    <p style="color:#566073;font-size:14px;margin:0 0 20px">
      Thank you for your interest in <strong>${opts.propertyName}</strong>.
      Our team will review your ${kindLabel} and get back to you within the hour.
    </p>
    ${divider()}
    <p style="font-size:13px;color:#566073;margin:0">
      Questions? Reply to this email or call us at +254 708 781 407.
    </p>
  `);
  await send(opts.guestEmail, `${kindLabel.charAt(0).toUpperCase() + kindLabel.slice(1)} received — ${opts.propertyName}`, html);
}

// ---- Agent: new inquiry notification ----

export async function emailInquiryAlert(opts: {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  propertyName: string;
  kind: string;
  preferredDate?: string | null;
  offerAmount?: number | null;
  moveInDate?: string | null;
  leaseTermMonths?: number | null;
  message?: string | null;
}) {
  const kindLabel = INQUIRY_LABELS[opts.kind] ?? opts.kind;
  const html = base(`
    <p style="margin:0 0 4px">${pill("New inquiry")}</p>
    <h1 style="margin:8px 0 16px;font-size:22px;font-weight:700;line-height:1.2">
      ${opts.propertyName}
    </h1>
    <table cellpadding="0" cellspacing="0" width="100%">
      ${row("Type", kindLabel)}
      ${row("Guest", opts.guestName)}
      ${row("Phone", opts.guestPhone)}
      ${row("Email", opts.guestEmail)}
      ${opts.preferredDate ? row("Viewing date", opts.preferredDate) : ""}
      ${opts.offerAmount ? row("Offer", `KSH ${opts.offerAmount.toLocaleString("en-KE")}`) : ""}
      ${opts.moveInDate ? row("Move-in", opts.moveInDate) : ""}
      ${opts.leaseTermMonths ? row("Lease term", `${opts.leaseTermMonths} months`) : ""}
    </table>
    ${opts.message ? `${divider()}<p style="font-size:14px;color:#2e3543;font-style:italic">&ldquo;${opts.message}&rdquo;</p>` : ""}
  `);
  await send(AGENT_EMAIL, `New ${kindLabel} — ${opts.propertyName}`, html);
}

// ---- Guest: review request after checkout ----

export async function emailReviewRequest(opts: {
  guestName: string;
  guestEmail: string;
  propertyName: string;
  checkOut: string;
  bookingId: string;
}) {
  const firstName = opts.guestName.split(" ")[0];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://staynest.co.ke";
  const reviewUrl = `${appUrl}/review/${opts.bookingId}`;
  const html = base(`
    <p style="font-size:15px;margin:0 0 4px">Hi ${firstName},</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.2">
      How was your stay at ${opts.propertyName}?
    </h1>
    <p style="color:#566073;font-size:14px;margin:0 0 24px">
      We hope you had a wonderful time. It takes less than a minute to share your feedback —
      your review helps other travellers and keeps our hosts accountable.
    </p>
    <a href="${reviewUrl}" style="display:inline-block;background:#ef6a2b;color:white;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:10px">
      Leave a review
    </a>
    ${divider()}
    <p style="font-size:12px;color:#7a8497;margin:0">
      Or copy this link: <a href="${reviewUrl}" style="color:#7a8497">${reviewUrl}</a>
    </p>
  `);
  await send(opts.guestEmail, `How was ${opts.propertyName}? Leave a quick review`, html);
}

// ---- Agent: contact form ----

export async function emailContactForm(opts: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const html = base(`
    <p style="margin:0 0 4px">${pill("Contact form")}</p>
    <h1 style="margin:8px 0 16px;font-size:22px;font-weight:700;line-height:1.2">
      ${opts.subject || "Message from website"}
    </h1>
    <table cellpadding="0" cellspacing="0" width="100%">
      ${row("From", opts.name)}
      ${row("Email", opts.email)}
    </table>
    ${divider()}
    <p style="font-size:14px;white-space:pre-wrap;color:#2e3543">${opts.message}</p>
    ${divider()}
    <p style="font-size:12px;color:#7a8497;margin:0">Reply directly to this email to respond to ${opts.name}.</p>
  `);
  await send(AGENT_EMAIL, `Contact: ${opts.subject || opts.name}`, html);
}

// ---- Guest: restock / availability notification ----

export async function emailRestockAvailable(opts: {
  email: string;
  propertyName: string;
  propertyUrl: string;
}) {
  const html = base(`
    <p style="margin:0 0 4px">${pill("Available", "#059669")}</p>
    <h1 style="margin:8px 0 16px;font-size:22px;font-weight:700;line-height:1.2">
      ${opts.propertyName} is available again.
    </h1>
    <p style="color:#566073;font-size:14px;margin:0 0 24px">
      You asked us to notify you when this listing came back online. Availability can change quickly, so check the listing when you can.
    </p>
    <a href="${opts.propertyUrl}" style="display:inline-block;background:#ef6a2b;color:white;text-decoration:none;font-size:15px;font-weight:600;padding:12px 28px;border-radius:10px">
      View listing
    </a>
    ${divider()}
    <p style="font-size:12px;color:#7a8497;margin:0">
      Or copy this link: <a href="${opts.propertyUrl}" style="color:#7a8497">${opts.propertyUrl}</a>
    </p>
  `);
  await send(opts.email, `${opts.propertyName} is available again`, html);
}
