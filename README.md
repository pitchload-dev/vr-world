# KIT Venture Hall

Interactive startup exhibition for desktop browsers and Meta Quest 3 via WebXR. Eleven booths include company profiles, abstract interactive exhibits, job listings, presentations, investment-interest forms and follow-up requests with a VR keyboard.

## Run the complete demo locally

Requires Node.js 22.13 or newer and npm.

```sh
npm ci
npm run build:demo
npm run demo
```

Open http://localhost:4173. This runs the exhibition and its password-protected investment and follow-up tables. Local records are stored in `../outputs/kit-venture-hall-netlify-backend/.local-data/` and are excluded from Git. Rebuilding preserves those records.

## Build and deploy to Netlify

`npm run build:demo` creates these folders next to the repository:

- `../outputs/kit-venture-hall-netlify/`: static frontend only.
- `../outputs/kit-venture-hall-netlify-backend/`: frontend, bundled Netlify function and standalone local server.

Use the complete backend package for persistent tables. Netlify Drop uploads only the frontend and cannot install the function. See [deployment/NETLIFY-BACKEND.md](deployment/NETLIFY-BACKEND.md) for deployment instructions. Netlify stores requests in Netlify Blobs; the two tables share the configured server-side password login. Only the salted password verifier is included, never the plaintext password. An alternative verifier may be configured with `INTEREST_ADMIN_PASSWORD_HASH`.

## Publish the static exhibition with GitHub Pages

The workflow in `.github/workflows/pages.yml` publishes the static exhibition at `https://pitchload-dev.github.io/vr-world/` after every push to `main`.

An administrator must enable it once in **Settings → Pages → Build and deployment → Source → GitHub Actions**. The repository is private, so the organization plan must support Pages for private repositories. Unless the organization uses Enterprise Cloud private Pages, the published website is public even though the source repository is private.

GitHub Pages cannot run the server-side storage function. Profiles, booths, media, desktop controls and WebXR work there, but investment and follow-up submissions will show a storage error and the protected tables have no data source. Deploy the Netlify backend package when those features are needed online.

## Company data and media

The standalone demo uses `work/pitchload-current.json`, the saved Pitchload playlist snapshot. Unmatched startups retain labeled preview content. Company decks, media, investment amounts and readiness values may include explicitly labeled samples or unavailable fields. The media directory includes a sample exhibit film and captions.

The separate Vinext development mode (`npm run dev`) provides `/api/exhibition` for live Pitchload data. Copy `.env.example` to `.dev.vars` and configure `PITCHLOAD_API_KEY` locally; see [API_INTEGRATION.md](API_INTEGRATION.md). The Netlify demo does not automatically become live when an API key is added. The local demo server and Netlify function provide the request-storage endpoints; the Vinext development server does not provide those endpoints.

## Validation

```sh
npm run typecheck
npm test
npm run build
```

Tests exercise VR popup actions and contact entry, joystick movement, persistence, validation, concurrent submissions, duplicate retries, password authentication and session expiry. A physical Quest 3 check is still required for headset comfort and performance. Use a deployed HTTPS URL for WebXR.

## Repository contents

Application source, assets, configuration, lockfile, Netlify export sources, backend, tests and demo content are included. Dependencies, generated output, temporary diagnostics, API credentials and visitor records are intentionally excluded. The bundled Geist font is distributed under the SIL Open Font License in `public/fonts/OFL.txt`.
