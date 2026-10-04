# Release verification

Verified on 2026-10-05. This records observed checks, not an accessibility certification.

| Check | Result |
| --- | --- |
| TypeScript and Vite production build | Passed |
| Vitest unit tests | 24 passed |
| Playwright browser tests | 9 passed in Chromium |
| Independent model diagnostics | 9 passed |
| Dependency audit after the final dependency change | 0 known vulnerabilities |
| Private development listener | `127.0.0.1:5178` only |

## What was exercised

The automated journey edits content, changes styles, pins and flips directions, checks shared words and frozen reference styles, changes viewport width, undoes/redoes, saves, reloads, downloads the ZIP, duplicates a project and reopens exported JSON. Further checks cover explicit example loading, semantic-role selection, supported font weights, native textarea undo, keyboard focus, useful invalid-import errors, unavailable IndexedDB with preserved editing/export, visible font failure and recovery, and stable section context during comparison.

Unit tests cover strict schemas and value limits, Unicode round trips, unsafe imported values, escaped HTML and attributes, deterministic generation, logical history grouping, isolated duplication, serialized/coalesced saves across project IDs, persistence failure/retry, stale font requests and import-ID collisions. A differing imported project with an existing ID receives a new ID so the existing saved project is retained.

Both Overview and Signup were tested at 360, 517, 768 and 1280 CSS pixels. Checks include 200% text enlargement combined with line-height, letter-spacing, word-spacing and paragraph-spacing overrides; long unbroken form labels; a narrow 390px studio; visible keyboard focus; and reduced motion. Independent browser review also exercised an intermediate 543px specimen. Native scrollbar widths can reduce the document's client width within the selected iframe width; no screenshot scaling is used.

## Purple and yellow design update

The Signal update was checked in the desktop and narrow mobile studio. Saved styles and copy remain unchanged after reload; new projects use Signal, and existing projects can select it explicitly. Keyboard focus remains visible against the dark header and white inspector. Font status stays outside the horizontally scrolling specimen, including a 1280px specimen viewed in a 390px studio.

The regression suite additionally verifies that the new default is cloned independently and that previously saved Editorial working styles and Warm pinned styles round-trip without rewriting.

## Standalone export parity

The test downloads the real ZIP and serves those extracted bytes to another page in the same Chromium browser. It waits for fonts before measuring the preview and standalone pages.

- Eight cases: edited Warm working direction, both compositions at 360, 517, 768 and 1280px.
- One additional case: pinned Clear reference, Signup at 1280px.
- Font family, size, weight, line-height, tracking, foreground/background colors and text match exactly for the measured semantic-role elements and components.
- Element x/y/width/height tolerance: **1 CSS pixel**. Maximum observed difference across those cases: **0px**.
- Extracted `index.html` was also opened through `file://`; its relative font assets loaded successfully.

This does not promise identical antialiasing across operating systems or browsers. Reuse the same viewport, fonts and browser when comparing geometry.

## Font provenance

Actual bundled WOFF2 `fvar`, `name` and `cmap` tables were inspected. Versions, axes, SHA-256 hashes, coverage limits and source notices are documented in [font sources](public/fonts/SOURCES.md). All three fonts retain their SIL OFL notices and copyright attribution in both the repository and exported ZIPs.

## Scope and limitations

- Automated release coverage uses Chromium. Firefox, WebKit and assistive-technology combinations were not tested.
- The initial content workflow is left-to-right. The bundled upright Latin subsets do not cover every script; Unicode is retained and missing glyphs may use system fallback.
- Contrast checks cover selected semantic color pairs. They do not certify complete accessibility.
- Local IndexedDB persistence is device/browser storage, not a backup. Portable project JSON remains the way to keep an independent copy.
- The independent interactive browser connector could not capture some download/file-chooser events. Those particular manual checks are not claimed as passed; the authored Playwright suite independently completed the download, import and reopen journey.
- Public deployment verification is a separate release step: check the successful GitHub Pages workflow, the live app, and `build-meta.json` against the intended source commit. The final release handoff records the observed URLs and exact deployed commit.

## Repeat

```sh
npm ci
npx playwright install chromium
npm run check
```

On Linux, use `npx playwright install --with-deps chromium` when browser system dependencies are needed. To run the editing journey against an existing static deployment, set `PLAYWRIGHT_BASE_URL` to its actual URL and run `npm run test:browser -- --grep "full edit"`. The test configuration skips the local development server when that variable is supplied.
