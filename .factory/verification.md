# Independent verification — FAIL

**Verifier:** factory independent QA  
**Date:** 2026-08-28  
**Candidate commit:** `6ce8d86da8a8d1a60c8ae96c40c6f134747481df`  
**Live URL:** <https://lesson-motion-cues.sociobot.in/>  
**Result:** **FAIL — do not release**

## Release blockers

### B1 — required claims contract is absent

`.factory/claims.json` does not exist at the candidate commit. The work order explicitly makes a missing manifest, and therefore the inability to run every listed claim through the product demo entry point, release-blocking. No claim tests could be enumerated or run.

### B2 — cold first-read/demo-sandbox acceptance fails

Fresh desktop and 390px loads show a pre-populated pollination cue sheet. In plain words, the screen says the product lets an author place actors, write cues, and play/export a versioned lesson. It only identifies the audience as educators in the footer, and it gives no plain-language instruction for what to click first: the available top actions are `New`, `Import`, and `Export`, with `Play` in the preview.

There is **no one-click `Try with sample data` (or equivalent) control** on either viewport (`getByRole('button', { name: /try|sample/i })` returned zero). A preloaded example is not the required explicit demo entry point. This independently fails the work order's first-read and demo-sandbox rule.

## Defects

| Severity | Finding | Fresh reproduction/evidence |
|---|---|---|
| High | Malformed-but-accepted project JSON can persist and break the editor on every reload. | Import a `.lmc.json` whose otherwise accepted actor has numeric `name: 7`. `validateProject` accepts it; rendering throws `e.replace is not a function` after the malformed project is already stored in `lmc:project:v1`. On reload the same page error occurs and the editor is only partially rendered, without an in-product reset/recovery control. The import alert misleadingly says the file is unsupported even though it was persisted. This violates invalid-input recovery and local-first reliability. |
| Medium | The phone layout removes `New`, contrary to the stated responsive policy that no capability is removed. | At 390x844, the `New` button is absent (`.topbar nav .quiet:first-child { display:none }`). A phone-only user cannot start the documented blank-project flow from the UI. |
| Medium | Production hashed assets are not immutable-cached. | `/assets/index-BvNY_9ye.js`, `/assets/index-Dwt3oqzS.css`, fonts, WebP, and `/sw.js` all return `cache-control: public, must-revalidate, max-age=30`. The performance contract calls for long-lived immutable caching for hashed assets. |
| Low | No `Content-Security-Policy` response header is deployed. | Fresh `curl -I` responses include HSTS, Referrer-Policy, X-Content-Type-Options and Permissions-Policy, but no CSP. Add a restrictive static-app CSP after checking the export/download behavior. |

## Required checks and evidence

### Clean checkout / build

- Confirmed clean candidate checkout before verification: `HEAD` was `6ce8d86da8a8d1a60c8ae96c40c6f134747481df`.
- `npm ci`: passed (61 packages; no vulnerabilities reported).
- `npm test`: **passed** — 3 Vitest model tests and 4 Playwright tests.
- `npm run build`: **passed** — TypeScript check and Vite production build. No separate lint/typecheck script exists; the build runs `tsc --noEmit`.
- Build output: JS 31,227 B (11,464 B gzip), CSS 15,971 B (4,430 B gzip), fonts 34,732 B total, hero WebP 52,370 B, complete `dist/` 137,281 B. Initial JS is within the 200 KB budget.

### Candidate/deployment identity

The fresh local build SHA-256 exactly matched the live deployment for the HTML, hashed JS, hashed CSS, service worker, and hero image:

- `index.html` `b20657856a38ad8b7e1575bfa7f48a7162442ad419865e3104fd2dba6152d6cb`
- `index-BvNY_9ye.js` `a78e9992dacf1413cba60d07ce7ebca2e629359cd5f14dac8228e4f5a31be085`
- `index-Dwt3oqzS.css` `20ceb902eb98d95a5ce996a591bd3fbde9488b68b08647ee015bb7ec5f757380`
- `sw.js` `c1aace2804664447d3868381fb510c4e4762fd22b344cb9b6c1b8a34a4bcd5b7`
- `hero-map.webp` `013705712363313d95a2ee21fe14f8eea6e9e2f083b69f40f08864b3089613d3`

Therefore this is not a deployment-only mismatch: the live deployment is the tested candidate.

### End-to-end product checks

- Fresh live sample loaded 3 actors and 7 cues. A blank lesson could create an actor named `Orbit`; a normal `say` cue saved successfully.
- Boundary validation worked for a cue starting at 899 s and lasting 2 s in a 45 s lesson: `Keep this cue between 0 and 45 seconds.` Correcting it to 0–1 s recovered and saved.
- Invalid unsupported-format JSON showed a specific alert and retained the existing cue. The structurally malformed accepted JSON case above is the failure.
- Versioned JSON, JavaScript data, and self-contained SVG downloads succeeded. Their outputs respectively began with the v1 JSON object, `export const lesson =`, and SVG markup.
- The 20-second sample video export completed with `how-pollination-travels.mp4`, no download failure, 323,194 bytes, ISO-BMFF `ftyp` signature, and status `MP4 recording saved.`
- Service worker registered and controlled the page. After a warm online visit, an offline reload rendered the editor and its H1 without console/page errors. Source inspection confirms a versioned cache plus `skipWaiting()`/`clients.claim()`; a real future-version deployment was not available to simulate an update.

### Accessibility, responsive, and browser checks

- Live desktop and 390x844 Chromium runs: no page errors, console errors, failed requests, or horizontal page overflow.
- `@axe-core/playwright` found **0 serious/critical** violations on `/`, `/privacy`, and `/terms`.
- Keyboard smoke test reached the skip link, brand, project controls, stage, and transport in logical order. Desktop visible focus was a 3px `#084e9b` outline. Native dialogs, Enter/Space buttons, and Escape were exercised by the app tests/manual flow.
- `prefers-reduced-motion: reduce` was detected and reduced all animation/transition durations to 0.01 ms; normal actor opacity transition was 0.18 s.
- Live Lighthouse 12.8.2 mobile run: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.2 s, TBT 0 ms, CLS 0, transfer 102 KiB.

### Privacy, network, and response-policy checks

- A cold free-editor load made only same-origin requests for HTML, the local JS/CSS, self-hosted fonts, and local hero WebP—no analytics, trackers, CDN fonts, or third-party scripts. The billing API is only contacted after a license flow is invoked; checkout is a user-initiated link to Sociobot.
- Local-first storage is used for the cue project and license; `/privacy` and `/terms` are live and pass axe serious/critical checks.
- Live responses served HTTPS and include `Strict-Transport-Security`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy: camera=(), microphone=(), geolocation=()`. CSP is missing; caching is recorded above.
- Billing API rate-limit check: one invalid-license request returned 200 `{ valid:false, reason:"invalid" }`. A 60-request concurrent burst returned 29 HTTP 200 and 31 HTTP 429 responses, each with `Retry-After: 4`; rate limiting is therefore present, with the shared observed allowance exhausted at about 30 requests in that burst. A follow-up burst remained limited after two further 200s (the shared limiter had not fully reset).

## Remediation before re-verification

1. Add `.factory/claims.json` with executable, demo-entry claim coverage and make all listed claims pass.
2. Put an explicit, one-click `Try the pollination sample` (or equivalent) control above the fold, say who it is for in plain language there, and name the recommended first action.
3. Strictly validate every imported project field before assigning or saving it; reject malformed values without writing to localStorage; add an accessible in-product reset/recovery path and regression tests.
4. Keep `New` accessible on mobile (or provide an equally discoverable blank-project action).
5. Configure immutable cache headers for content-hashed assets and add a tested CSP.
