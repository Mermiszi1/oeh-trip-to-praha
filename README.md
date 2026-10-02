# ÖH Prague Trip Guide

- `public/` – the website (guide, login page, organiser tools, images)
- `worker/index.js` – login (student / admin), page protection, organiser sync, room publishing
- `wrangler.jsonc` – Cloudflare settings (see the comments there to switch on the cloud storage)

Keep this repository **private**: `worker/index.js` contains the login settings.
