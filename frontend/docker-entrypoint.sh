#!/bin/sh
set -e

# Run Prisma migrations on every startup — idempotent, safe, ensures
# the auth DB schema is always up-to-date before the server starts.
echo "[devscope] Running Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

echo "[devscope] Starting Next.js server..."
exec node server.js
