# Niyam AI CA Tool — Deployment Guide

**Stack:** Supabase (DB + Storage) → Railway (Backend) → Vercel (Frontend)

---

## Overview

```
User Browser
    │
    ▼
Vercel (React frontend)
    │  HTTPS API calls
    ▼
Railway (Express backend)
    │  Supabase JS client
    ▼
Supabase (PostgreSQL + File Storage)
```

**Total cost to start: $0** (all free tiers)
- Supabase Free: 500 MB DB, 1 GB storage
- Railway Hobby: $5/month (or use free trial credits)
- Vercel Free: unlimited frontend deploys

---

## Phase 1 — Supabase Setup (Database + Storage)

> Do this first. Both backend and frontend need Supabase credentials.

### Step 1.1 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a name: `niyam-ca-tool`
3. Set a strong database password (save it)
4. Region: **South Asia (Mumbai)** — closest to your users
5. Click **Create Project** — wait ~2 min

### Step 1.2 — Run the Database Schema

1. In your Supabase project → left sidebar → **SQL Editor**
2. Click **New query**
3. Open `server/schema.sql` from this repo
4. Paste the entire file content → click **Run**
5. You should see: `Success. No rows returned`

Verify: go to **Table Editor** — you should see 7 tables:
`cas`, `clients`, `upload_sessions`, `uploaded_files`, `extracted_invoices`, `validation_flags`, `reports`

### Step 1.3 — Create Storage Bucket

1. Left sidebar → **Storage** → **New bucket**
2. Name: `ca-uploads`
3. **Uncheck** "Public bucket" (keep it private)
4. Click **Save**

### Step 1.4 — Get Your Credentials

Go to **Settings** (gear icon) → **API**:

Copy these — you'll need them later:
```
Project URL:        https://xxxxxxxxxxxx.supabase.co
anon public key:    eyJhbG...  (long string)
service_role key:   eyJhbG...  (KEEP THIS SECRET — full DB access)
```

---

## Phase 2 — Backend Deploy on Railway

> Railway runs your Express server 24/7 with auto-deploy from GitHub.

### Step 2.1 — Create Railway Account

1. Go to [railway.app](https://railway.app) → **Login with GitHub**
2. Authorize Railway to access your GitHub

### Step 2.2 — Create New Project

1. Dashboard → **New Project**
2. Select **Deploy from GitHub repo**
3. Find and select: `Ram-82/Niyam-AI-CA`
4. Click **Deploy Now**

### Step 2.3 — Configure Root Directory

Railway will try to deploy the whole repo. You need to point it at the `server/` folder:

1. Click on your deployed service
2. Go to **Settings** tab
3. Scroll to **Build** section
4. Set **Root Directory** → `server`
5. Set **Start Command** → `npm start`
6. Click **Save**

Railway will redeploy automatically.

### Step 2.4 — Add Environment Variables

In Railway → your service → **Variables** tab → click **New Variable** (or paste raw):

```
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-app.vercel.app

JWT_SECRET=<generate: openssl rand -base64 32>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=<generate: openssl rand -base64 32>
REFRESH_TOKEN_EXPIRES_IN=7d

SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=noreply@niyamai.in
```

> **Note:** For `CLIENT_URL` — put a placeholder now (`https://your-app.vercel.app`).
> You'll update it after Vercel deploy.

> **Generate secrets:**
> Run in your terminal: `openssl rand -base64 32`
> Or use: [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

### Step 2.5 — Get Your Backend URL

1. Railway → your service → **Settings** → **Networking**
2. Click **Generate Domain**
3. You'll get: `niyam-ca-tool-production.up.railway.app`
4. **Save this URL** — you need it for Vercel

### Step 2.6 — Verify Backend is Live

Visit: `https://niyam-ca-tool-production.up.railway.app/health`

You should see:
```json
{ "status": "ok", "env": "production" }
```

---

## Phase 3 — Email Setup with Resend (Required for Signup)

> Without this, email verification won't work.

### Step 3.1 — Create Resend Account

1. Go to [resend.com](https://resend.com) → Sign up free
2. Free tier: 100 emails/day, 3,000/month — enough for MVP

### Step 3.2 — Get API Key

1. Resend dashboard → **API Keys** → **Create API Key**
2. Name: `niyam-ca-tool`
3. Copy the key: `re_xxxxxxxxxx`
4. Add to Railway env: `RESEND_API_KEY=re_xxxxxxxxxx`

### Step 3.3 — Sender Email (Without Custom Domain)

Until you buy a domain, use Resend's shared domain:

```
EMAIL_FROM=onboarding@resend.dev
```

Update this in Railway env variables.

> When you buy a domain later, verify it in Resend and update to `noreply@yourdomain.com`

---

## Phase 4 — Frontend Deploy on Vercel

### Step 4.1 — Create Vercel Account

1. Go to [vercel.com](https://vercel.com) → **Login with GitHub**
2. Authorize Vercel

### Step 4.2 — Import Project

1. Dashboard → **Add New** → **Project**
2. Import: `Ram-82/Niyam-AI-CA`
3. Vercel auto-detects React/Vite

### Step 4.3 — Configure Build Settings

In the import screen, change:

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Step 4.4 — Add Environment Variables

In Vercel → **Environment Variables** section:

```
VITE_API_URL=https://niyam-ca-tool-production.up.railway.app
```

> Replace with your actual Railway URL from Step 2.5

### Step 4.5 — Update Vite Config for Production

The current `vite.config.js` uses a dev proxy (`/api` → localhost). For production on Vercel, the frontend needs to hit the Railway URL directly.

Update `client/vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

Update `client/src/lib/axios.js` — change the baseURL line:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  withCredentials: true,
});
```

### Step 4.6 — Deploy

Click **Deploy** — Vercel builds and deploys in ~90 seconds.

You'll get a URL like: `https://niyam-ca-tool.vercel.app`

### Step 4.7 — Update Railway `CLIENT_URL`

Now that you have your Vercel URL, go back to Railway → Variables and update:

```
CLIENT_URL=https://niyam-ca-tool.vercel.app
```

Railway will redeploy. This fixes CORS so the frontend can call the backend.

---

## Phase 5 — Post-Deploy Verification Checklist

Run through this after both are live:

```
□ https://your-app.vercel.app          → Landing page loads
□ /signup                              → Form works, submits
□ Check email inbox                    → Verification email arrives
□ Click verify link                    → Redirects to /login?verified=true
□ /login                               → Can log in
□ /dashboard                           → Dashboard loads with empty state
□ Add client                           → Client card appears
□ Create session for a client          → Redirects to upload page
□ Upload a PDF or Excel file           → Processing starts
□ Wait ~10s → session result page      → Flags and score visible
□ Download PDF Report                  → PDF opens
□ /profile                             → Can update name/firm
□ Change password                      → Works without error
```

---

## Phase 6 — When You Buy a Domain (Later)

### Option A: Only Custom Domain on Vercel (Recommended first step)

1. Vercel → your project → **Settings** → **Domains**
2. Click **Add Domain** → enter `niyamai.in` (or whatever you buy)
3. Vercel shows you DNS records to add
4. Go to your domain registrar (GoDaddy / Namecheap / Cloudflare)
5. Add the DNS records Vercel gives you
6. Wait 10–30 min → Vercel shows **Valid Configuration**
7. Update Railway env: `CLIENT_URL=https://niyamai.in`

### Option B: Custom Domain on Backend Too (for clean API URLs)

1. Railway → Settings → Networking → **Custom Domain**
2. Enter: `api.niyamai.in`
3. Add the CNAME record at your registrar
4. Update Vercel env: `VITE_API_URL=https://api.niyamai.in`
5. Update your `client/src/lib/axios.js` baseURL
6. Redeploy Vercel

### Step 6.3 — Update Resend Sender

1. Resend → **Domains** → **Add Domain** → `niyamai.in`
2. Add the DNS TXT + MX records they give you
3. Once verified, update Railway: `EMAIL_FROM=noreply@niyamai.in`

---

## Quick Reference — All Service URLs

| Service | URL | Purpose |
|---|---|---|
| Supabase | `xxxx.supabase.co` | Database + File Storage |
| Railway | `xxxx.up.railway.app` | Backend API |
| Vercel | `xxxx.vercel.app` | Frontend |
| Resend | `resend.com/dashboard` | Email delivery |

---

## Troubleshooting

**CORS error in browser console**
→ Check Railway `CLIENT_URL` exactly matches your Vercel URL (no trailing slash)

**"Invalid environment variables" on Railway startup**
→ Check all required env vars are set: `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Email not arriving**
→ Check `RESEND_API_KEY` is set correctly in Railway. Resend free tier only sends to verified email addresses in test mode — verify your own email first in Resend dashboard.

**Signup works but "Email not verified" on login**
→ `email_verification_token` in DB is not being cleared. Check the `GET /api/auth/verify-email` route is reachable (Supabase RLS may be blocking the update — use the service role key, not anon key).

**File upload fails**
→ Check Supabase Storage bucket `ca-uploads` exists and is private. Check `SUPABASE_SERVICE_ROLE_KEY` (not anon key) is used — the anon key cannot write to private buckets.

**Railway free credits exhausted**
→ Railway gives $5 free credits. After that, add a payment method. A small Node.js app costs ~$0.50–1/month on the free Hobby plan. Alternative: deploy backend on **Render.com** (free tier with 512 MB RAM, sleeps after 15 min inactivity).

---

## Alternative: Backend on Render (100% free)

If you want to avoid Railway's billing:

1. [render.com](https://render.com) → New → **Web Service**
2. Connect GitHub → select `Ram-82/Niyam-AI-CA`
3. Root directory: `server`
4. Build command: `npm install`
5. Start command: `npm start`
6. Environment: **Node**
7. Add all the same env variables as above
8. Click **Create Web Service**

> Render free tier sleeps after 15 min of no traffic (cold start ~30s).
> Upgrade to $7/month for always-on.
