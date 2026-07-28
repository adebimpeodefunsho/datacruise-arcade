#!/bin/bash
# Warm the Workers-AI result-card scenes so every player — including the
# very first — gets an instant, edge-cached image. Run once after each
# deploy, and again only if you change a prompt in src/worker.js
# (and bump the cache-key version there).
set -u
BASE="https://datacruise-arcade.adebimpeodefunsho.workers.dev"
SLUGS=(mountain-climb block-city bubble-catcher dashboard-drop pie-spinner \
       decision-lab derive-jargon data-crossword data-hunt scrub-mess sentence-builder)

echo "Warming ${#SLUGS[@]} AI scenes at $BASE ..."
for s in "${SLUGS[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/scene?slug=$s")
  printf "  %-18s HTTP %s\n" "$s" "$code"
done
echo "Done. (First run generates + caches each image; re-runs are instant.)"
