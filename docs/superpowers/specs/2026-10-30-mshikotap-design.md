# MshikoTap Platform Design

## Summary

MshikoTap is a mobile-first digital earning platform (tasks, referrals, marketplace, advertiser campaigns) built on Next.js App Router, Firebase (Auth/Firestore/Storage), Zustand, and Tailwind. Phase 1 delivers production-ready architecture, role-based dashboards, and demo mode when Firebase credentials are absent.

## Architecture decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend | Next.js API routes | Single deploy unit on Vercel; NestJS optional later |
| State | Zustand | Lightweight, typed, feature-sliced stores |
| Auth | Firebase Auth + cookie session bridge | Email/password + phone-ready; role claims in Firestore |
| Data | Firestore collections + typed services | Realtime listeners for wallets, notifications, races |
| UI | Tailwind + local shadcn-style primitives | Dark SaaS aesthetic, teal/cyan accents (not purple) |
| Demo mode | Mock repositories when env unset | Local/preview without Firebase project |

## Role model

- `user` — earn via tasks, referrals, marketplace, withdrawals
- `advertiser` — buy credits, run campaigns, analytics
- `admin` — approvals, fraud, announcements, global challenges

## Phase 1 scope

Landing, auth, pricing, user/advertiser/admin dashboards, tasks, wallet/withdraw, referrals, challenges, marketplace, notifications, settings, API abstraction, activity logging stubs, Firestore security rules template, AI-ready service interfaces.

## Later phases

Live FCM, SMS/WhatsApp providers, multi-level referral payouts, AI screenshot verification, rate-limit middleware at edge, payment gateways for credits/subscriptions.
