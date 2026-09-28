# Firebase Architecture

CardO uses **Firebase** for auth, database, and web hosting.

```
Web (Next.js on Firebase Hosting)
        │
        ├── Firebase Auth (email/password, optional Google)
        │
        └── Cloud Firestore
                ├── users
                ├── users/{uid}/cards
                ├── users/{uid}/transactions
                └── users/{uid}/notificationPreferences
```

iOS (later) can use the same Firestore collections via the Firebase iOS SDK.

---

## Project setup (console — your account)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. **Add project** → name `CardO` (disable Analytics if you want a lean setup)
3. **Build → Authentication → Get started**
   - Enable **Email/Password**
   - (Optional) Enable **Google**
4. **Build → Firestore Database → Create database**
   - Start in **production mode**
   - Location: `asia-southeast1` (or closest to PH users)
5. **Build → Hosting → Get started**
   - You can skip the wizard; we deploy via CLI (`firebase.json` already in repo)

Then on your machine:

```bash
firebase login
firebase use --add   # select CardO, alias `default`
```

Copy the web app credentials into `apps/web/.env.local` (never commit):

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

From **Project settings → Your apps → Web app**.

---

## Deploy

```bash
# from repo root
firebase deploy --only firestore:rules,firestore:indexes,hosting
```

Emulator (local, no production data):

```bash
firebase emulators:start
```

---

## Security model

- All user data lives under `users/{uid}/…`
- Rules deny unless `request.auth.uid == uid`
- No full card numbers, CVV, PINs, or bank credentials — ever
- Client SDKs only use the **web API key** (public); server credentials never ship in the browser
