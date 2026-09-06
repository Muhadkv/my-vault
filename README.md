# Vault

A personal, encrypted vault for passwords and expenses — React + Supabase, deployable free on GitHub Pages.

## How your data is protected

- **Client-side encryption.** Passwords and expense notes are encrypted with AES-256-GCM *in your browser* before they're ever sent to the database. The encryption key is derived from a **master password** that never leaves your device and is never stored anywhere — not even Supabase can read your data.
- **Row Level Security.** Every database table only lets you read/write your own rows, enforced by Postgres itself, not just app code.
- **Auto-lock.** The vault re-locks after 5 minutes of inactivity, requiring your master password again.
- **Optional 2FA.** Enable an authenticator-app code for sign-in from Settings.
- **Breach checking.** Uses HaveIBeenPwned's k-anonymity API — only a partial hash of a password is ever sent, never the password itself.

WARNING: If you forget your master password, your vault data cannot be recovered. Write it down somewhere safe (not in this repo!).

## 1. Create your free Supabase project

1. Go to supabase.com and create a free project.
2. In the SQL Editor, run everything in `sql/schema.sql`. This creates the tables and security policies.
3. In Authentication -> Providers, make sure Email is enabled.
4. In Settings -> API, copy your Project URL and anon public key.

## 2. Run it locally

```
npm install
cp .env.example .env
# paste your Supabase URL + anon key into .env
npm run dev
```

## 3. Deploy to GitHub Pages (free, no domain needed)

1. Push this project to a GitHub repo.
2. In `vite.config.js`, set `base` to `/your-repo-name/` (must match your repo's name exactly).
3. In your repo: Settings -> Secrets and variables -> Actions, add two repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. In Settings -> Pages, set the source to GitHub Actions.
5. Push to `main` — the included workflow (`.github/workflows/deploy.yml`) builds and deploys automatically.
6. Your site will be live at `https://your-username.github.io/your-repo-name/`.

Keep your repo private if you can (free on GitHub for personal accounts) — even though your actual passwords are encrypted, it's good practice not to expose your app's structure and your account activity publicly.

## Features

**Password vault**
- Custom categories you create yourself (Google, Banking, Work, anything)
- Password generator + strength meter
- Breach check per password (HaveIBeenPwned)
- Copy-to-clipboard with 15-second auto-clear
- Encrypted notes per login (recovery codes, security questions, etc.)

**Expenses**
- Category breakdown chart, monthly totals
- Recurring expense tagging (weekly/monthly/yearly)
- Per-category monthly budgets with over-limit warnings
- CSV export for taxes/records

**General**
- Installable as a phone app (PWA) — works offline for the app shell
- Mobile-first, native-app-style navigation
- Two-factor authentication (TOTP)
- Full encrypted JSON backup export

## Tech stack

- Frontend: React + Vite
- Backend: Supabase (Postgres + Auth), free tier
- Encryption: Web Crypto API (AES-256-GCM, PBKDF2 key derivation)
- Charts: Recharts
- Hosting: GitHub Pages via GitHub Actions
