# Cloud save: setup (once)
1. Vercel dashboard > your project > Storage > Create > Upstash Redis (Marketplace, free plan) > Connect to the project.
   Any variable prefix works: the code looks for <PREFIX>_REST_API_URL / _TOKEN (or UPSTASH_REDIS_REST_URL / _TOKEN).
2. Redeploy the project. `api/cloud.js` becomes https://low-poly-drift.vercel.app/api/cloud.
3. Open the site > "Sign in / Cloud save" > create an account.
Passwords are stored hashed (scrypt); sessions last 60 days.
