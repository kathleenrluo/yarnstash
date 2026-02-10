# Railway Deployment: Variables, Auth, and Persistent Uploads

## 1. DATABASE_URL

**If you don’t see `DATABASE_URL` in your Railway project variables**, the app will use the SQLite file in the image (or fail if it can’t write). To use **PostgreSQL** on Railway:

### Option A: Link the Postgres service (recommended)

1. In your Railway project, add a **PostgreSQL** service if you don’t have one (New → Database → PostgreSQL).
2. Click your **app service** (the one built from this repo).
3. Go to **Variables** (or **Settings** → **Variables**).
4. Click **Add variable** or **Connect to service**. If you see something like **“Add reference”** or **“Link Postgres”**, use that to link the Postgres service. Railway will then inject **`DATABASE_URL`** (and sometimes `PGHOST`, `PGPORT`, etc.) automatically.
5. Redeploy the app so it picks up the new variables.

### Option B: Add DATABASE_URL manually

1. Click your **PostgreSQL** service → **Variables** (or **Connect**).
2. Copy the connection URL (often `DATABASE_URL` or `DATABASE_PRIVATE_URL`). It may look like `postgres://postgres:xxxxx@...railway.internal:5432/railway`.
3. For the **app** service, add a variable:
   - **Name:** `DATABASE_URL`
   - **Value:** the URL you copied (the app accepts both `postgres://` and `postgresql://`).
4. Redeploy the app.

**Note:** If Postgres is only exposed on Railway’s private network, use the **private** URL (e.g. `DATABASE_PRIVATE_URL`) so the app service can reach it from inside Railway.

**Staging:** If you have a separate **staging** environment (e.g. a different Railway project or environment), it has its own Postgres and its own `DATABASE_URL`. You must **copy your data into staging Postgres** once: see [Copy data into staging Postgres](#copy-data-into-staging-postgres) below.

---

## 2. Auth and other variables

Add these in your **app service** → **Variables** so login and redirects work in production.

| Variable | Where to get it | Example |
|----------|------------------|--------|
| **GOOGLE_CLIENT_ID** | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application). Use the **Client ID**. | `123...apps.googleusercontent.com` |
| **GOOGLE_CLIENT_SECRET** | Same OAuth client → **Client secret**. | `GOCSPX-...` |
| **JWT_SECRET** | Generate a long random string (e.g. 32+ chars). Never commit this. | `openssl rand -hex 32` or any password generator |
| **BACKEND_URL** | Your Railway app URL (no trailing slash). | `https://your-app.up.railway.app` |
| **FRONTEND_URL** | Same as BACKEND_URL if you serve the frontend from the same app (single deployment). | `https://your-app.up.railway.app` |
| **SHOWCASE_EMAIL** | (Optional) Email of the user whose stash/projects are shown on the public gallery. | `you@gmail.com` |

### Google OAuth setup for production

1. In Google Cloud Console, open your OAuth 2.0 client (Web application).
2. Under **Authorized redirect URIs**, add:
   - `https://YOUR-RAILWAY-APP.up.railway.app/auth/google/callback`
   (Replace with your real Railway URL.)
3. Under **Authorized JavaScript origins**, add:
   - `https://YOUR-RAILWAY-APP.up.railway.app`
4. Save. Then set **GOOGLE_CLIENT_ID**, **GOOGLE_CLIENT_SECRET**, **BACKEND_URL**, and **FRONTEND_URL** in Railway as above.

---

## 3. Persistent uploads (survive redeploys)

By default, uploads go to `backend/uploads` inside the container. That directory is **ephemeral**: it’s wiped on every redeploy. To keep uploads across redeploys, use a **Railway Volume** so that directory is persistent.

### Steps

1. In Railway, open your **app service**.
2. Go to **Settings** (or the service’s configuration).
3. Find **Volumes** (or **Storage**). Click **Add Volume** (or **Create Volume**).
4. Set the **mount path** to:
   ```text
   /app/backend/uploads
   ```
   (The app writes to `backend/uploads`; in the container that path is `/app/backend/uploads`.)
5. Create the volume and attach it to this service. Redeploy.

After this, any file saved under `/app/backend/uploads` (i.e. all uploads from the app) will live on the volume and persist across redeploys.

### One-time: copy your existing uploads into the volume

If your Docker image currently **COPY**s `backend/uploads` into the container, those files are **not** visible once a volume is mounted at `/app/backend/uploads` (the volume replaces that directory). To put your existing files into the volume with **the same filenames**:

1. **Set a one-time secret** in Railway (app service → Variables):
   - **Name:** `BULK_UPLOAD_SECRET`  
   - **Value:** any random string (e.g. from `openssl rand -hex 16`). You’ll use it once and can remove it later.

2. **Zip your local `backend/uploads` folder** (include only the image files; same names as in the DB).  
   Example (PowerShell from repo root):
   ```powershell
   Compress-Archive -Path backend\uploads\* -DestinationPath uploads.zip
   ```

3. **POST the zip to the bulk-upload endpoint** with the secret in a header:
   ```powershell
   curl -X POST "https://YOUR-APP.up.railway.app/admin/bulk-upload-uploads" -H "X-Bulk-Upload-Secret: YOUR_BULK_UPLOAD_SECRET" -F "file=@uploads.zip"
   ```
   Replace `YOUR-APP`, `YOUR_BULK_UPLOAD_SECRET`, and the path to your zip. The response will show how many files were extracted.

4. **(Optional)** Remove or leave `BULK_UPLOAD_SECRET` in Railway. If you remove it, the endpoint will return 404 so it can’t be abused.

### Backing up / getting your data off the volume

To download all uploads from the volume as a zip (e.g. before credits run out or to keep a local backup):

1. Ensure `BULK_UPLOAD_SECRET` is set in Railway (same secret as bulk upload).
2. Download the zip (replace `YOUR_APP` and `YOUR_SECRET`):
   ```powershell
   curl -o uploads-backup.zip -H "X-Bulk-Upload-Secret: YOUR_SECRET" "https://YOUR_APP.up.railway.app/admin/export-uploads"
   ```
   Or in a browser you can’t send the header easily—use a tool like Postman, or run the `curl` above. The response is `uploads-backup.zip` with all image files.

**Postgres:** Back up your database separately (e.g. Railway Postgres has backup/export options, or use `pg_dump` with the connection string).

---

## Testing deployments without breaking production

To avoid someone seeing a broken app while you test:

### 1. Test locally (production-like)

Run the backend the way Railway runs it so routes and env are the same:

```powershell
cd backend
$env:SERVE_STATIC = "true"
$env:BULK_UPLOAD_SECRET = "test-secret"   # use the same value as in .env
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Then in another terminal:

- Open `http://127.0.0.1:8000/` — you should see the app (or API docs if frontend isn’t built).
- `GET http://127.0.0.1:8000/admin/export-uploads` with header `X-Bulk-Upload-Secret: test-secret` — you should get a zip or 404 (no uploads), **not** the SPA HTML.

If both behave as above, the same code on Railway should be fine.

### 2. Use a preview deploy (recommended)

Railway can deploy **preview environments** from a branch or PR so production stays untouched:

1. **Railway project** → **Settings** (or your service) → find **Deployments** / **GitHub**.
2. Enable **Preview deployments** or **Deploy from branch** (wording may vary). See [Railway docs – Environments](https://docs.railway.com/guides/environments) and [Controlling GitHub Autodeploys](https://docs.railway.com/guides/github-autodeploys).
3. Push your changes to a **branch** (e.g. `staging` or `test-export`). Do **not** merge to `main` yet.
4. Open a **pull request** from that branch to `main` (or use the branch deploy if you have it). Railway will build and deploy that branch to a **separate preview URL** (e.g. `yarnstash-production-staging.up.railway.app` or a PR-specific URL).
5. Test the **preview URL**: login, navigation, and `GET /admin/export-uploads` with your secret. No one uses this URL unless you share it.
6. When everything works, **merge to `main`**. Production will then deploy the same code you already tested.

Your main production URL stays on the current deploy until you merge.

### 3. Deploy at a quiet time

If you don’t use previews, deploy when traffic is low and have a rollback ready: keep the previous commit (or a “last known good” tag) so you can revert and redeploy quickly if something breaks.

### Copy data into staging Postgres

Staging uses a **different** Postgres than production. To fill it with your current data (from local SQLite):

1. In Railway, open your **staging** environment and the **PostgreSQL** service there.
2. Enable **TCP Proxy** on that Postgres (Settings/Connect → enable so you get a public host/port).
3. Copy the **public** connection URL (e.g. from Variables: `RAILWAY_TCP_PROXY_DOMAIN`, `RAILWAY_TCP_PROXY_PORT`, and the Postgres password).
4. From your machine, run (replace with your **staging** Postgres URL):
   ```powershell
   cd backend
   python migrations/copy_sqlite_to_postgres.py "postgresql://postgres:YOUR_STAGING_PASSWORD@STAGING_TCP_HOST:STAGING_TCP_PORT/railway"
   ```
5. Redeploy the staging app if it’s already running so it picks up the new data.

Full steps (TCP proxy, URL format) are in **`docs/RAILWAY_POSTGRES_LOCAL_COPY.md`**.

### Demo mode (read-only banner)

The “Demo Mode - Read Only” banner is controlled at **build time** by `VITE_DEMO_MODE`. The Dockerfile now defaults to **`false`**, so new builds (including staging) are full app, not demo. To build a read-only demo deploy, set Docker build arg **`VITE_DEMO_MODE=true`** in your Railway service (Settings → Build → Build arguments or similar).

### Alternative: object storage (S3, R2, etc.)

For larger scale or multiple instances, you can later switch to object storage (e.g. AWS S3 or Cloudflare R2). That would require code changes: upload API would write to the bucket and store object URLs in the database, and you’d add env vars for bucket name and credentials. The Volume approach above is the minimal change for “uploads survive redeploy” on Railway.
