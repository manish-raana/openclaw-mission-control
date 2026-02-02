# Self-hosting Convex for Mission Control

This guide documents how to run Mission Control against a self-hosted Convex
backend. Cloud-hosted Convex works without any of the self-hosted steps below.

## What you will run

Self-hosting Convex for this app runs two services locally:

1. Convex backend (database + functions)
2. Convex dashboard

Your frontend app still runs via Vite locally or your own hosting.

## Prereqs

- Docker installed
- A local .env.local file (never commit secrets)

## Start the self-hosted backend

We keep a repo-specific compose file for self-hosting:

```sh
docker compose -f docker-compose.self-hosted.yml up
```

If you have not started it before or changed env vars, rebuild the containers:

```sh
docker compose -f docker-compose.self-hosted.yml up --build -d
```

The dashboard runs at http://localhost:6791.
The backend runs at http://127.0.0.1:3210.
HTTP actions are available at http://127.0.0.1:3211.

## Admin key (for CLI usage)

Generate a local admin key:

```sh
docker compose -f docker-compose.self-hosted.yml exec backend ./generate_admin_key.sh
```

Add these to .env.local:

```sh
CONVEX_SELF_HOSTED_URL="http://127.0.0.1:3210"
CONVEX_SELF_HOSTED_ADMIN_KEY="convex-self-hosted|<admin key>"
```

## Required app env vars

Front-end:

```sh
VITE_CONVEX_URL="http://127.0.0.1:3210"
```

Convex Auth (self-hosted only):

```sh
CONVEX_SITE_URL="http://127.0.0.1:3211"
```

## Self-hosted JWT keys (required for Convex Auth)

Convex Auth requires JWT keys in self-hosted mode. Cloud-hosted Convex
manages these keys for you.

Generate a key pair:

```sh
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out ./convex-jwt-private.pem
openssl rsa -pubout -in ./convex-jwt-private.pem -out ./convex-jwt-public.pem
```

Set the keys as **Convex deployment environment variables** via the CLI
(not Docker container env vars):

```sh
cat convex-jwt-private.pem | npx convex env set JWT_PRIVATE_KEY \
  --url "http://127.0.0.1:3210" \
  --admin-key "convex-self-hosted|<your-admin-key>"

cat convex-jwt-public.pem | npx convex env set JWT_PUBLIC_KEY \
  --url "http://127.0.0.1:3210" \
  --admin-key "convex-self-hosted|<your-admin-key>"
```

Generate and set the JWKS (JSON Web Key Set) from the public key:

```sh
node -e "
const crypto = require('crypto');
const fs = require('fs');
const pem = fs.readFileSync('convex-jwt-public.pem', 'utf8');
const key = crypto.createPublicKey(pem);
const jwk = key.export({ format: 'jwk' });
jwk.use = 'sig';
jwk.alg = 'RS256';
jwk.kid = 'convex-self-hosted';
console.log(JSON.stringify({ keys: [jwk] }));
" | npx convex env set JWKS \
  --url "http://127.0.0.1:3210" \
  --admin-key "convex-self-hosted|<your-admin-key>"
```

Note: `CONVEX_SITE_URL` is a built-in Convex env var derived from the
backend `CONVEX_SITE_ORIGIN` setting in the compose file, so you do not
set it via the CLI.

Verify the variables are set:

```sh
npx convex env list \
  --url "http://127.0.0.1:3210" \
  --admin-key "convex-self-hosted|<your-admin-key>"
```

## Running the app

Start the frontend without the local Convex dev server:

```sh
bun run dev:self-hosted
```

## Notes

- Keep .env.local and any .pem files out of git.
- For cloud-hosted Convex, do not set the self-hosted env vars or JWT keys.