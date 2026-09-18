# Pitchload content integration

## Investment-interest backend

The latest export adds a separate Netlify backend package. `netlify/functions/interests.ts` uses a strongly consistent Netlify Blobs store; `server/interests.ts` validates submissions, uses conditional writes to avoid lost updates, deduplicates retries, and protects table reads with a password-verified server session. The chosen password is stored only as a salted PBKDF2 verifier in server code. Frontend code never contains the verifier or password. The static-only ZIP does not include or activate this backend: deploy the complete backend package using `deployment/NETLIFY-BACKEND.md`. The existing Sites/Cloudflare runtime does not provide this Netlify endpoint.

Both desktop and immersive VR show success only after a successful server response. Stored fields are startup, timestamp, answer, optional amount, source and request ID; no personal contact fields are collected. Company investment targets and status come from Pitchload where supplied; unmatched profiles retain labeled demo amounts. The local packaged Node server uses a private file store for testing; Netlify uses site-wide Blobs so responses survive deployments on that same site. Local files and authentication sessions are excluded from delivery archives.

## Company profiles

The exhibition uses the documented read-only API at https://pitchload.net/api/v1.
Its configured playlist is `87e366e3-2731-4099-9e38-9072e86795c1`.

Configure `PITCHLOAD_API_KEY` as a Sites server-side secret. Optionally override `PITCHLOAD_PLAYLIST_ID`. Redeploy after changing hosted runtime values. Never use a NEXT_PUBLIC variable for the API key. The browser requests only `/api/exhibition`; the Worker attaches the Bearer token to fixed-origin upstream requests.

Local development reads the ignored `.dev.vars` file. Never include that file in an archive or source commit. The Netlify Drop export is static: it bundles a normalized snapshot from `work/pitchload-current.json`, not the secret or raw API responses. A live Netlify integration would require a server-side function and separately configured secret; uploading the static ZIP does not activate live refresh.

Data flow:
1. Read paginated `/playlists/{id}/entries?category=STARTUP`.
2. Match members to the eleven requested startups by normalized exact name or handle (with the KCM long-name alias and user-confirmed FORMIC Transportsysteme alias).
3. Read `/organizations/{handle}?format=text` and paginated `/jobs?organization={handle}`.
4. Render the same normalized data into the directory, company panel, 3D slides and careers rack.
5. After all profiles and job lists load, fetch optional `/jobs/{id}?format=text` descriptions within a conservative 20-request budget. Cache detailed texts for 30 minutes, and stop extra calls on a rate-limit response. Failed optional details retain the supplied summaries.

Verified 18 September 2026: seven matching profiles and 13 jobs. Nanoshape, KCM, Sparseon and Formetis remain outside the playlist and retain their previous content. All 13 fields of the documented nested `startup` object are mapped; booleans preserve false, zero amounts remain zero, and null is not replaced with a demo fact.

Requests have timeouts, reject redirects, use limited concurrency, and cache successful content for five minutes per Worker isolate. Failed or unmatched booths keep clearly labeled preview content. A jobs failure preserves existing published sample listings rather than falsely declaring no openings. Links must use HTTPS. API strings render as text, never injected HTML. The roster remains eleven booths; unrelated playlist entries are not silently substituted.

The published OpenAPI schema does not expose documents, videos, 3D files, or meeting links. The user plans a separate media endpoint. Current slide content comes from `lib/booth-content.ts`; the shared 18-second H.264 film is local in `public/media`; follow-up buttons save requests in the separate Netlify backend; they do not book calendar slots or send invitations. No media endpoint URL or response schema has been invented. Wire its approved contract here when supplied, including CORS-enabled media URLs suitable for WebGL textures and headset playback.

Physical Quest 3 verification remains required: VR entry, trigger teleport, snap turns, in-world slide controls, video playback, text readability and frame rate. Optional WebMCP tools are implemented but were not exercised in a supported WebMCP browser.

## Complete profile board

The video wall is replaced by the Product / Company / Headquarters board. Clicking it opens the complete field reader on desktop or a paginated, world-anchored reader in VR. Only the company popup retains the preview video. The organization fields and all 13 nested startup details are retained in `Startup.profile`, including the full descriptions, contact and address fields, image URLs and timestamps. Unsafe links are not made clickable.

The nested startup fields are Stage, Go to Market Model (gtmModel), Product Type, Industry, Legal Form, Incorporated, Female Founders, First-time Founders, Seeking Investment, Investment Size, Business Readiness Level, Product Readiness Level and Technology Readiness Level. All are displayed in the complete desktop and VR profile reader. The physical product/company board summarizes them and opens the complete reader. Readiness descriptions are shown as supplied, without inventing numeric scores.

The current contract still has no founder count, separate region or funding currency. Those fields remain unavailable, except the organizer-supplied KCM preview. Addresses are preserved verbatim. API investment banners do not invent a currency or reuse demo targets when the company reports that it is not seeking investment.

Run `npm run refresh:pitchload` to retrieve fresh profiles with the locally stored key, then `npm run build:demo` to export the complete Netlify package. The normalized snapshot contains no API credential. The downloadable package contains frontend and the request-storage function; it does not automatically refresh Pitchload on Netlify.
