#!/bin/sh
# Serve the word game over http://localhost so Chrome remembers mic permission
# and ES modules (./words.js) load without file:// CORS errors.
cd "$(dirname "$0")"
echo "Picture Words: http://localhost:8001"
exec python3 -m http.server 8001
