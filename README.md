# spiritandbody
Game

## Local development

```bash
npm run install:all
cp .env.example server/.env   # fill in JWT_SECRET and POSTGRES_URL
npm run seed                  # creates tables in the Postgres database
npm run dev                   # runs client (5173) + server (3001) together
```

The server needs a real Postgres database even for local dev — either point
`POSTGRES_URL` at a local Postgres instance, or use a free Neon/Vercel
Postgres database for both dev and production.

## Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel (New Project).
2. In the Vercel project, go to **Storage -> Create Database -> Postgres**
   and attach it to the project. This automatically adds a `POSTGRES_URL`
   environment variable.
3. Add the remaining environment variables under **Settings -> Environment
   Variables**: `JWT_SECRET` (any long random string).
4. Deploy. `vercel.json` at the repo root builds the client
   (`client/dist`) as the static site and serves the Express API from
   `api/index.js` under `/api/*`.
5. On first request, the server automatically creates the database schema
   (`CREATE TABLE IF NOT EXISTS ...`), so no manual migration step is
   needed after the first deploy.
