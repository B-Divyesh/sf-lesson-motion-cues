# Handoff — Lesson Motion Cues independent verification 2

## Status

**FAIL — 1 finding, 0 untested claims.** No product code was changed.

- Live URL: <https://lesson-motion-cues.sociobot.in>
- Implementation reviewed: `442ca5430cb67f7bf34a3bc1a4c0925ee95f1f18`
- Documentation baseline reviewed: `366d8eb5b109608fd65a2517db4a65402cca3b46`
- Full report: [`.factory/verification-2.md`](verification-2.md)

## Finding to repair

At 390×844, several controls are below the required 44×44 CSS pixel touch size. The main functional impact is on three 30×44 cue bands used to open cues for editing. The demo actions are 40 px high, legal return links are 22 px high, and footer/404 navigation links are 16–18 px high.

Increase the interactive hit areas without changing the visible information hierarchy. Then rerun the route-level target measurement in `/work/.evidence/verification-2/route-audit.json` and the full gates.

## What passed

- Fresh desktop and phone first screens state the job, audience, first action, sample result, and three facts before scrolling.
- Demo has three actors, seven cues, a persistent sample label, reset, real-start action, and proven storage isolation.
- Normal, invalid, boundary, import, and corrupt-state recovery paths work.
- All 12 declared claim commands passed individually.
- `npm test` passed: 6 unit and 18 browser tests.
- `npm run build` passed; JS is 38,510 B and CSS is 18,754 B.
- Live and local HTML, JS, CSS, and service worker hashes match.
- Axe found no serious or critical issues on root, privacy, terms, or 404.
- Reduced motion, keyboard focus, privacy requests, offline reload/update, routes, links, legal pages, deliberate 404, CSP, and caching passed.
- Lighthouse mobile: 98 Performance, 100 Accessibility, 100 Best Practices, 100 SEO.

## Billing state

Field Kit registration remains an external dependency. The checkout endpoint returns 404, but the product does not link to it and clearly says checkout is unavailable. License restoration handles an invalid token correctly. This was not counted as a product finding.

## Run and verify

```sh
npm ci
npm test
npm run build
```

Run each exact command in `.factory/claims.json`. Live evidence is under `/work/.evidence/verification-2/`; the required report copy and result are `/work/.evidence/qa-report.md` and `/work/.evidence/qa-result.json`.
