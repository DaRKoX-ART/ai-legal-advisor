# =============================================================================
# FOLIO backend — minimal image for Railway / Fly / Render / any container host
# =============================================================================
# The backend in server/serve.js has zero npm dependencies (only Node built-ins:
# http, fs, path, URL, AbortController). We therefore do NOT run `npm install`
# — there is nothing to install. Skipping it avoids pulling the ~500 MB of
# Expo + React Native devDependencies from the root package.json that are
# irrelevant to the server.
#
# Files actually read at runtime by server/serve.js:
#   - server/serve.js
#   - server/templates/landing-page.html (read once at boot)
#   - ../app.json                         (read once at boot for the app name)
#
# .env / .env.server are intentionally NOT copied: Railway injects environment
# variables directly into the process, which is exactly what the loadEnvFile()
# helper falls through to when the files are missing.
# =============================================================================

FROM node:20-alpine

WORKDIR /app

COPY server ./server
COPY app.json ./

ENV NODE_ENV=production

# Documentary only — Railway will set $PORT and the server already reads it.
EXPOSE 3000

CMD ["node", "server/serve.js"]
