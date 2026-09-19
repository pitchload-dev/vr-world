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

## Company data and media

Company logos appear on each supplied booth's entrance and back-wall header. Hero images have a separate inward-facing side wall, preserving the information boards. The same artwork appears in the desktop company profile. Images use their complete aspect ratio, including any embedded text. Missing or failed images retain the company-name fallback.

Run `npm run sync:images` after refreshing Pitchload to download its public logo and hero URLs into `public/media/companies/` and update `lib/company-image-assets.json`. The full Netlify package includes these files, so the headset does not depend on external image-server CORS. Original API URLs remain in the profile data. Six companies currently supply both images; Superheated and the four unmatched previews have no images in the current API snapshot.

The standalone demo uses `work/pitchload-current.json`, the saved Pitchload playlist snapshot. Unmatched startups retain labeled preview content. Company decks, media, investment amounts and readiness values may include explicitly labeled samples or unavailable fields. The media directory includes a sample exhibit film and captions.

The snapshot was refreshed on 19 September 2026 using the expanded API: all 13 documented startup details feed the product/company profile reader on desktop and in VR. Funding banners now reflect the supplied investment status and amount. Missing values remain unavailable; the four companies outside the playlist retain their existing content. Refresh from the API with `npm run refresh:pitchload`, using a local `PITCHLOAD_API_KEY` or ignored `.dev.vars`, then run `npm run build:demo`. The refresh never uses the old request cache or places the API key in the exported files.

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
