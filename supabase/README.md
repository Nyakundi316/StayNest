# StayNest — Supabase

## Migration files (canonical schema)

`migrations/` is the source of truth for the database schema. Applied in order,
these five files reproduce the full production schema on any fresh project:

| File | What it creates |
|---|---|
| `20250510000001_initial_schema.sql` | `owners`, `properties`, `bookings`, `inquiries`, `reviews` + the `update_property_rating` trigger |
| `20250510000002_rls_policies.sql` | Initial (open) RLS policies |
| `20250510000003_security_hardening.sql` | `archived` flags, `review_token`, the `properties_public` view, locks down raw tables, `bookings_no_overlap` constraint |
| `20250523000004_launch_features.sql` | `restock_subscriptions`, `recently_viewed_properties`, view rebuilt to show unavailable listings |
| `20250523000005_storage_property_images.sql` | The `property-images` storage bucket + its policies |

## Fresh project setup

```bash
supabase link --project-ref <new-project-ref>
supabase db push          # applies all five migrations in order
```

## Reconciling with the existing project (`mszxurlwgxwjhlbrcwvd`)

The live project was built through the Supabase MCP, so its remote migration
history (`supabase_migrations.schema_migrations`) holds 11 rows with different
version IDs than the five files here. The **schema already matches these files** —
only the history table is out of sync.

To make the CLI treat the live project as up to date (so `supabase db push`
becomes a no-op instead of re-running everything), mark the five files as
already applied:

```bash
supabase migration repair --status applied 20250510000001
supabase migration repair --status applied 20250510000002
supabase migration repair --status applied 20250510000003
supabase migration repair --status applied 20250523000004
supabase migration repair --status applied 20250523000005
```

The 11 MCP-created history rows are harmless and can be left in place, or
cleared with `supabase migration repair --status reverted <version>` for each.

After that, `supabase migration list` should show local and remote in sync.

## Seed data

The migration files contain **schema only**. The live database holds sample
data (14 properties, 4 owners, 5 bookings, 1 inquiry) that was seeded directly
and is not version-controlled. A fresh project created from these migrations
starts empty — add listings through the admin dashboard, or create a
`supabase/seed.sql` if you want reproducible sample data.

## Going forward

Make all future schema changes by adding a new numbered file to `migrations/`
(not through the dashboard or MCP), so the files and the database never drift
apart again.
