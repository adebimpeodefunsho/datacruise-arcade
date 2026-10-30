#!/bin/bash
# Ping IndexNow so Bing, Yandex and Seznam re-crawl immediately instead of
# waiting to rediscover the site on their own. Google does NOT use IndexNow —
# for Google, submit the sitemap in Search Console.
#
# The key file at /3e0d2c7c1db2562ad860ced0f7db2d76.txt proves we control the domain; it must stay served.
# Safe to re-run after any deploy that changes page content.
set -euo pipefail
KEY="3e0d2c7c1db2562ad860ced0f7db2d76"
HOST="arcade.datacruise.app"

URLS=$(python3 - <<'PY'
import re
s = open("sitemap.xml", encoding="utf-8").read()
for u in re.findall(r"<loc>(.*?)</loc>", s):
    print(u)
PY
)

BODY=$(python3 - "$KEY" "$HOST" <<'PY'
import json, sys, subprocess, re
key, host = sys.argv[1], sys.argv[2]
urls = re.findall(r"<loc>(.*?)</loc>", open("sitemap.xml", encoding="utf-8").read())
print(json.dumps({"host": host, "key": key,
                  "keyLocation": f"https://{host}/{key}.txt", "urlList": urls}))
PY
)

echo "Submitting $(echo "$URLS" | wc -l | tr -d ' ') URLs to IndexNow..."
curl -sS -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$BODY" -w "\nHTTP %{http_code}\n"
