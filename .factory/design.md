# Lesson Motion Cues — visual thesis

## Direction: topographic cartography

Lesson Motion Cues is a field map for a lesson, not a miniature video editor. The stage is the terrain; actors are survey markers; cue ranges are elevation bands. Fine contour lines, coordinate ticks, trail-like motion paths, and a warm paper ground make timing legible while retaining the handmade friendliness a teacher expects from a cartoon explainer. Chrome stays quiet around the authored lesson.

This is deliberately a single light treatment: it represents a physical field sheet, keeps projected classroom colors predictable, and lets the stage remain the visual focus. The background is always explicitly painted.

## Tokens

- Paper/background `#F3EEDA`; raised paper `#FFFCED`; ink `#173B35`; muted ink `#52665E`.
- Pine/accent `#176B57`; pine dark/contrast `#0E4D40`; ochre `#C98427`; lake `#2E6F8E`.
- Success `#24704B`; warning `#8A570D`; danger `#A23A2B`; focus `#084E9B`.
- Actor colors are paired with initials, patterns, or cue labels; color is never the only state signal.
- Type pairing: self-hosted Atkinson Hyperlegible for readable lesson text and system monospace for times, coordinates, and code. Two variable font files maximum. Body is 16px/1.5.
- Spacing follows a 4px survey grid: 4, 8, 12, 16, 24, 32, 48. Corners are clipped or modest (6–14px), never pill-heavy.

## Interaction grammar

- Primary actions are solid pine rectangles with a small north-east arrow or direct verb.
- Selection is a double survey outline and a visible label. Stage actors have initials plus names so they remain identifiable without color.
- Timeline rows read left to right like contour transects. Cues are labeled bands, and the playhead is an ochre survey needle.
- Panels group by proximity and field headings rather than a wall of cards. Empty states contain a single clear trailhead action.
- On phones, the stage comes first; tools and cue sheet stack below it. Dense coordinates and secondary descriptions drop, but no capability is removed.

## Motion policy

UI transitions take 160–220ms and use only opacity and transform. Stage motion derives only from authored cue timing. Enter cues ease out from their nearest edge, move cues interpolate linearly for deterministic output, say cues open like a map annotation, and highlight cues pulse once rather than loop. With `prefers-reduced-motion`, preview becomes a stepped cue reader: actor positions snap to the current cue boundary, emphasis uses a static ring, and UI changes cross-fade without travel. Playback remains user-controlled and pausable.

## Asset plan and provenance

- `public/assets/hero-map.webp` and its PNG source: an original generated editorial field-map scene used only in the welcome/empty state, not as evidence of app output. Prompt: “Topographic field map illustration for an educator's animation cue sheet, overhead folded cream paper terrain, three charming abstract geometric lesson actors as enamel survey markers, winding contour lines becoming a horizontal timing track, pine green ink, muted lake blue and ochre accents, subtle screen-print grain, clean editorial composition, generous blank area, no people, no text, no letters, no watermark, no logos, no gradients, no photorealism.” Generated with Azure OpenAI `factory-image` on 2026-08-28. Original to this product; reviewed for text, seams, brands, and unintended symbols.
- `public/assets/social.webp` is a 1200×630 center crop of that original image. `public/apple-touch-icon.png` is a 180px crop. Both were derived locally with ImageMagick on 2026-09-06; no new third-party source was introduced.
- Interface icons and stage patterns are hand-authored SVG/CSS primitives in the repository, MIT licensed with the app.
- User media is never uploaded. Imported SVG/audio stays in the browser and is stored only when the browser can safely persist it locally.

## Responsive and accessibility notes

The 390px layout uses one column, a 280px minimum stage, horizontally scrollable cue time ruler, and 44px controls. Focus is a 3px blue outer ring. Text contrast targets WCAG AA against paper and raised paper. The generated image has meaningful alt text; contour textures are decorative. All dialogs move focus, restore it, close with Escape, and announce validation errors.
