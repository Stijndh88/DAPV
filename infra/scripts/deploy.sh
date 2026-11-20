#!/usr/bin/env bash
# Pull the latest image and restart the stack with zero manual steps.
# Called by GitHub Actions over SSH, or by hand:  ./scripts/deploy.sh [tag]
set -euo pipefail
cd "$(dirname "$0")/.."

TAG="${1:-}"
if [ -n "$TAG" ]; then
  sed -i "s/^APP_TAG=.*/APP_TAG=$TAG/" .env
fi

# Keep infra config in sync with the repo if this is a git checkout.
if git -C .. rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git -C .. pull --ff-only || echo "warning: git pull failed, continuing with current config"
fi

# Safety net: snapshot before every deploy (migrations may change the schema).
./scripts/backup-now.sh || { echo "pre-deploy backup failed, aborting"; exit 1; }

docker compose pull app
docker compose build backup
docker compose up -d --remove-orphans

echo "waiting for app to become healthy..."
for _ in $(seq 1 40); do
  status="$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q app)" 2>/dev/null || echo starting)"
  [ "$status" = healthy ] && { echo "app is healthy"; docker image prune -f >/dev/null; exit 0; }
  sleep 5
done
echo "app did not become healthy within 200s; recent logs:"
docker compose logs --tail=80 app
exit 1
