#!/bin/bash
set -e

COMPOSE_FILE="/root/task/docker-compose.yml"

echo "[kill.sh] Stopping and removing containers..."
docker-compose -f "$COMPOSE_FILE" down --volumes --remove-orphans || true

echo "[kill.sh] Removing related Docker images (application and mongo)..."
APP_IMAGE_IDS=$(docker images -q | grep -E 'utkrusht-multitenant-optimization-task|utkrusht-api' || true)
MONGO_IMAGE_IDS=$(docker images -q mongo || true)
ALL_IDS="${APP_IMAGE_IDS} ${MONGO_IMAGE_IDS}"

if [ -n "${ALL_IDS// /}" ]; then
  docker rmi -f $ALL_IDS || true
else
  echo "[kill.sh] No matching images found to remove."
fi

echo "[kill.sh] Running docker system prune to clean up dangling resources..."
docker system prune -a --volumes -f || true

echo "[kill.sh] Deleting /root/task directory and all contents..."
rm -rf /root/task || true

echo "[kill.sh] Cleanup completed successfully! Droplet is now clean."
