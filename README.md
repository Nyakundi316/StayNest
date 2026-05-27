# StayNest

A modern BnB booking platform built with Next.js (App Router), TypeScript, Tailwind CSS, Framer Motion and **Supabase**.

StayNest runs a **second-party agent** model: property owners give you a base price, you add a markup, the client only ever sees the final price. The Admin dashboard is the single place where owner price, markup, profit and payouts are visible.

## Quick start

```bash
# 1. Install dependencies (includes @supabase/supabase-js)
npm install

# 2. Run the dev server
npm run dev

# 3. Open http://localhost:3000
```

For a production build:

```bash
npm run build
npm run start
```

The `.env.local` file is already populated with your Supabase project URL and anon/publishable keys. The Supabase project (`mszxurlwgxwjhlbrcwvd` — "StayNest") has been provisioned with three tables, a public-safe view, RLS policies and 8 properties / 4 owners / 4 sample bookings.

## Project structure

```
.
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── .env.local            # Supabase URL + keys (committed for this prototype)
├── .env.example
└── src/
    ├── app/
    │   ├── layout.tsx, globals.css, page.tsx (Home), not-found.tsx
    │   ├── listings/page.tsx, listings/[id]/page.tsx
    │   ├── booking/[id]/page.tsx
    │   ├── admin/page.tsx, admin/add-property/page.tsx, admin/owners/page.tsx
    │   └── about/page.tsx, contact/page.tsx
    ├── components/   # Navbar, Footer, HeroSection, SearchBar, PropertyCard,
    │                 # FeaturedStays, PopularLocations, WhyChoose, HostCTA,
    │                 # FilterSidebar, BookingCard, AmenityBadge,
    │                 # SectionHeader, Button
    └── lib/
        ├── supabase.ts   # Browser/server Supabase client
        ├── types.ts      # Property, Booking, Owner, Filters
        ├── pricing.ts    # Markup logic + breakdown helpers
        └── data.ts       # Async Supabase queries + writes
```

## Production backend

This project does not currently include a `/backend` FastAPI service. The production backend is the Next.js App Router API surface under `src/app/api`, backed by Supabase and guarded by the existing admin/session checks where required.

If a FastAPI service is reintroduced later, treat it as optional or legacy until ownership is explicitly documented. Do not move checkout, M-Pesa, admin, inventory, auth, or SEO logic away from the Next.js route handlers without a migration plan.

## How the markup model works

All pricing logic lives in `src/lib/pricing.ts`.

```
clientPrice = ownerBasePrice + markup
ownerPayout = ownerBasePrice * nights
agentProfit = markup * nights
clientTotal = clientPrice * nights + serviceFee
```

- The **client UI** (`PropertyCard`, `BookingCard`, listing/detail pages) never reads `ownerBasePrice`, `markup`, `agentProfit` or `ownerPayout`. It only ever calls `clientPricePerNight()` or `buildPriceBreakdown().total`.
- The **admin UI** (`/admin`, `/admin/owners`, `/admin/add-property`) is the only place those internal numbers appear.

## Pages

| Route | What it does |
|---|---|
| `/` | Hero, search, featured stays (live from Supabase), popular cities, host CTA |
| `/listings` | Filterable grid (location, price, type, guests) |
| `/listings/[id]` | Gallery, amenities, rules, host info, booking sidebar |
| `/booking/[id]` | Booking form — submits to `bookings` table |
| `/admin` | Agent dashboard — totals, bookings, properties, owners |
| `/admin/add-property` | Creates owner (or reuses by phone) + property in Supabase |
| `/admin/owners` | Owners and their properties, with payouts and profit |
| `/about` | Story, mission, trust & safety |
| `/contact` | Form + phone/email/address |

## Database schema

Three tables under `public`:

- `owners (id uuid pk, name, phone, email, payout_method, created_at)`
- `properties (id uuid pk, name, location, city, type, description, images jsonb,
   bedrooms, bathrooms, guests, owner_base_price, markup, amenities text[],
   rules text[], rating, reviews, available, owner_id fk → owners, created_at)`
- `bookings (id uuid pk, property_id fk → properties, guest_name, guest_email,
   guest_phone, check_in date, check_out date, guests, nights, price_per_night,
   subtotal, service_fee, total, owner_payout, agent_profit, status, created_at)`

A public-safe view `public.properties_public` exposes only `price_per_night`
(computed) and the non-sensitive columns. It uses `security_invoker = true`,
so RLS still applies.

### RLS policies

- `properties_public_read` — anyone may SELECT properties (the UI deliberately
  doesn't display owner price / markup / owner_id).
- `bookings_insert_anyone` — anyone may INSERT a booking request.
- `bookings_read_open` — anyone may SELECT bookings (prototype only).
- `owners_read_open` — anyone may SELECT owners (prototype only).

> **Security note** — these policies are open for the prototype. Before going
> to production, gate `properties` columns and the `bookings`/`owners` tables
> behind authenticated admin access. See **Hardening for production** below.

## Auth (next step)

1. Enable email or phone auth in the Supabase dashboard.
2. Add a `profiles` table:
   ```sql
   create table public.profiles (
     id uuid primary key references auth.users on delete cascade,
     role text not null default 'guest' check (role in ('guest','agent','admin'))
   );
   ```
3. Tighten the RLS policies (replace each "anyone" rule with
   `using ((select role from profiles where id = auth.uid()) = 'admin')` for
   admin-only paths).
4. Wrap `/admin/*` in middleware that redirects unauthenticated users:
   ```ts
   // src/middleware.ts
   import { createMiddlewareClient } from "@supabase/ssr";
   // …redirect if no session and pathname starts with "/admin"
   ```

## Hardening for production

Before going live, run this migration to lock down internal fields:

```sql
-- Block public reads from the raw properties table; force them through the view.
drop policy "properties_public_read" on public.properties;
create policy "properties_admin_read" on public.properties
  for select using (
    (select role from public.profiles where id = auth.uid()) in ('admin','agent')
  );

-- Public visitors read the safe view instead.
grant select on public.properties_public to anon, authenticated;
```

In `src/lib/data.ts`, swap `from("properties")` → `from("properties_public")`
for every public-facing read and update the row mapper.

## Payments (next step)

- **M-Pesa Daraja** — store `MPESA_*` keys in `.env.local` and call Daraja STK push from `src/app/api/mpesa/route.ts`.
- **Stripe** — `STRIPE_SECRET_KEY` for card checkout. After success, mark booking `status='confirmed'` and trigger an owner payout webhook.

## Image uploads (next step)

Create a Supabase Storage bucket `property-images`, then in `/admin/add-property` replace the URL textbox with `supabase.storage.from('property-images').upload(...)`. Push the resulting public URL into the `images` jsonb array.

## Stack

- Next.js 16 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React (icons)
- @supabase/supabase-js
