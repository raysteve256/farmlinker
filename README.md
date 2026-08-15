# Farm Linker

One platform for Mukono's poultry farmers — marketplace, suppliers, vets, and community — built for the AYuTe Africa Challenge Uganda 2026 (AgriTech Track, Digital market linkage, traceability & access to finance).

**Live backend:** real Supabase project (Postgres + Auth + Storage), not a demo/localStorage build. Every listing, chat, vet request, and notification reads and writes to the same database.

## Stack
React 18 + Vite, Supabase (Postgres, Auth, Storage), `vite-plugin-pwa` (installable, offline-capable), Netlify-ready.

## Run locally
```bash
npm install
cp .env.example .env   # fill in your Supabase anon key
npm run dev
```

## How login works right now
There's no password or OTP yet. Tapping a demo account (or creating a new one) opens a real Supabase **anonymous auth session** and attaches it to that profile row — so every write is still attributable and enforced by Row Level Security, it's just not credential-protected. Anyone who taps "Nakato F." becomes Nakato F. for that session. This is a deliberate, documented interim step — see **Known limitations** below for what real auth would add.

## Database
Full schema — tables, RLS policies, and the storage bucket — lives in `supabase/schema.sql`. It's already applied to the live project this app points to by default. To point this app at a **different** Supabase project:
1. Create a new project at supabase.com
2. Run `supabase/schema.sql` in its SQL Editor
3. Update `.env` with the new project's URL and anon key

## Deploy to Netlify
```bash
npm run build
```
Build command: `npm run build`. Publish directory: `dist`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in Netlify's site settings (same values as your `.env`).

## What's built
- **Login** — real accounts backed by Supabase `profiles`, tap-to-login demo flow (see above)
- **Home** — role-based quick actions (Farmer/Buyer/Supplier/Vet each see different shortcuts)
- **Marketplace** — post/browse live birds and eggs, search by title/location/farmer, filter by type, traceability QR + public verification page per listing
- **Suppliers** — feed, chicks, equipment, drugs & vaccines, searchable and filterable
- **Vets** — Farmers see their own requests; Vets see all open requests with Accept/Resolve actions
- **Community** — Feed (posts with photo upload via Supabase Storage) and Groups (role-based: Mukono Farmers, Suppliers Network, Vets Circle, Buyers Hub)
- **Chats** — real direct messages and group chats, persisted in Postgres, with unread counts and image sharing
- **Notifications** — new messages and posts generate real notification rows per recipient
- **Settings** — notification toggles, language selector (English/Luganda — UI only, not yet translated)

## Proximity search
Profiles carry real latitude/longitude (captured via the browser's Geolocation API, with a manual "Share my location" option in Settings — never required, always opt-in). Marketplace, Suppliers, and Vets all show real distance ("2.3 km away") from the logged-in user to each listing's owner, computed client-side with the Haversine formula, and can be sorted "Nearest first". Users without a shared location simply don't see distances — nothing breaks, it degrades gracefully.

## Mobile Money provision
Every Marketplace listing and Supplier product has a **💰 Pay** button. Tapping it opens a real, working flow — commission split shown transparently (5%, matching the Business Model Canvas), phone number and provider (MTN/Airtel) captured, and a `transactions` row created in Supabase with `status: pending_integration`. **No money actually moves yet** — the modal says so plainly, and the request shows up under the buyer/seller's Profile as "🚧 Pending integration." This is the real integration point: once you have MTN/Airtel merchant API credentials, replacing `pending_integration` with an actual charge call is the only change needed — the data model, commission logic, and UI are already done.

## Admin console
Logging in as the seeded **"Ssemambo Steven (Admin)"** account (role `Admin`) replaces the normal farmer-style UI entirely with a separate admin console:
- **Dashboard** — platform-wide stats: users by role, active listings, open/urgent vet requests, disease alerts, messages sent, Mobile Money request volume and potential commission
- **Users** — every account, with inline role changes and ban/unban (banned accounts are blocked at the database level, not just the UI — see `is_not_banned()` in the schema)
- **Content** — delete any listing or post platform-wide; view all vet requests regardless of who filed them
- **Payments** — every Mobile Money request logged across the whole platform, not just your own

**Security note:** the `Admin` role can't be self-granted through normal signup — the account-creation dropdown only offers Farmer/Buyer/Supplier/Vet, and admin accounts are excluded entirely from the public tap-to-login list. Getting admin access requires **real email/password authentication** via a separate "Platform admin? Access here" link on the login screen — a one-time signup that links your email/password to the single seeded admin profile (whoever completes it first owns it; RLS enforces this can only happen once, and only via a genuine, non-anonymous session — never the anonymous demo sessions used elsewhere in the app). Password can be changed anytime from the admin console (🔑 icon). Admin power itself is enforced by a `SECURITY DEFINER` Postgres function (`is_admin()`) referenced in RLS policies — the anon key the app uses never has elevated privileges by itself.

**Recommended manual step:** enable "Leaked Password Protection" in Supabase Dashboard → Authentication → Policies — checks new passwords against known-breached lists. Not something I can toggle remotely, same as the Anonymous Sign-ins setting.

## Known limitations (honest roadmap)
- **No password/OTP auth yet** — see "How login works" above. Phone + OTP is the natural next step for this user base.
- **Mobile Money is a provision, not a live payment rail** — see above. Needs real MTN/Airtel merchant API credentials before real charging can be built.
- **No content moderation or trust/ratings system** — anyone with a session can post anything.
- **Luganda toggle is decorative** — no translations behind it yet.

## Traceability
Every marketplace listing gets a unique stamp (e.g. `MK-0114`) at creation. Tapping the stamp badge on any listing opens a QR code and a shareable link (`/verify/:stamp`) to a **public verification page** — no login required, reachable by anyone who scans the code. It shows the listing details, the farm/farmer it traces back to, and when it was posted, pulled live from the same Supabase database. This route is intentionally excluded from the login gate (see `src/App.jsx`) so it works for buyers who aren't Farm Linker users themselves.

## Design system
Dark ink-green (`#1B1F16`) with an egg-yolk gold accent (`#F2B705`) and a leaf-green secondary (`#4C7A3D`). Fraunces for headings, Inter for body text, IBM Plex Mono for prices and the traceability stamp — a dashed-circle "stamp" motif repeated across every listing.
