# Kiran Kumar R portfolio

Static 3D portfolio. The hero is a real-time, procedurally built interior diorama in Three.js (travertine floor, plaster walls, a window casting sun shadows, ribbed walnut wall, olive tree, terracotta lounge chair and a modular sideboard). Scrolling moves the camera through three chapters: Visualize (finished render), Engineer (the sideboard explodes into its panels as a clay study with cyan edges, dimensions and a drafting grid) and Deliver (fronts open, camera swings round). Pointer parallax, drag to look, clickable doors and drawers, three sideboard finishes, pause and reset. The toolkit is a 3D carousel of ten glossy app tiles carrying the official product logos, with drag, snap, click and keyboard selection. Dark (default) and light themes, mobile menu and resume download.

Preview: `python3 -m http.server 4173 --directory dist`

Verify: `node check.mjs`

The source and deployable assets are in `dist/`. No build or secret keys are required. `.openai/hosting.json` holds the Sites identity.

## Redesign (November 2026)

Art direction "after-hours studio": ink stage, bone type, chartreuse UI signal and cyan reserved for technical lines. Type is Instrument Serif (display) with Manrope (UI), both self-hosted under the SIL OFL. References reviewed: the lapa.ninja 3D websites gallery (scene-led heroes, oversized editorial type layered over one tactile 3D subject) and sanidhyy/3d-portfolio (floating 3D tech icons). No code, models or assets were copied.

Accuracy: every fact comes from the supplied resume. The 3D scene is labelled on the page as illustrative and built in code, not a client project; its 2400 x 820 mm dimensions describe the illustrative sideboard only. Software tiles use the official product logos (nominative use, to name the software in the toolkit; trademarks belong to their owners, as noted on the page).

Accessibility and fallbacks: all scene controls are real buttons with pressed states; tools are selectable by buttons and arrow keys; chapter tabs mirror the scroll story. `prefers-reduced-motion` removes the scroll-scrubbed hero, idle motion, marquee and reveals, and the scenes render only on change. Without WebGL (or with `?fallback`) the hero shows the labelled AI-generated concept image and the toolkit falls back to the button list. WebGL context loss falls back the same way.

## Content and design

Professional facts and contact details come from the supplied Kiran Kumar resume. The original PDF is provided as a download. The visual interaction is inspired by https://github.com/sanidhyy/3d-portfolio; the source was reviewed but no original code or 3D assets were copied.

## Image provenance

`dist/assets/kitchen-concept.webp` was created with the built-in image generation tool. It is prominently labeled as an AI-generated concept. No project images were supplied; listed project names are taken from the resume.

Prompt: Create a high-end architectural visualization of a contemporary modular kitchen with smoky forest green flat-front cabinets, natural walnut tall cabinets, pale gray honed limestone island, minimal black fittings and one sculptural pendant. Soft daylight entering from the right, careful joinery and realistic material detail, a restrained lived-in vase with branches. Camera at eye level, horizontal wide 3:2 composition, editorial interior photography quality. No people, text, logos or watermark. Illustrative concept, not a specific real project.

## Scope and checks

Scope includes static HTML content, styles, browser interaction scripts, self-hosted library/font/icon/image assets, resume download and Sites publishing configuration. No existing callers, account flows or databases were modified.

Browser checks (redesign) at 1440x900 and 375x812: all three scroll chapters, technical view, open fronts, finishes, pause/reset, carousel selection by button, arrow key and rotation, light and dark themes, mobile menu, `?fallback` path, resume download (HTTP 200) and console errors. `check.mjs` catches missing deployment assets, broken local anchors and invalid JavaScript. No physical device testing or Lighthouse audit was performed.

Contact links open the visitor's email or phone application. No backend contact form or analytics was added.

## Logo sources (`dist/assets/logos/`)

Downloaded with the user's approval on 2026-11-17 from each vendor's own site. Only the SVG `width`/`height` attributes were enlarged so tiles rasterize sharply; artwork is unchanged except that the imos tagline line ("A Dürr Group Company") was left out because it is unreadable at tile size.

- `3ds-max.svg`: Autodesk 3ds Max product icon, images.ctfassets.net (served on autodesk.com/products/3ds-max)
- `v-ray.svg`: Chaos V-Ray product icon, static.chaos.com (chaos.com/vray)
- `photoshop.svg`, `illustrator.svg`, `premiere-pro.svg`: adobe.com/content/dam/cc/icons/
- `after-effects.svg`: adobe.com/cc-shared/assets/img/product-icons/svg/
- `imos.svg`: header logo from imos3d.com
- `kcd.svg`: kcdsoftware.com/wp-content/uploads/KCD-logo-horizontal-r.svg
- `coreldraw.png`: coreldraw.com/static/cdgs/images/coreldraw-wordmark-color.png (only 225 px wide, the largest Corel publishes there)
- `homag.svg`: homag.com header logo, used for Cut Rite, which has no standalone product logo
