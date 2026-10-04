import {
  fonts,
  roles,
  type Styles,
  type Project,
  type Composition,
} from './model';
export function escapeText(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
}
export function generateCSS(s: Styles, fontBase = './fonts/'): string {
  const fontRules = [...new Set([s.display, s.text])]
    .map((id) => {
      const f = fonts[id];
      return `@font-face{font-family:"${f.name}";src:url("${fontBase}${f.file}") format("woff2");font-style:normal;font-weight:${f.min} ${f.max};font-display:block;}`;
    })
    .join('\n');
  const variables = [
    ...Object.entries(s.colors).map(([k, v]) => `--color-${k}:${v}`),
    ...Object.entries(s.spacing).map(([k, v]) => `--space-${k}:${v}px`),
  ].join(';');
  const roleCSS = roles
    .map((role) => {
      const r = s.roles[role];
      return `.pr-${role}{font-family:"${fonts[s[r.slot]].name}",${s[r.slot] === 'source-serif-4' ? 'serif' : 'sans-serif'};font-size:${r.size / 16}rem;font-weight:${r.weight};line-height:${r.lineHeight};letter-spacing:${r.tracking}em;font-optical-sizing:${s.optical ? 'auto' : 'none'};}`;
    })
    .join('\n');
  return `${fontRules}\n:root{${variables};color-scheme:light}*{box-sizing:border-box}html{scroll-behavior:auto}body{margin:0;background:var(--color-background);color:var(--color-text)}${roleCSS}
button,input{font:inherit}a{color:inherit;text-underline-offset:.2em;overflow-wrap:anywhere;max-width:100%}.pr-nav>*{min-width:0;overflow-wrap:anywhere}.pr-nav-links{min-width:0}.pr-nav-links a{min-width:0}button,a,input{touch-action:manipulation}a:focus-visible,button:focus-visible,input:focus-visible{outline:3px solid var(--color-accent);outline-offset:4px}h1,h2,p{margin:0;overflow-wrap:anywhere}button{white-space:normal;overflow-wrap:anywhere}input{min-width:0;width:100%;border:1px solid var(--color-border);padding:14px 16px;background:var(--color-background);color:var(--color-text);border-radius:0}input::placeholder{color:var(--color-muted);opacity:1}.pr-muted{color:var(--color-muted)}.pr-shell{max-width:calc(var(--space-readingWidth) + 2 * var(--space-padding));margin:0 auto;padding:var(--space-padding)}.pr-nav{display:flex;justify-content:space-between;align-items:baseline;gap:var(--space-stack);padding-bottom:24px;border-bottom:1px solid var(--color-border);flex-wrap:wrap}.pr-nav-links{display:flex;gap:24px;flex-wrap:wrap}.pr-brand{font-weight:700}.pr-stack>*+*{margin-top:var(--space-stack)}.pr-section{margin-top:var(--space-section)}.pr-hero{padding-top:var(--space-section)}.pr-hero h1{max-width:15ch}.pr-intro{max-width:65ch}.pr-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--space-section);border-top:1px solid var(--color-border);padding-top:var(--space-section)}.pr-detail{background:var(--color-surface);padding:var(--space-padding);border:1px solid var(--color-border)}.pr-button{display:inline-block;border:1px solid var(--color-accent);background:var(--color-accent);color:var(--color-onAccent);padding:14px 22px;text-decoration:none;cursor:pointer}.pr-footer{border-top:1px solid var(--color-border);padding-top:24px}.pr-form{max-width:580px}.pr-field{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}.pr-field>*{min-width:0;overflow-wrap:anywhere}.pr-error{color:var(--color-error)}.pr-error-input{border-color:var(--color-error)}.pr-signup-heading{max-width:18ch}.pr-rule{border:0;border-top:1px solid var(--color-border);margin:0}@media(max-width:600px){.pr-grid{grid-template-columns:1fr}.pr-nav-links{gap:14px}.pr-shell{padding:min(var(--space-padding),24px)}.pr-title{font-size:min(${s.roles.title.size / 16}rem, max(2rem,10vw))}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition:none!important;animation:none!important}}`;
}
export function generateBody(
  p: Project,
  composition: Composition,
  error = false,
): string {
  const c = Object.fromEntries(
    Object.entries(p.content).map(([k, v]) => [k, escapeText(v)]),
  ) as Project['content'];
  const nav = `<nav id="navigation" class="pr-nav pr-label" aria-label="Example navigation"><span class="pr-brand">${c.brand}</span><div class="pr-nav-links"><a href="#section-one">${c.navOne}</a><a href="#detail">${c.navTwo}</a></div></nav>`;
  if (composition === 'signup')
    return `<main class="pr-shell pr-body" dir="ltr"><header id="navigation" class="pr-nav pr-label"><span class="pr-brand">${c.brand}</span></header><section id="hero" class="pr-hero pr-stack"><h1 class="pr-title pr-signup-heading">${c.signupTitle}</h1><p class="pr-body pr-intro">${c.signupIntro}</p></section><form id="section-one" class="pr-form pr-section pr-stack" onsubmit="return false"><div class="pr-field"><label class="pr-label" for="specimen-name">${c.nameLabel}</label><input class="pr-body" id="specimen-name" type="text" placeholder="${c.namePlaceholder}" aria-describedby="name-help" autocomplete="off"><p class="pr-caption pr-muted" id="name-help">${c.nameHelp}</p></div><div class="pr-field"><label class="pr-label" for="specimen-email">${c.emailLabel}</label><input class="pr-body ${error ? 'pr-error-input' : ''}" id="specimen-email" type="email" placeholder="${c.emailPlaceholder}" aria-describedby="email-help${error ? ' email-error' : ''}" ${error ? 'aria-invalid="true"' : ''} autocomplete="off"><p class="pr-caption pr-muted" id="email-help">${c.emailHelp}</p>${error ? `<p id="email-error" class="pr-caption pr-error">${c.error}</p>` : ''}</div><button class="pr-button" type="button">${c.signupButton}</button><p class="pr-caption pr-muted" id="detail">${c.signupNote}</p></form><footer id="footer" class="pr-footer pr-section pr-caption pr-muted">${c.footer}</footer></main>`;
  return `<main class="pr-shell pr-body" dir="ltr">${nav}<section id="hero" class="pr-hero pr-stack"><p class="pr-caption pr-muted">${c.eyebrow}</p><h1 class="pr-title">${c.title}</h1><p class="pr-body pr-intro">${c.intro}</p></section><div class="pr-grid pr-section"><section id="section-one" class="pr-stack"><h2 class="pr-section-heading pr-section-role pr-section-font">${c.sectionOneTitle}</h2><p class="pr-body">${c.sectionOneBody}</p></section><section id="section-two" class="pr-stack"><h2 class="pr-section-heading pr-section-role pr-section-font">${c.sectionTwoTitle}</h2><p class="pr-body">${c.sectionTwoBody}</p></section></div><aside id="detail" class="pr-detail pr-section pr-stack"><p class="pr-caption pr-muted">${c.detailLabel}</p><h2 class="pr-section-heading pr-section-role pr-section-font">${c.detailTitle}</h2><p class="pr-body">${c.detailBody}</p><a href="#footer" class="pr-button">${c.cta}</a></aside><footer id="footer" class="pr-footer pr-section pr-caption pr-muted">${c.footer}</footer></main>`;
}
// Layout spacing and the section-heading role use distinct classes.
export function themeCSS(s: Styles, fontBase = './fonts/'): string {
  return generateCSS(s, fontBase).replace(
    '.pr-section{font-family:',
    '.pr-section-font{font-family:',
  );
}
export function generateHTML(
  p: Project,
  s: Styles,
  composition: Composition,
  error = false,
  options: { fontBase?: string; externalCSS?: boolean } = {},
): string {
  return `<!doctype html>\n<html lang="en" dir="ltr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' 'self'; font-src 'self' http: https: data:; form-action 'none'; base-uri 'none'"><title>${escapeText(p.content.brand)} — ${composition === 'overview' ? 'Overview' : 'Signup specimen'}</title>${options.externalCSS ? '<link rel="stylesheet" href="./theme.css">' : `<style>${themeCSS(s, options.fontBase)}</style>`}</head><body>${generateBody(p, composition, error).replace(' onsubmit="return false"', '')}</body></html>`;
}
export function tokens(s: Styles) {
  return {
    format: 'Proofroom semantic tokens',
    version: 1,
    description:
      'Plain JSON; not a DTCG format. Sizes in CSS pixels, line heights unitless, tracking in em. Role classes use rem at a 16px root.',
    fonts: {
      display: fonts[s.display].name,
      text: fonts[s.text].name,
      opticalSizing: s.optical ? 'auto' : 'none',
    },
    roles: s.roles,
    spacing: s.spacing,
    colors: s.colors,
  };
}
function luminance(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
export function contrast(a: string, b: string) {
  const aa = luminance(a),
    bb = luminance(b);
  return (Math.max(aa, bb) + 0.05) / (Math.min(aa, bb) + 0.05);
}
