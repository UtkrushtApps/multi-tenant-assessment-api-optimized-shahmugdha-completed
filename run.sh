#!/bin/bash
set -e

COMPOSE_FILE="/root/task/docker-compose.yml"

echo "[run.sh] Starting Docker containers..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for MongoDB to be ready
echo "[run.sh] Waiting for MongoDB to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  if docker exec utkrusht-mongo mongosh --quiet --eval "db.adminCommand('ping').ok" >/dev/null 2>&1; then
    echo "[run.sh] MongoDB is ready."
    break
  else
    echo "[run.sh] MongoDB not ready yet (attempt $ATTEMPT/$MAX_ATTEMPTS), waiting..."
    sleep 2
  fi
  ATTEMPT=$((ATTEMPT+1))
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
  echo "[run.sh] MongoDB did not become ready in time. Exiting."
  exit 1
fi

# Wait briefly for API to start
echo "[run.sh] Waiting for API to start..."
sleep 5

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || true)

if [ "$API_STATUS" == "200" ]; then
  echo "[run.sh] API is responding successfully (HTTP 200)."
else
  echo "[run.sh] API did not respond with HTTP 200 (status: $API_STATUS). Please check container logs if needed."
fi

echo "[run.sh] Deployment completed. Containers are running in the background."
