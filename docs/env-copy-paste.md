# MshikoTap env vars — copy & paste

## A) Local `.env.local`

1. Copy `.env.example` → `.env.local`
2. Replace every `PASTE_...` value
3. For local only, you can set `NEXT_PUBLIC_DEMO_MODE=true` until Firebase is ready

```env
NEXT_PUBLIC_APP_NAME=MshikoTap
NEXT_PUBLIC_APP_URL=https://mshikotap.co.tz
NEXT_PUBLIC_DEMO_MODE=false

NEXT_PUBLIC_FIREBASE_API_KEY=PASTE_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=PASTE_PROJECT_ID.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=PASTE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=PASTE_PROJECT_ID.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=PASTE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=PASTE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

FIREBASE_ADMIN_PROJECT_ID=PASTE_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL=PASTE_SERVICE_ACCOUNT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nPASTE_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

## B) Vercel dashboard (one row each)

Project → **Settings** → **Environment Variables** → add each row.  
Targets: **Production**, **Preview**, **Development** (unless noted).

| Key | Value | Targets | Secret? |
|---|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | `MshikoTap` | All | No |
| `NEXT_PUBLIC_APP_URL` | `https://mshikotap.co.tz` | Production | No |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Development | No |
| `NEXT_PUBLIC_DEMO_MODE` | `false` | Production, Preview | No |
| `NEXT_PUBLIC_DEMO_MODE` | `true` | Development | No |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | from Firebase web config `apiKey` | All | No |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | from Firebase `authDomain` | All | No |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | from Firebase `projectId` | All | No |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | from Firebase `storageBucket` | All | No |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | from Firebase `messagingSenderId` | All | No |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | from Firebase `appId` | All | No |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | optional `measurementId` | All | No |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | optional FCM key | All | No |
| `FIREBASE_ADMIN_PROJECT_ID` | service account `project_id` | All | **Yes** |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | service account `client_email` | All | **Yes** |
| `FIREBASE_ADMIN_PRIVATE_KEY` | service account `private_key` (keep `\n`) | All | **Yes** |

## C) Where to get Firebase values

**Web config** (client keys):  
Firebase Console → Project settings → Your apps → Web app → `firebaseConfig`

**Service account** (admin keys):  
Firebase Console → Project settings → Service accounts → Generate new private key → open the JSON:

- `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
- `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
- `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (paste the full string including `-----BEGIN...` and `\n`)

## D) Keys only (quick copy)

```text
NEXT_PUBLIC_APP_NAME
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_DEMO_MODE
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
NEXT_PUBLIC_FIREBASE_VAPID_KEY
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY
```
