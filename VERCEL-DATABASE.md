# Cloud save: setup (once)
1. Vercel dashboard > your project > Storage > Create > Upstash Redis (Marketplace, free plan) > Connect to the project.
   This adds KV_REST_API_URL and KV_REST_API_TOKEN automatically (UPSTASH_REDIS_REST_URL / _TOKEN also work).
2. Redeploy the project. `api/cloud.js` becomes https://low-poly-drift.vercel.app/api/cloud.
3. Open the site > "Sign in / Cloud save" > create an account.
Passwords are stored hashed (scrypt); sessions last 60 days.
