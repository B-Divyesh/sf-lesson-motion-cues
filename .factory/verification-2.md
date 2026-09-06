# Independent verification 2 — build timed lesson animations — FAIL

**Verdict: FAIL**

- Date: 2026-09-06
- Live URL: <https://lesson-motion-cues.sociobot.in>
- Implementation reviewed: `442ca5430cb67f7bf34a3bc1a4c0925ee95f1f18`
- Documentation baseline reviewed: `366d8eb5b109608fd65a2517db4a65402cca3b46`
- Findings: **1**
- Untested claims: **0**

The product works end to end and all 12 declared claims pass. It does not meet the release rule because phone-sized touch targets fall below the mandatory 44×44 CSS pixel minimum.

## Finding

### F1 — Medium — phone controls have undersized touch targets

At 390×844, several interactive targets are smaller than 44×44 CSS pixels:

- Three short cue bands in the sample timeline are **30×44**. These buttons open cues for editing, so this affects the main job.
- **Reset demo** and **Start for real** are **40 px** high.
- The legal-page return link is **22 px** high.
- Footer Privacy and Terms links are **16 px** high.
- The designed 404 page also has 17–18 px-high header and footer links and a 38 px-high skip link.

This fails the attached accessibility and design contracts, both of which require every touch target to be at least 44×44 CSS pixels. Axe does not flag target size, so its 100 score does not clear this finding.

Evidence: `/work/.evidence/verification-2/route-audit.json`, `phone-demo.png`, and `phone-404.png`.

## Job, audience, and first action

Before scrolling in fresh 1440×900 and 390×844 browsers, the page states:

- Job: **Build a timed lesson animation**.
- Audience: teachers and technical educators who need readable cues instead of an animation engine.
- First action: **Try it with sample data**.
- Result of the action: a 20-second pollination lesson with three actors and seven cues.

The three privacy/offline/price facts are also visible. The action remained within the first phone viewport. Screenshots: `desktop-first-screen.png` and `phone-first-screen.png`.

## Demo and product paths

The one-click sample opened `/demo` with three named actors and seven realistic enter, move, say, and highlight cues. The persistent label says **Demo — sample data, nothing is saved.** It remained visible after scrolling. Editing and resetting the sample did not change a separately saved real lesson, and **Start for real** restored that lesson.

The live editor also passed these independent paths:

- Created an actor and caption cue without a license.
- Rejected a missing caption and an out-of-range 44.9–45.1 second cue with specific errors, then saved the corrected boundary cue.
- Exported populated, versioned JSON containing the created actor and cue.
- Rejected unsupported and malformed JSON without changing the editor or saved data.
- Removed corrupt stored state, showed **Saved lesson reset**, and opened a usable blank lesson.
- Attached local SVG and audio without an external request; audio used a blob URL and its bytes were absent from storage.
- Handled an invalid license without changing the free editor.
- Kept the unavailable checkout link out of the UI and explained that product registration is pending.

## Claims

Every command in `.factory/claims.json` was run separately from the clean documented setup. Each command passed its one matching test.

| Claim id | Result |
|---|---|
| `cold-first-screen` | PASS |
| `demo-isolation` | PASS |
| `free-core` | PASS |
| `cue-preview` | PASS |
| `portable-exports` | PASS |
| `video-export` | PASS |
| `reduced-motion` | PASS |
| `local-privacy` | PASS |
| `svg-sanitization` | PASS |
| `audio-local` | PASS |
| `field-kit` | PASS |
| `offline-reload` | PASS |

The live page, legal pages, dialogs, and README were cross-checked against the manifest. No false, missing, or untested public claim was found. The Field Kit test correctly uses a recorded valid verification response; it does not claim that checkout registration is complete.

## Earlier finding disposition

| Earlier finding | Current evidence |
|---|---|
| Claims manifest absent | Fixed. Twelve claims exist and all 12 exact commands pass. |
| Audience, first action, and sample action absent | Fixed on fresh desktop and phone views before scrolling. |
| Sample was not isolated | Fixed. Demo state stays in memory, reset works, and real storage is unchanged. |
| Malformed accepted JSON corrupted every reload | Fixed. Live malformed import is rejected before storage; corrupt stored state is removed with a recovery message. |
| Field Kit link opened an HTTP 404 | Fixed in the product. No checkout link is rendered while registration is pending. The external checkout endpoint still returns 404, as disclosed. |
| New lesson was hidden on phone | Fixed. The action is visible and works at 390×844. |
| Hashed assets had 30-second caching | Fixed. Live JS and CSS return `public, max-age=31536000, immutable`; HTML and `sw.js` return `no-cache`. |
| CSP and clickjacking protection were missing | Fixed. Live responses include the declared CSP, `frame-ancestors 'none'`, and `X-Frame-Options: DENY`. |

## Accessibility, routes, privacy, and offline behavior

- Worker `verify-url.sh`: passed title, `lang`, one h1, main landmark, image alt, labeled button, and console checks.
- Axe: zero serious or critical violations on `/`, `/privacy`, `/terms`, and the designed 404 page.
- Keyboard: skip link works; actor dialog receives focus; errors are announced; Escape closes and restores focus in the regression suite.
- Reduced motion: Bee stayed at x=16 at 8 seconds and stepped to x=67 at 12 seconds.
- Phone: no horizontal page overflow; required content and **New lesson** remain visible.
- Routes: root, demo, privacy, terms, and 404 have distinct titles, one h1, `lang=en`, and a main landmark.
- Link crawl: every product link returned 200. The deliberate unknown route returned HTTP 404 with a designed page and two return actions; its document-load console 404 is expected, not a defect.
- Privacy: the fresh editor and local SVG/audio flow made only same-origin requests and set no cookies. The billing API was contacted only after an explicit license check.
- Offline/update: after service-worker readiness and `registration.update()`, `/demo` reloaded offline with all three actors and seven cues.

## Build, identity, and performance

Clean setup and gates:

```sh
npm ci
npm test
npm run build
```

- `npm ci`: passed; 61 packages installed, 0 vulnerabilities.
- `npm test`: passed; 6 unit tests and 18 Chromium tests.
- `npm run build`: passed and produced `dist/index.html`.
- `git diff --check`: passed before report edits.
- Application payload: JS 38,510 B / 13.67 KB gzip; CSS 18,754 B / 5.01 KB gzip.
- Lighthouse 12.8.2 mobile: Performance **98**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.2 s, LCP 1.3 s, TBT 170 ms, CLS 0.

The live deployment matches the local candidate build exactly:

- HTML SHA-256: `28ffbb097bba3343f0bce327a731e35e292b318aa8f089d6b163835fdc635f49`
- JS SHA-256: `11dd7cfb6fb5c5ac731a31f5d149538de75f33c23ae2ca3ae7b921369d0bc8b4`
- CSS SHA-256: `c1ed01cb3fe0af8e98900ce2cb27e892055ec4e74a0afd95a7395e3a850bafdd`
- Service worker SHA-256: `af8d1129a185031f76b062784765666eedfaa17ea76de80f10c3d2649621ec02`

## Billing dependency

The external checkout endpoint still returns the disclosed HTTP 404 body `enabled factory product`. This is not a broken product path because the UI has no checkout link, disables checkout, and says registration is pending. A fresh invalid-license request returned HTTP 200 with `valid: false`. The earlier 429/`Retry-After` evidence concerns the unchanged external billing service and was not re-bursted for this static candidate.

## Decision

**FAIL — 1 finding, 0 untested claims.** Repair all undersized phone touch targets and rerun independent verification.
