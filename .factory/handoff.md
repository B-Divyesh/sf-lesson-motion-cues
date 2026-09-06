# Handoff — Lesson Motion Cues repair 1

## Status

The repaired static product is deployed at <https://lesson-motion-cues.sociobot.in>.

- Implementation SHA: `442ca5430cb67f7bf34a3bc1a4c0925ee95f1f18`
- Deployment: Azure Static Web Apps production environment for `sf-lesson-motion-cues`
- Deployment result: succeeded on 2026-09-06; custom HTTPS returned 200
- Documentation: this handoff follows the implementation commit
- Release state: ready for independent re-verification except for the external billing-registration dependency below

## Finding disposition

| Earlier finding | Current disposition |
|---|---|
| Missing `.factory/claims.json` | Fixed. Twelve public claims each have one unique outcome-based Playwright command. Every declared command passed after `npm ci`. |
| Cold screen omitted audience, first action, and one-click sample | Fixed. Fresh phone and desktop views show the job, teachers/technical educators, **Try it with sample data**, and its result before scrolling. |
| No isolated sample demo | Fixed. `/demo` loads three actors and seven pollination cues. Its sticky label, reset, and real-start action remain visible. Demo edits stay in memory and never read or write `lmc:project:v1`. |
| Malformed accepted JSON persisted corrupt state | Fixed. The v1 validator now checks every project, actor, cue, numeric boundary, id, color, and embedded SVG field before assignment. Invalid import leaves current storage unchanged. Old corrupt storage is removed and opens a labeled blank recovery state. |
| Field Kit checkout led to HTTP 404 | Fixed in the product path. The dead link is gone and the dialog states that registration is pending. The $12 paid deliverable and license restore remain. Exact offer metadata is in `/work/.evidence/billing-offer.json`. |
| Mobile hid the blank-project action | Fixed. **New lesson** is visible and usable at 390×844. |
| Hashed assets used 30-second caching | Fixed. Live hashed assets return `Cache-Control: public, max-age=31536000, immutable`; HTML and `sw.js` use `no-cache`. |
| CSP/clickjacking protection missing | Fixed. Live responses include a restrictive CSP, `frame-ancestors 'none'`, and `X-Frame-Options: DENY`. |

The earlier successful behaviors remain covered: actor/cue creation, captions, deterministic motion, JSON/JavaScript/SVG/video export, SVG sanitizing, local audio, reduced motion, keyboard dialog focus, mobile layout, legal pages, and offline reload.

## Verification

Clean setup and full gates:

```sh
npm ci
npm test
npm run build
```

- `npm ci`: passed; 61 packages installed, 0 vulnerabilities.
- `npm test`: passed; 6 unit tests and 18 Chromium tests.
- All 12 commands in `.factory/claims.json`: passed individually.
- Build: passed; `dist/index.html` exists.
- Initial application payload: JS 38,510 B / 13.67 KB gzip; CSS 18,754 B / 5.01 KB gzip.
- `git diff --check`: passed.

Live checks:

- Worker `verify-url.sh`: HTTPS 200, title/lang/main/alt checks passed, no console errors.
- Local and live fresh 1440×900 and 390×844 browsers: no horizontal overflow or unexpected console/page errors.
- Demo: label present; 3 actors; 7 cues; reset restored “How pollination travels”; real saved lesson remained unchanged.
- Offline: `/demo` reloaded with 3 actors after network was disabled.
- Reduced motion: Bee stayed at x=16 during its move and stepped to x=67 at the cue boundary.
- Axe: 0 serious/critical findings on `/`, `/privacy`, and `/terms`.
- Unknown route: returned HTTP 404 with the designed page, one h1, and return actions.
- Route titles: root, demo, privacy, terms, and 404 are distinct.
- Live build identity: HTML SHA-256 `28ffbb097bba3343f0bce327a731e35e292b318aa8f089d6b163835fdc635f49`; JS SHA-256 `11dd7cfb6fb5c5ac731a31f5d149538de75f33c23ae2ca3ae7b921369d0bc8b4`. Both match local `dist/`.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.1 s, TBT 30 ms, CLS 0.

Evidence is under `/work/.evidence/live/`. The first Lighthouse attempt hit the known Chromium screenshot crash; the retry with `--disable-dev-shm-usage` completed with the scores above.

## Billing dependency

`GET https://api.sociobot.in/api/v1/products/lesson-motion-cues/checkout` still returns HTTP 404 with `enabled factory product`. The separate billing-registration operator must register/enable the offer from `/work/.evidence/billing-offer.json` before purchase can open. No credential or mock checkout was added. The live UI does not navigate to the broken endpoint.

The license verification endpoint remains available: a fresh invalid-token check returned HTTP 200 with `valid: false`. The paid-template regression uses a recorded valid verification response; it proves UI unlock and template loading, not a live purchase or entitlement. The earlier rate-limit result (429 beginning around request 31 with `Retry-After`) was not re-bursted because this static repair did not change that external service.

## Run and verify

```sh
npm ci
npm test
npm run build
```

Run an individual claim with the exact command in `.factory/claims.json`. The demo contract is in `.factory/demo.md`; copy wording and counts are in `.factory/copy-audit.md`.
