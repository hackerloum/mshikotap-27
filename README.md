# MshikoTap

Modern digital earning platform — tasks, referrals, challenges, advertiser campaigns, marketplace, and role-based dashboards.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Firebase** Google sign-in / Firestore / Storage
- **Zustand** state · **Tailwind CSS 4** · **Recharts**
- **Vercel**-ready API routes

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
```

## Vercel + Firebase hosting

Full guide: [`docs/vercel-firebase-setup.md`](docs/vercel-firebase-setup.md)

1. Import this repo in [Vercel](https://vercel.com/new) (Next.js)
2. Add env vars from `.env.example` (Firebase web config + Admin service account)
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

**Status:** all data lives in Firestore behind authenticated server routes. Amounts are whole Tanzanian shillings (TSh).

**Next:** live Firebase session cookies, FCM push, payment providers for credits, multi-level referral payouts, AI screenshot verification via `aiService`.

## Auth and game profile

- Sign-in is **Google only**. Sign-up and log-in are the same one-tap flow, and everyone lands on `/user`.
- On first sign-in the browser calls `POST /api/me` with the Firebase ID token. The server (Admin SDK) creates the profile in `users/{uid}` with zero balance, so clients can never grant themselves coins.
- `POST /api/daily-claim` runs the daily bonus in a Firestore transaction (20h cooldown, streak bonus up to 7 days).
- Set `ADMIN_EMAILS` (comma separated) in Vercel to promote specific Google accounts to the admin role.
- Firebase Console checklist: enable the Google provider, add `www.mshikotap.co.tz`, `mshikotap.co.tz` and your `*.vercel.app` domain under Authorized domains, create the Firestore database, publish the rules in `firestore/`.

## Money and data

- Currency is **TZS** and amounts are whole shillings. The numbers below are defaults. Admins change them live in **Admin > Settings** (stored in Firestore `settings/system`): daily bonus TSh 150 to 450 (streak), minimum cash out TSh 5,000, 2.5% fee, referral bonus TSh 500.
- Everything is stored in Firestore: `users`, `tasks`, `taskSubmissions`, `withdrawals`, `campaigns`, `challenges`, `marketplaceListings`, `notifications`, `earningsDaily`. Clients never write these directly (see `firestore/firestore.rules`); the `/api/*` routes verify the Firebase ID token and role, then write with the Admin SDK in transactions.
- Nothing is pre-filled. Sign in with a Google account listed in `ADMIN_EMAILS`, open **Quests** to publish the first quest, **Races** to announce a race, and **Players** to turn an account into an advertiser and add credits.

## Anti-cheat

All rules run on the server in `/api/*` transactions. The browser cannot skip them.

- **Quest timer.** A quest must be started (`POST /api/tasks/start`) before proof is accepted. Proof sent before the minimum time (per quest, or the default in Settings) is blocked.
- **One proof, one use.** Proof links are normalised (host, tracking params, trailing slash) and hashed into `proofIndex`. A link already used by anyone is blocked. Sending the quest link itself as proof is blocked. Proof must be `https://`.
- **Limits.** Per player per day: max quests sent, max quest earnings, and a pause between quests.
- **Risk score.** Each signal (reused proof, rushed claim, same device as another account, shared payout number, admin fraud reject) adds points in `userSecurity` and raises an alert in `fraudFlags`. Approved quests slowly remove points. At the hold score cash outs stop; at the auto-suspend score the account is suspended. Admins can dismiss an alert (points are restored), mark players trusted, or reset risk.
- **Referrals.** No self-referral. If the friend signs up on the same device as the referrer the bonus is withheld and flagged. Bonuses are capped per referrer.
- **Cash out checks.** Cash outs open only when the account is old enough, has enough approved quests, is in good standing, and has no other payout waiting. Mobile money numbers are validated and normalised to `+255...`. A number already used by another account sends the payout to review.
- **Device and network.** The browser sends a random `x-device-id` (stored in localStorage). IP and device ids are hashed with `IP_HASH_SALT` (optional env var) before storage. Shared networks are common on mobile data, so a shared IP is shown to admins but does not add risk.

These collections are server-only (Admin SDK): `userSecurity`, `fraudFlags`, `questSessions`, `dailyLimits`, `proofIndex`, `auditLogs`, `settings`. Publish the updated `firestore/firestore.rules` so browsers cannot read them.

## Admin control room

Sign in with a Google account listed in `ADMIN_EMAILS`.

- **Home**: players, review and payout queues, money owed to players, fraud alerts, and kill switches for sign-ups, quests and cash outs.
- **Reviews**: proof queue with player risk, time taken, bulk approve, reject with a reason, and a "this is cheating" option.
- **Payouts**: queue with player standing, copy number, hold, approve, mark paid, reject and refund with a reason.
- **Fraud**: open, confirmed and dismissed alerts.
- **Players**: filter by risk, suspended or advertiser, then open a player to suspend, adjust balance, send a message, grant advertiser credits, mark trusted, reset risk, and see linked accounts, alerts, quests and payouts.
- **Quests**: publish quests with a minimum time and an end time, edit reward or player cap, close or reopen.
- **Campaigns**: pause, resume or stop any advertiser campaign.
- **Races**, **Stats**, **Audit log** (every admin action with who and when) and **Settings** (all numbers, switches and the announcement banner).
