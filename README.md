# MshikoTap

Modern digital earning platform — tasks, referrals, challenges, advertiser campaigns, marketplace, and role-based dashboards.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Firebase** Auth / Firestore / Storage (demo mode when unset)
- **Zustand** state · **Tailwind CSS 4** · **Recharts**
- **Vercel**-ready API routes

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo login

Demo mode is on by default (`NEXT_PUBLIC_DEMO_MODE=true`).

| Email contains | Role |
|---|---|
| `admin` | Admin |
| `advertiser` or `brand` | Advertiser |
| anything else | User |

Password can be any non-empty value in demo mode.

## Architecture

```
src/
  app/           # routes (marketing, auth, user/advertiser/admin, api)
  components/    # ui, layout, charts
  features/      # feature modules (ready for growth)
  services/      # domain services (auth, tasks, wallet, campaigns, AI stubs)
  api/           # fetch abstraction
  store/         # Zustand stores
  hooks/         # auth guard, countdown, …
  lib/           # firebase client, errors, utils
  types/         # shared TypeScript models
  config/        # site + subscription config
  data/          # demo fixtures
```

## Firebase

1. Create a Firebase project
2. Copy web config into `.env.local` (see `.env.example`)
3. Set `NEXT_PUBLIC_DEMO_MODE=false`
4. Deploy rules: `firebase deploy --only firestore:rules,storage`

Security rules live in `firestore/`.

## Scripts

- `npm run dev` — Turbopack dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — ESLint

## Phase roadmap

**Phase 1 (this PR):** scalable architecture, dashboards, demo services, API layer, rules templates.

**Next:** live Firebase session cookies, FCM push, payment providers for credits, multi-level referral payouts, AI screenshot verification via `aiService`.
