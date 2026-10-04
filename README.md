# Proofroom

A visual-direction workbench for your own words. Edit plaintext, pin a style direction, change the working direction, and compare them using the same content, composition and viewport. Export the matching responsive HTML and CSS when you have made a decision.

Proofroom is an original, noncommercial static showcase built with React, TypeScript and Vite. It has no application backend, accounts, analytics, AI service or remote content submission. The Signup composition is a specimen, not registration.

## Run locally

Use Node.js 24.16.0 and npm. From this repository:

```sh
npm ci
npm run dev
```

The development server binds to `127.0.0.1:5178`. For a production build:

```sh
npm run build
npm run preview
```

## Work with a proof

1. Start with Fieldnote, a fictional practical journal. Common Hours and Morrow Objects are separate content packs.
2. Edit the structured content fields. Choosing a style preset changes styles only; loading a content pack is an explicit action.
3. Pin the current styles. The reference freezes styles while both directions continue to share your current words.
4. Change the working styles and flip between directions. Use Overview or Signup and a real responsive viewport, including custom intermediate widths.
5. Keep an optional decision note, duplicate a project, or export the project JSON and implementation ZIP.

The studio's neutral appearance is independent of the edited theme. Typography uses display/text family slots and six semantic roles: title, section heading, body, caption, label and button.

## Local data and imports

Projects autosave in IndexedDB in this browser profile on this device. A successful save is reported only after the write completes. This is not a backup or cross-device sync; export project JSON to keep a portable copy. Private-browsing modes, browser cleanup, storage limits and browser policy can affect persistence.

Project JSON is versioned and strictly validated before use. Unknown fields, unsupported versions, invalid style values and oversized content are rejected. Content is treated as plaintext and escaped during generation. The initial workflow is left-to-right. Unicode text is preserved, but the curated fonts do not claim universal glyph coverage.

## Export

The studio preview and downloaded pages use the same HTML/CSS generator. ZIP exports include responsive example pages, `theme.css`, documented `tokens.json`, reopenable project JSON, required font files and their licenses, and integration instructions. Relative assets let the exported pages run without the studio or an application backend.

Semantic role styles are reusable; sample page composition rules are layout examples. The token format is Proofroom's documented format, not a claim of DTCG compatibility. Font rendering and antialiasing can differ across browsers and operating systems.

## Fonts and licenses

The curated collection is self-hosted: Source Sans 3, Source Serif 4 and Manrope, sourced from exact-pinned Fontsource packages. Bundled font notices and metadata live with the assets. Font licenses are independent of the MIT license for the application source.

## Verification

```sh
npx playwright install chromium
npm test
npm run build
npm run test:browser
```

`npm run check` runs unit tests, the production build and browser tests together. On Linux, install browser system dependencies with `npx playwright install --with-deps chromium` when needed.

The checks cover project transformations, grouped history, strict imports, escaping, deterministic generation, persistence and font races, the editing journey, responsive specimens, and standalone export parity. See [VERIFICATION.md](VERIFICATION.md) for the actual release results and scope, including parity tolerances and untested areas. Contrast feedback is useful pairwise information, not complete accessibility certification.

## Static release

The workflow in `.github/workflows/pages.yml` verifies each change before publishing `dist` to GitHub Pages. Action versions are pinned by commit. It uses standard GitHub-hosted Ubuntu runners and a one-day Pages artifact, without package caching or paid runner features. The Vite base path is relative. `build-meta.json` records the source commit used to build the deployed app.

GitHub Pages is available for public repositories on GitHub Free, and standard Actions runners are free for public repositories and Pages. Hosting remains subject to GitHub's [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) and [Actions conditions](https://docs.github.com/en/billing/concepts/product-billing/github-actions). No custom domain, paid service or persistent deployment credential is required.
