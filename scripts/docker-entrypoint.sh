#!/bin/sh
# Frontend container startup — no migrations needed here.
# DB migrations are handled by the backend container.
set -e
echo "==> Starting Next.js..."
exec npm start
