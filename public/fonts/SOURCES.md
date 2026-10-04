# Proofroom font assets

Unmodified upright Latin WOFF2 assets from the exact npm packages `@fontsource-variable/source-sans-3@5.3.0`, `@fontsource-variable/source-serif-4@5.3.0`, and `@fontsource-variable/manrope@5.3.0`. Package tarballs are integrity pinned in package-lock.json. Fontsource source: https://github.com/fontsource/font-files and https://fontsource.org/ . No external font service is used at runtime.

Actual binary tables (`fvar`, `name`, `cmap`) inspected with fontTools 4.66.1 and Brotli 1.2.0 on 2026-10-05:

| File | Bytes | Internal version | Axes |
| --- | ---: | --- | --- |
| source-sans-3-latin-wght-normal.woff2 | 28740 | 3.052 | wght 200–900, default 200 |
| source-serif-4-latin-standard-normal.woff2 | 122360 | 4.004 | wght 200–900, default 400; opsz 8–60, default 20 |
| manrope-latin-wght-normal.woff2 | 24836 | 4.504 | wght 200–800, default 200 |

SHA256:

- Source Sans 3: `7a19a7027e125257d310c6dbd78ae3a30b5ea1e3794d60b12bb28227a003bfda`
- Source Serif 4: `f2ea9c12d2fe9bd3a9589b02ad2c0909da88f30938c91adc838c4f4098f9f9e0`
- Manrope: `a30ddcd349703aff7464c34bef3fffdff405ee50c113440d7c8693c02d210972`

The Latin subsets include ASCII, Western accents, curly quotes and en dash. They do not include Greek, Korean or Arabic. Unicode is preserved, but unsupported glyphs can use system fallback. No italic assets are bundled. CSS assigns explicit weights. Optical sizing Auto/Off is exposed only for Source Serif 4, which contains an actual opsz axis.

All assets use SIL Open Font License 1.1. The accompanying `*-OFL.txt` files retain packaged notices and original upstream copyright/license notices. Keep these notices with redistributed fonts. Source Sans and Source Serif retain Adobe attribution and the reserved font name Source. Manrope retains the Manrope Project Authors attribution.

Original supplementary notices:

- https://github.com/google/fonts/blob/914ec116571b1162d886aa402e715552221f0b77/ofl/sourcesans3/OFL.txt
- https://github.com/google/fonts/blob/08dc85da6bca7ae308a6f1d38d0b137465646071/ofl/sourceserif4/OFL.txt
- https://github.com/google/fonts/blob/b31870aff700ab7a1d74fa0c6887d95beb9e0037/ofl/manrope/OFL.txt

These upstream commits identify supplementary notices, not a claim that upstream TTF files are bit-identical to these Fontsource WOFF2 files.
