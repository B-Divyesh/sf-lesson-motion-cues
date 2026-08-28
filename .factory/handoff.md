# Handoff — Lesson Motion Cues

## Shipped

- A responsive, local-first cue editor for named circle, square, triangle, or user-owned SVG actors.
- Enter, move, say/caption, and highlight ranges with validation, editing, deletion, actor removal, drag placement, scrubbing, playback, and reduced-motion stepping.
- User-owned audio preview and inclusion in browser-recorded video.
- Versioned deterministic JSON import/export, ES module export, self-contained current-frame SVG, and video recording (MP4 when `MediaRecorder` supports it, WebM fallback otherwise).
- Local autosave, import errors, undo after destructive resets/template loads, explicit blank state, offline status, service-worker shell, keyboard/focus treatment, and 390px layout.
- Optional $12 one-time Field Kit using the Sociobot checkout/verify/restore contract. License verdicts are cached for one day and previous valid verdicts work offline. No core or accessibility feature is gated.
- `/privacy` and `/terms`, Azure Static Web Apps navigation fallback/security headers, robots/sitemap, README, and MIT license.
- Product-specific topographic system and original generated/inspected/optimized illustration documented in `.factory/design.md`.

## Verification (2026-08-28)

- `npm test`: 3 model tests + 4 Chromium end-to-end tests passed. The flows cover the editor, blank-state actor/caption creation, JSON download, legal routes, mobile overflow, and axe.
- axe via Playwright: 0 serious or critical violations.
- `npm run build`: passed; output is `dist/` with root `index.html`.
- Production bundle: 31.23 KB JS / 15.97 KB CSS uncompressed (11.46 KB / 4.43 KB gzip). Self-hosted fonts total 35 KB; hero WebP is 52 KB; full `dist` is about 160 KB.
- Lighthouse 12.8.2 mobile, production preview: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.2 s, LCP 1.2 s, TBT 0 ms, CLS 0.
- Separate headless Chromium smoke test: no console errors. Desktop and 390×844 screenshots were manually reviewed.

## Run / deploy

```sh
npm install
npm test
npm run build
```

Deploy the contents of `dist/`. The factory must register the `lesson-motion-cues` paid product and return URL before live checkout testing.

## Known limits and next steps

- Video encoding depends on browser `MediaRecorder`: Chromium generally produces WebM; Safari may produce MP4. The export UI names the actual downloaded extension. A universal MP4 encoder would breach the static app’s JS/performance budget.
- Audio blob data is not placed in `localStorage` or JSON, avoiding quota failures; users reattach audio after a reload. Its filename remains in the project as a reminder.
- Network checkout and verification could not be exercised without the factory-registered product/license. The free editor does not depend on those calls.
