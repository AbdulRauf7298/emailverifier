# EmailVerifier — Deployment Setup Guide

Complete step-by-step guide to deploy EmailVerifier on Vercel with Supabase, Upstash Redis, Cloudinary, and Google OAuth.

---

## Prerequisites

- GitHub account (repository: AbdulRauf7298/emailverifier)
- Vercel account (vercel.com)
- Supabase account (supabase.com)
- Upstash account (upstash.com)
- Google Cloud Console access
- Cloudinary account

---

## Step 1 — Supabase (PostgreSQL Database)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Set a **strong database password** (save it!)
3. Choose a region closest to your users
4. Wait for provisioning (~2 min)

### Get Connection Strings

Go to **Project Settings → Database → Connection string**:

- **Pooled connection** (for `DATABASE_URL`):
  ```
  postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
  ```

- **Direct connection** (for `DIRECT_URL` — for migrations):
  ```
  postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
  ```

### Run Database Migrations

After setting up your local `.env.local`:
```bash
npx prisma migrate deploy
npx prisma db push  # Or use migrate deploy in production
```

### Create Admin User

After deployment, seed the admin user:
```bash
npx prisma studio
# Or run the seed script manually in Supabase SQL editor
```

SQL to create admin:
```sql
INSERT INTO "User" (id, name, email, password, role, credits, "apiKey", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'Abdul Rauf',
  'rauf72984@gmail.com',
  -- bcrypt hash of 'Khanraufmalik1!' (generate with: node -e "const b=require('bcryptjs');b.hash('Khanraufmalik1!',12).then(console.log)")
  '$2b$12$REPLACE_WITH_ACTUAL_HASH',
  'ADMIN',
  9999,
  gen_random_uuid()::text,
  NOW(),
  NOW()
);
```

---

## Step 2 — Upstash Redis

1. Go to [upstash.com](https://upstash.com) → **Create Database**
2. Select **Redis**, choose a region
3. Copy the **REST URL** and **REST Token** from the Connect tab

---

## Step 3 — Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or use existing
3. Go to **APIs & Services → OAuth Consent Screen**
   - User Type: External
   - Add your app name and email
4. Go to **Credentials → Create Credentials → OAuth Client ID**
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-vercel-domain.vercel.app/api/auth/callback/google` (production)
5. Copy **Client ID** and **Client Secret**

---

## Step 4 — Gmail SMTP (App Password)

1. Go to your Gmail account → **Google Account Settings**
2. Security → **2-Step Verification** (must be enabled)
3. Security → **App Passwords**
4. Select "Mail" and "Other (custom name)" → EmailVerifier
5. Copy the 16-character app password

---

## Step 5 — Local Development Setup

```bash
# Clone the repository
git clone https://github.com/AbdulRauf7298/emailverifier.git
cd emailverifier

# Install dependencies
npm install

# Create local environment file
cp .env.example .env.local
# Edit .env.local with your actual credentials

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Visit `http://localhost:3000`

---

## Step 6 — Vercel Deployment

### Deploy via GitHub

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import **AbdulRauf7298/emailverifier** from GitHub
3. Framework: **Next.js** (auto-detected)
4. Build command: `npm run build`
5. Output directory: `.next`

### Add Environment Variables in Vercel

In Vercel project → **Settings → Environment Variables**, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXTAUTH_URL` | `https://your-project.vercel.app` | Production |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` | All |
| `DATABASE_URL` | Supabase pooled connection string | All |
| `DIRECT_URL` | Supabase direct connection string | All |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | All |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | All |
| `CLOUDINARY_CLOUD_NAME` | `rauf` | All |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard | All |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard | All |
| `SMTP_USER` | `unboundtutors@gmail.com` | All |
| `SMTP_PASSWORD` | Gmail App Password | All |
| `UPSTASH_REDIS_REST_URL` | From Upstash | All |
| `UPSTASH_REDIS_REST_TOKEN` | From Upstash | All |
| `ADMIN_EMAIL` | `rauf72984@gmail.com` | All |

> ⚠️ **IMPORTANT**: Never commit actual credentials to the repository!

### Deploy

Click **Deploy**. Vercel will:
1. Install dependencies (`npm install`)
2. Generate Prisma client (`prisma generate` via postinstall)
3. Build Next.js (`next build`)
4. Deploy to CDN

---

## Step 7 — Post-Deployment

### Run Database Migrations

After first deployment, run migrations via Vercel CLI or the Supabase dashboard SQL editor.

Using Vercel CLI:
```bash
npm i -g vercel
vercel env pull .env.local
npx prisma migrate deploy
```

### Verify Everything Works

- [ ] Homepage loads: `https://your-domain.vercel.app`
- [ ] Sign up works: `/signup`
- [ ] Google OAuth works: click "Continue with Google"
- [ ] Dashboard loads after login: `/dashboard`
- [ ] Email verification works from dashboard
- [ ] Profile page works: `/profile`
- [ ] Settings page shows API key: `/settings`

---

## Step 8 — Generate NEXTAUTH_SECRET

Run this command and use the output as `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Or use Node.js:
```js
require('crypto').randomBytes(32).toString('base64')
```

---

## Troubleshooting

### "404: NOT_FOUND" on Vercel
- Ensure `vercel.json` exists in the repository root
- Ensure `package.json` exists at root (not just in `/frontend`)
- Check Vercel build logs for errors

### Database Connection Failed
- Verify `DATABASE_URL` and `DIRECT_URL` are set correctly
- Check that Supabase project is active
- Ensure IP is not blocked (Supabase free tier allows all IPs)

### Google OAuth Not Working
- Verify redirect URIs match exactly in Google Cloud Console
- Ensure `NEXTAUTH_URL` matches your Vercel domain
- Check that the OAuth app is published (not in testing mode)

### Prisma Generate Fails
- Ensure `DATABASE_URL` is accessible from build environment
- Use `DIRECT_URL` for migrations

---

## Architecture Overview

```
Vercel (Next.js 14)
├── Frontend: React + Tailwind CSS
├── API Routes: Next.js API (serverless functions)
├── Authentication: NextAuth.js (Google + Credentials)
│
├── Database: Supabase (PostgreSQL) via Prisma ORM
├── File Storage: Cloudinary
├── Cache/Rate-limit: Upstash Redis
└── Email: Gmail SMTP via Nodemailer
```

---

## Support

For payment discussions and credit purchases, contact via WhatsApp.
For technical support: unboundtutors@gmail.com
