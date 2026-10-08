# Deploying the StellarIQ demo

This repo ships two deployable services, both container-ready (their Dockerfiles
are built and verified in CI):

| Service | Path       | Port | Notes                                       |
| ------- | ---------- | ---- | ------------------------------------------- |
| API     | `apps/api` | 4000 | Fastify. Falls back to in-memory mock data. |
| Web     | `apps/web` | 3000 | Next.js standalone dashboard.               |

For a demo you do **not** need Postgres or Redis - leave `DATA_API_URL` unset and
the API serves realistic mock data on its own.

`railway.json` config-as-code files live next to each service
(`apps/api/railway.json`, `apps/web/railway.json`).

---

## Option A - Railway (both services, recommended)

Deploy the **API first** (the web build needs the API's public URL baked in).

### 1. API service

1. New Project → **Deploy from GitHub repo** → pick `StellarIQLabs/stellariq-app`.
2. Service → **Settings**:
   - **Root Directory**: `/` (repo root - the Dockerfile copies workspace packages)
   - **Config-as-code path**: `apps/api/railway.json`
3. Service → **Variables**:
   ```
   API_KEY_SALT=<generate a long random string>
   DATA_API_URL=            # leave empty → mock data
   ```
   `API_HOST=0.0.0.0` and `API_PORT=4000` come from the Dockerfile; Railway
   auto-detects the listening port. If the service ever fails its health check,
   add a variable `API_PORT=${{ PORT }}` so Fastify binds Railway's port.
4. Deploy. Under **Settings → Networking → Generate Domain** to get a public URL,
   e.g. `https://stellariq-api-production.up.railway.app`. Verify:
   `curl https://<api-domain>/health` → `{"status":"ok",...}`.

### 2. Web service

1. In the same project → **New → GitHub Repo** → same repo (a second service).
2. Service → **Settings**:
   - **Root Directory**: `/`
   - **Config-as-code path**: `apps/web/railway.json`
3. Service → **Variables** (these are `NEXT_PUBLIC_*`, baked at build - Railway
   passes them to the Docker build automatically):
   ```
   NEXT_PUBLIC_API_BASE_URL=https://<api-domain>
   NEXT_PUBLIC_WS_URL=wss://<api-domain>/ws
   NEXT_PUBLIC_STELLAR_NETWORK=testnet
   NEXT_PUBLIC_SWAP_ROUTER_ID=CC277AA6E6WZIQRA4N45TQ3O6VV5MUSDMRZCNHO43QENMYXV6E5OVHSP
   ```
   (`NEXT_PUBLIC_HORIZON_URL` and `NEXT_PUBLIC_SOROBAN_RPC_URL` have working
   testnet defaults.)
4. Deploy → **Generate Domain** → open it. That public URL is your demo.

> Changing `NEXT_PUBLIC_API_BASE_URL` later requires a **rebuild** of the web
> service (the value is compiled into the bundle), so set it before/at build.

---

## Option B - Web on Vercel instead (optional)

You do **not** need Vercel if you use Railway for both. Vercel is only if you
want the frontend specifically on it; you'd still host the API on Railway.

On Vercel: **New Project → import the repo →**

- **Root Directory**: `apps/web` (Vercel auto-includes the pnpm workspace)
- **Framework preset**: Next.js
- **Build Command** (override - the workspace packages export from `dist/` and
  must be built before `next build`):
  ```
  pnpm --filter @stellariq/types --filter @stellariq/schemas --filter @stellariq/sdk --filter @stellariq/ui build && pnpm --filter @stellariq/web build
  ```
- **Install Command**: leave default (`pnpm install`)
- **Environment Variables**: the same `NEXT_PUBLIC_*` values as above.

The API still lives on Railway; point `NEXT_PUBLIC_API_BASE_URL` at the Railway
API domain.

---

## Local (for reference)

```bash
cd stellariq-app
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm install
pnpm dev:api   # terminal 1 → http://localhost:4000
pnpm dev:web   # terminal 2 → http://localhost:3000
```

---

## Keeping the demo awake (Render free tier)

Render sleeps a free service after about 15 minutes without traffic. Two
layers keep the API warm for reviewers:

1. **GitHub Actions** - `.github/workflows/keep-warm.yml` pings `/health`
   every 12 minutes. GitHub may delay scheduled runs, so it is best-effort.
2. **cron-job.org** (recommended as the primary pinger):
   - Create a free account at https://cron-job.org and click **Create cronjob**.
   - **URL**: `https://stellariq-api-p1hz.onrender.com/health`
   - **Schedule**: every 10 minutes.
   - Under **Advanced**, set the request timeout to 30 seconds.
   - Save, then add a second job for
     `https://stellariq-data-api.onrender.com/health` with the same settings.
   - The job history should show HTTP 200 within a few runs.

## StellarIQ Give on Vercel

`apps/web/vercel.json` holds the install and build commands, so the only
project settings needed are **Root Directory** `apps/web` and these
environment variables:

```
NEXT_PUBLIC_API_BASE_URL=https://stellariq-api-p1hz.onrender.com
NEXT_PUBLIC_WS_URL=wss://stellariq-api-p1hz.onrender.com/ws
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_DONATIONS_CONTRACT_ID=CBCHKIDRFJ4KO2DGJEP75NJPYN65YVD6QOVVHC5IU7PRTHGHW75OF2KX
NEXT_PUBLIC_SWAP_ROUTER_ID=CC277AA6E6WZIQRA4N45TQ3O6VV5MUSDMRZCNHO43QENMYXV6E5OVHSP
```
