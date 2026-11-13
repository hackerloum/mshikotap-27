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

## Vercel + Firebase hosting

Full guide: [`docs/vercel-firebase-setup.md`](docs/vercel-firebase-setup.md)

1. Import this repo in [Vercel](https://vercel.com/new) (Next.js)
2. Add env vars from `.env.example` (Firebase web config + Admin service account)
3. Set `NEXT_PUBLIC_DEMO_MODE=false` for Production/Preview
4. Deploy and add your `*.vercel.app` domain in Firebase Auth → Authorized domains
5. Deploy rules: `npx -y firebase-tools@latest deploy --only firestore:rules,storage`

Verify with `/api/health` (`firebaseConfigured` + `firebaseAdminConfigured` should be `true`).

Security rules live in `firestore/`.

## Scripts

- `npm run dev` — Turbopack dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — ESLint
- `npm run env:check` — print which Firebase env keys are missing (no secrets shown)

## Phase roadmap

**Phase 1 (this PR):** scalable architecture, dashboards, demo services, API layer, rules templates.

**Next:** live Firebase session cookies, FCM push, payment providers for credits, multi-level referral payouts, AI screenshot verification via `aiService`.
