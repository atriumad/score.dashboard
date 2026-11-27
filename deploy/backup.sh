#!/bin/sh
# Nightly copy of the saved stages (Redis snapshot), kept 30 days.
set -e
DIR=/opt/scoredashboard/backups
mkdir -p "$DIR"
docker exec scoredashboard-scoreredis-1 redis-cli SAVE >/dev/null
docker cp scoredashboard-scoreredis-1:/data/dump.rdb "$DIR/score_$(date -u +%Y-%m-%d_%H%M).rdb"
find "$DIR" -name 'score_*.rdb' -mtime +30 -delete
echo "$(date -u) ok"
