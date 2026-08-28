# Independent verification 1 — FAIL

**Candidate:** `6ce8d86da8a8d1a60c8ae96c40c6f134747481df` (`6ce8d86 docs: complete deployment and verification handoff`)  
**Live URL:** <https://lesson-motion-cues.sociobot.in>  
**Date:** 2026-08-28  
**Method:** clean checkout; fresh dependency install; live production verification in isolated Chromium contexts.

## Release decision

**FAIL. Do not release this candidate.** The mandatory claims manifest is absent, the required one-click sample-data demo is absent, the first screen does not state who the product is for, and the visible paid Field Kit checkout returns HTTP 404.

## Mandatory preflight

`.factory/claims.json` does not exist in the clean checkout. Therefore there were no declared claim commands to execute through the demo entry point. Per the work order, a missing manifest is itself a release-blocking finding.

Cold first-read of the live root in a fresh browser:

> “Lesson Motion Cues … Map a lesson in motion. Place actors, write plain-language cues, then play or export a versioned lesson your code can read.”

It describes the broad activity, but the initial viewport never says it is for teachers/technical educators, does not tell a new visitor what to click first, and has no one-click **“try it with sample data”** action. The page silently opens a pre-filled pollination project instead. That does not satisfy the explicit first-read/demo-sandbox acceptance condition.

## Blocking defects

| Severity | Finding | Fresh evidence |
|---|---|---|
| Blocker | Claims contract missing | `.factory/claims.json` was absent before any checks. |
| Blocker | First-read and demo-sandbox contract not met | 1440×900 and 390×844 cold views showed no target-user statement and no “try it with sample data” control. Sample content is loaded automatically. |
| High | The advertised $12 Field Kit cannot be bought | `GET https://api.sociobot.in/api/v1/products/lesson-motion-cues/checkout` returned **404** on 2026-08-28. The UI's “Buy Field Kit” link points directly to this URL. |

## Other defects / release concerns

| Severity | Finding | Evidence |
|---|---|---|
| Medium | Hashed production assets are only cacheable for 30 seconds | Root, JS, CSS, and `sw.js` all returned `Cache-Control: public, must-revalidate, max-age=30`, not long-lived immutable caching required by the performance contract. |
| Low | Browser hardening is incomplete | Live responses have HSTS, `X-Content-Type-Options`, Referrer-Policy, and Permissions-Policy, but no Content-Security-Policy or `X-Frame-Options` / `frame-ancestors` clickjacking protection. |

## Checks that passed

### Clean build and repository tests

- `npm ci` completed: 61 packages installed, 0 vulnerabilities reported.
- `npm test` passed: 3 Vitest model tests and 4 Playwright tests.
- `npm run build` passed (`tsc --noEmit && vite build`) and produced `dist/`.
- No separate lint/typecheck script is available; the production build performs the TypeScript check.
- Production payload: JS 31,227 B (11,456 B gzip), CSS 15,971 B (4,430 B gzip), fonts 34,732 B, hero WebP 52,370 B. Initial JS is well below the 200 KB limit.

### Live deployment identity and functional flow

- Live `/assets/index-BvNY_9ye.js` SHA-256 was `a78e9992dacf1413cba60d07ce7ebca2e629359cd5f14dac8228e4f5a31be085`, identical to `dist/` from the candidate build.
- Live CSS SHA-256 was `20ceb902eb98d95a5ce996a591bd3fbde9488b68b08647ee015bb7ec5f757380`, also identical to the candidate build.
- In a clean live session: exported JSON; started a blank lesson; added an actor; verified focus enters and returns from the actor dialog; checked missing-caption validation; checked cue-overflow validation and recovery; saved a valid 0.1-second cue; used the 1-second and 900-second duration boundaries; imported a valid version-1 project; rejected an invalid project without replacing the current project; and added/sanitized a user-owned SVG without console errors.
- JS, self-contained SVG, and browser video downloads completed. Chromium produced `how-pollination-travels.mp4` with “MP4 recording saved.”
- `/privacy` and `/terms` render correctly.

### Accessibility, responsive, motion, and PWA

- Live axe scans at desktop and 390×844 returned zero serious/critical violations (indeed zero violations).
- One `<h1>`, `<main>`, `lang=en`, title, skip link, labels, visible designed 3px focus ring, and no page-width overflow at 390px were verified. Keyboard dialog focus opens on the Name field and restores to “Add first actor” after Escape.
- With `prefers-reduced-motion`, Bee stayed at its start position at 8 seconds and snapped to its move endpoint at 12 seconds, as designed; no errors occurred.
- Service worker registered, controlled the page after reload, accepted `registration.update()` with no waiting worker for the unchanged deployment, and served a successful offline reload after the initial online visit.
- No console/page errors appeared in the desktop, mobile, functional, export, or offline checks.

### Privacy, network, policies, and rate limit

- A cold load made only first-party document, JS, CSS, image, and self-hosted-font requests. It set no application cookie and made no third-party or analytics request.
- Projects are stored in `localStorage`; the free editor did not request the billing API. Fake-license verification correctly returned `{ "valid": false, "reason": "invalid" }` with `Cache-Control: no-store`.
- The required product-unlock rate-limit check passed: 40 rapid invalid-license requests returned 200 for requests 1–30, then **429** with `Retry-After: 2` for requests 31–40. Observed threshold: 30 requests in this burst.
- HTTPS, HSTS, `nosniff`, strict referrer policy, and camera/microphone/geolocation Permissions-Policy are present.

### Lighthouse

Fresh mobile Lighthouse 12.8.2 retry against the live URL: Performance **95**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.2 s, LCP 1.4 s, TBT 240 ms, CLS 0. A first run suffered a Chromium target crash during final screenshot collection and reported 88 performance, so the stable retry is the recorded score.

## Required remediation before a new verification

1. Add `.factory/claims.json` with the executable, demo-entry-point claim commands and make every one pass.
2. Make the cold first screen plainly say the target audience and add a visible one-click “Try the sample lesson” action; do not rely on silently preloaded state.
3. Register/fix the Sociobot product checkout or remove the unavailable paid CTA until it works end to end.
4. Configure immutable long-lived caching for content-hashed static assets and add CSP plus frame-ancestor / clickjacking protection.
