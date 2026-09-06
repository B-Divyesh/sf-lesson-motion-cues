# Lesson Motion Cues

Lesson Motion Cues is a browser cue timeline for teachers and technical educators. It turns readable `enter`, `move`, `say`, and `highlight` cues into a timed lesson animation.

Live: <https://lesson-motion-cues.sociobot.in>

One-click sample: <https://lesson-motion-cues.sociobot.in/demo>

## What it does

- Creates named actors and timed caption cues without a license.
- Renders deterministic cue timing and stepped reduced-motion previews.
- Removes scripts and external references from imported SVG files.
- Keeps imported audio in the current tab.
- Exports versioned JSON, JavaScript data, and a self-contained SVG frame.
- Records MP4 where supported and WebM elsewhere.
- Works offline after the first visit.
- Keeps the sample demo separate from saved lessons.

Lesson and imported SVG data stay in the browser. Audio is not stored; add it again after reopening the lesson.

The optional Field Kit contains three lesson templates for a one-time $12 license. Purchase registration is pending, so checkout is currently unavailable. Existing license restore remains in the app.

## Run and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
```

The exact production build command is `npm run build`. Static output lands in `dist/` with `dist/index.html` at its root. `public/staticwebapp.config.json` supplies Azure Static Web Apps route fallback and security headers.

Playwright is pinned to 1.58.2. In the factory worker its Chromium binary is supplied through `PLAYWRIGHT_BROWSERS_PATH`; elsewhere run `npx playwright install chromium` once if needed.

Every public product claim and its isolated command are listed in [`.factory/claims.json`](.factory/claims.json). The demo data and reset behavior are documented in [`.factory/demo.md`](.factory/demo.md).

## Project format

Exports use `format: "lesson-motion-cues"` and `version: 1`. Actor and cue arrays are plain JSON, cue order is made stable at export, and all stage coordinates are percentages. The JavaScript export wraps the same object as an ES module.

## Privacy and billing

Real project state and license data use browser `localStorage`; see `/privacy` and `/terms`. License verification uses `https://api.sociobot.in/api/v1/products/lesson-motion-cues/verify`. No payment script, analytics, CDN font, or tracker runs in this app.

## Visual assets

The original generated onboarding illustration and prompt provenance are in `assets/src/`; the optimized WebP ships from `public/assets/`. Atkinson Hyperlegible is self-hosted under the SIL Open Font License. Product code is MIT licensed.
