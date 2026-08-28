# Lesson Motion Cues

Lesson Motion Cues is a local-first browser cue sheet for teachers and technical educators. It turns named actors and readable `enter`, `move`, `say`, and `highlight` time ranges into a cartoon-like lesson preview without asking the author to build an animation engine.

Live: <https://lesson-motion-cues.sociobot.in>

## What it does

- Places built-in markers or a user-owned SVG on a 16:9 stage.
- Previews a deterministic, captioned cue timeline with reduced-motion support.
- Accepts user-owned audio for synchronized preview and video recording.
- Saves the project locally and imports/exports versioned JSON.
- Exports JavaScript data, a self-contained SVG frame, and MP4 when the browser supports it (WebM fallback elsewhere).
- Works offline after the first visit.
- Offers an optional one-time $12 Field Kit of lesson templates through the Sociobot license API. Core editing, captions, and exports remain free.

No project or imported media is uploaded. Audio is intentionally held only for the current browser tab; add it again after reopening the project.

## Run and verify

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
npm test
npm run build
```

The exact production build command is `npm run build`. Static output lands in `dist/` with `dist/index.html` at its root. `public/staticwebapp.config.json` supplies Azure Static Web Apps route fallback and security headers.

Playwright is pinned to 1.58.2. In the factory worker its Chromium binary is supplied through `PLAYWRIGHT_BROWSERS_PATH`; elsewhere run `npx playwright install chromium` once if needed.

## Project format

Exports use `format: "lesson-motion-cues"` and `version: 1`. Actor and cue arrays are plain JSON, cue order is made stable at export, and all stage coordinates are percentages. The JavaScript export wraps the same object as an ES module.

## Privacy and billing

Project state and license data use browser `localStorage`; see `/privacy` and `/terms`. Checkout and license verification use only `https://api.sociobot.in/api/v1/products/lesson-motion-cues/...`. No payment provider script, analytics, CDN font, or tracker runs in this app.

## Visual assets

The original generated onboarding illustration and prompt provenance are in `assets/src/`; the optimized WebP ships from `public/assets/`. Atkinson Hyperlegible is self-hosted under the SIL Open Font License. Product code is MIT licensed.
