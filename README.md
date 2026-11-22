# RIZZ CLOUD

Cloud storage web app with a light holographic UI, Google login, private file list, direct-to-Cloudflare-R2 uploads and shareable download links.

## Stack
- Next.js 15 App Router (Vercel hosting)
- Supabase Auth + Postgres (Google OAuth and file metadata)
- Cloudflare R2 (actual file bytes)
- Presigned S3 URLs (browser uploads directly to R2)

## Important limits
- Maximum file size enforced by the signing API and database: **1 GiB (1,073,741,824 bytes) per file**.
- There is no per-user total quota in this build. Actual storage/cost limits are governed by your R2 account and plan.
- Files upload directly from the browser to R2, not through a Vercel function.
- Current upload implementation uses a single presigned PUT. Cloudflare R2 supports large single-object PUTs up to its documented limit; if you need resilient resumable uploads for unstable mobile networks, implement multipart upload in a later version.
- Deleting a database row does not yet delete the R2 object. The UI warns about this; configure an authenticated delete endpoint before production use.

## 1. Create Supabase
1. Create a project at https://supabase.com.
2. In SQL Editor, run `supabase/schema.sql`.
3. In Authentication > Providers, enable Google.
4. Configure Google OAuth credentials in Google Cloud Console.
5. Add Supabase callback URL `https://YOUR_PROJECT.supabase.co/auth/v1/callback` to Google OAuth authorized redirect URIs.
6. In Supabase Authentication > URL Configuration, set Site URL to your Vercel URL and add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_VERCEL_DOMAIN/auth/callback`
7. Copy Project URL, anon key and service role key into environment variables. Keep the service role key secret.

## 2. Create Cloudflare R2 bucket
1. Cloudflare Dashboard > R2 > Create bucket.
2. Create an R2 API token with Object Read & Write permissions for this bucket.
3. Copy Account ID, Access Key ID and Secret Access Key.
4. CORS settings for the bucket must allow your origins and PUT:
```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://YOUR_VERCEL_DOMAIN"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```
5. Do not make the bucket public. The app uses signed upload and download URLs.

## 3. Configure local environment
Copy `.env.example` to `.env.local`, then fill:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

## 4. Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## 5. Deploy to Vercel
1. Push this folder to a GitHub repository.
2. Import the repository in Vercel.
3. Add all variables from `.env.example` in Vercel Project Settings > Environment Variables.
4. Deploy.
5. Update Supabase Site URL and redirect URL with the production domain.
6. Add production domain to R2 CORS AllowedOrigins.

## Security notes before production
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or R2 secret credentials in client code.
- The API checks user session before signing an upload.
- The browser writes metadata through owner-only RLS.
- Public share tokens are long random UUIDs. The API only issues download URLs for active public tokens.
- Add rate limiting and abuse monitoring before allowing public signups at scale.
- Consider antivirus/content scanning and quotas before storing untrusted public uploads.
- For production-grade deletion, implement server-side object deletion after verifying ownership.
