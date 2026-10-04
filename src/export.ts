import { zipSync, strToU8 } from 'fflate';
import { fontIds, fonts, type Project, type Styles } from './model';
import { generateHTML, themeCSS, tokens } from './generate';
export async function exportZip(
  p: Project,
  styles: Styles,
  fetcher: typeof fetch = fetch,
) {
  const files: Record<string, Uint8Array> = {
    'index.html': strToU8(
      generateHTML(p, styles, 'overview', false, { externalCSS: true }),
    ),
    'signup.html': strToU8(
      generateHTML(p, styles, 'signup', false, { externalCSS: true }),
    ),
    'signup-error.html': strToU8(
      generateHTML(p, styles, 'signup', true, { externalCSS: true }),
    ),
    'theme.css': strToU8(themeCSS(styles)),
    'tokens.json': strToU8(JSON.stringify(tokens(styles), null, 2)),
    'project.proofroom.json': strToU8(JSON.stringify(p, null, 2)),
    'README.txt': strToU8(
      `PROOFROOM — ${styles.name}\n\nOpen index.html or signup.html in a modern browser, or serve this folder with any static server. No backend or remote submission. All assets are relative. The ZIP captures the active direction; project.proofroom.json retains both working and pinned styles and shared content. Import it into Proofroom to reopen.\n\nReusable classes: .pr-title, .pr-section-font, .pr-body, .pr-caption, .pr-label, .pr-button. Theme color/spacing variables are declared on :root. The layout classes (.pr-shell, .pr-grid, .pr-nav, .pr-detail, .pr-form, .pr-section) are specific to these sample compositions. Adapt their structure for your own implementation. tokens.json is documented Proofroom JSON, not DTCG. Role size values are pixels converted to rem using a 16px root; line heights are unitless and tracking is em.\n\nFonts: pinned Fontsource 5.3.0 Latin upright variable assets. Source Sans 3 wght 200–900; Source Serif 4 wght 200–900, opsz 8–60; Manrope wght 200–800. Optical sizing applies only where supported. Retain all font OFL notices when redistributing. See fonts/SOURCES.md. Other scripts may use system glyph fallback. Initial workflow is left-to-right.\n\nContrast feedback covers selected color pairs only; it is not an accessibility certification. Browser font rasterization differs between operating systems. Signup is a specimen with no submission; buttons are type=button and CSP blocks form actions.\n`,
    ),
  };
  for (const id of fontIds) {
    for (const file of [fonts[id].file, fonts[id].license]) {
      const res = await fetcher(`${import.meta.env.BASE_URL}fonts/${file}`);
      if (!res.ok)
        throw Error(
          `Export could not read ${file} (${res.status}). Your project is still available as JSON.`,
        );
      files[`fonts/${file}`] = new Uint8Array(await res.arrayBuffer());
    }
  }
  const source = await fetcher(`${import.meta.env.BASE_URL}fonts/SOURCES.md`);
  if (!source.ok) throw Error('Export could not read font source notices.');
  files['fonts/SOURCES.md'] = new Uint8Array(await source.arrayBuffer());
  return zipSync(files, { level: 6, mtime: new Date(1980, 0, 1, 0, 0, 0) });
}
export function download(data: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
