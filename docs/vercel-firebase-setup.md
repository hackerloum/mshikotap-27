# Vercel + Firebase environment setup

## 1. Create / import the Vercel project

1. Open [vercel.com/new](https://vercel.com/new)
2. Import `hackerloum/mshikotap-27`
3. Framework: **Next.js** (auto-detected)
4. Do **not** deploy yet if Firebase keys are missing — or deploy once with `NEXT_PUBLIC_DEMO_MODE=true`

Team slug (from connected account): `hackerloum-gmailcoms-projects`

## 2. Create Firebase project resources

1. [Firebase Console](https://console.firebase.google.com/) → create or open your project
2. Enable **Authentication → Sign-in method → Google** (this is the only sign-in method the app uses) and pick a support email. Then create a **Firestore Database** (production mode) and publish `firestore/firestore.rules`.
3. Create **Cloud Firestore** (production mode) and deploy rules from `firestore/`
4. Enable **Storage** and deploy `firestore/storage.rules`
5. Add a **Web app** and copy the config object
6. Project settings → **Service accounts** → Generate new private key (JSON)

## 3. Environment variables on Vercel

Project → **Settings** → **Environment Variables**

| Key | Targets | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Production, Preview, Development | `MshikoTap` |
| `NEXT_PUBLIC_APP_URL` | Production | `https://mshikotap.co.tz` |
| `NEXT_PUBLIC_DEMO_MODE` | Production, Preview | `false` |
| `NEXT_PUBLIC_DEMO_MODE` | Development | `true` (optional) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | All | From Firebase web config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | All | `your-id.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | All | Firebase project id |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | All | `your-id.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | All | From web config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | All | From web config |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | All | Optional |
| `FIREBASE_ADMIN_PROJECT_ID` | All | Service account `project_id` |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | All | Service account `client_email` |
| `FIREBASE_ADMIN_PRIVATE_KEY` | All | Service account `private_key` (keep `\n`) |

Mark Admin keys as **Sensitive / Secret**.

### Private key tip

If the JSON has:

```text
"private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

Paste that whole string into Vercel (including the `\n` characters). Next.js / Firebase Admin will expand them.

## 4. Local development

```bash
cp .env.example .env.local
# fill Firebase values
npm install
npm run dev
```

Or after the Vercel project exists and CLI is logged in:

```bash
npx vercel link --yes --project mshikotap --scope hackerloum-gmailcoms-projects
npx vercel env pull .env.local --yes
```

## 5. Deploy

```bash
npx vercel --prod
```

Or push to `main` once Git is connected.

## 6. Verify

Hit `/api/health` — expect:

- `demoMode: false`
- `firebaseConfigured: true`
- `firebaseAdminConfigured: true`
- empty `missingPublic` / `missingAdmin`

## 7. Custom domain (`mshikotap.co.tz`)

The apex domain is added on the Vercel team. Point nameservers at your registrar to:

- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

Then attach both `mshikotap.co.tz` and `www.mshikotap.co.tz` to the Vercel project (www → redirect to apex).

Optional ownership TXT (if asked):

- Host: `_vercel`
- Value: `vc-domain-verify=mshikotap.co.tz,085b49d9f4d8f7c39a20`

## 8. Authorized domains (Firebase Auth)

In Firebase Auth → Settings → Authorized domains, add:

- `localhost`
- `mshikotap.co.tz`
- `www.mshikotap.co.tz`
- your `*.vercel.app` preview domain
