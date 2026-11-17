# Kiran Kumar R portfolio

Static portfolio with a custom Three.js modular kitchen, cabinet finishes, rotation and exploded view, responsive typography, dark/light themes, software icons and a resume download.

Preview: `python3 -m http.server 4173 --directory dist`

Verify: `node check.mjs`

The source and deployable assets are in `dist/`. No build or secret keys are required. `.openai/hosting.json` holds the Sites identity.

## Content and design

Professional facts and contact details come from the supplied Kiran Kumar resume. The original PDF is provided as a download. The visual interaction is inspired by https://github.com/sanidhyy/3d-portfolio; the source was reviewed but no original code or 3D assets were copied.

Design dials: variance 7, motion 6, density 4. Native CSS with Manrope and Phosphor icons. The user's follow-up explicitly requested a fresh multicolor palette, motion and icons: coral, blue and lilac accents replace the initial sage treatment. Whole-page dark/light themes stay consistent. The cabinet model is illustrative, not a client project reconstruction. Software uses semantic icons, not claimed official brand logos.

## Image provenance

`dist/assets/kitchen-concept.webp` was created with the built-in image generation tool. It is prominently labeled as an AI-generated concept. No project images were supplied; listed project names are taken from the resume.

Prompt: Create a high-end architectural visualization of a contemporary modular kitchen with smoky forest green flat-front cabinets, natural walnut tall cabinets, pale gray honed limestone island, minimal black fittings and one sculptural pendant. Soft daylight entering from the right, careful joinery and realistic material detail, a restrained lived-in vase with branches. Camera at eye level, horizontal wide 3:2 composition, editorial interior photography quality. No people, text, logos or watermark. Illustrative concept, not a specific real project.

## Scope and checks

Scope includes static HTML content, styles, browser interaction scripts, self-hosted library/font/icon/image assets, resume download and Sites publishing configuration. No existing callers, account flows or databases were modified.

Browser checks cover desktop and mobile, finish switching, pause/reset, exploded view, both themes and console errors. `check.mjs` catches missing deployment assets, broken local anchors and invalid JavaScript. No physical device testing or Lighthouse audit was performed.

Contact links open the visitor's email or phone application. No backend contact form or analytics was added.
