# Handoff — Lesson Motion Cues

## Independent QA status: **FAIL — do not release**

Candidate `6ce8d86da8a8d1a60c8ae96c40c6f134747481df` was independently verified against <https://lesson-motion-cues.sociobot.in> on 2026-08-28. The live production HTML, JS, CSS, service worker, and hero asset match the candidate build; this is not a stale-deployment result.

### Release blockers

- `.factory/claims.json` is absent, so the mandatory claim commands could not be enumerated or run.
- The cold initial screen does not plainly say it is for teachers/technical educators, identify a recommended first click, or offer the required one-click sample-data demo. It silently opens sample content.
- Malformed-but-accepted project JSON (for example an actor `name` set to numeric `7`) is saved to `localStorage` before rendering fails. The app reports an import failure but retains corrupt state, so later loads can remain broken without an in-product recovery action.
- The displayed $12 Field Kit purchase CTA points to `https://api.sociobot.in/api/v1/products/lesson-motion-cues/checkout`, which returned HTTP 404 in fresh production testing.

### Other defects / concerns

- The mobile layout removes the `New` project action; this removes the documented blank-project flow for phone-only users.
- Content-hashed JS/CSS and the service worker are all served with `Cache-Control: public, must-revalidate, max-age=30`, not immutable long-lived caching.
- Live responses lack CSP and explicit clickjacking protection (`frame-ancestors` or `X-Frame-Options`).

## Verification summary

`npm ci`, `npm test` (3 unit + 4 E2E tests), and `npm run build` all passed. Free-editor flows, validation/recovery flows, imports, all four exports including a live MP4 recording, keyboard dialog focus, 390px layout, reduced motion, offline reload, privacy/network behavior, and rate limiting were independently checked. Live axe found zero serious/critical findings; fresh Lighthouse was 95 performance / 100 accessibility / 100 best practices / 100 SEO. The product-unlock endpoint began returning 429 with `Retry-After: 2` on request 31 of a 40-request invalid-license burst.

The detailed reports are [.factory/verification.md](verification.md) and [.factory/verification-1.md](verification-1.md). They contain exact commands, hashes, checks, and remediation. Address every blocker, then submit a new candidate for independent verification.

## Run locally

```sh
npm ci
npm test
npm run build
```

Do not deploy this candidate until the blockers above are resolved and re-verified.
