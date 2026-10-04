import { useLayoutEffect, useRef } from 'react';
import {
  fonts,
  roles,
  type Project,
  type Styles,
  type Composition,
  type Role,
} from './model';
import { generateHTML } from './generate';
import { latestOnly } from './font-loader';
type Props = {
  project: Project;
  styles: Styles;
  composition: Composition;
  error: boolean;
  width: number;
  onRole: (r: Role) => void;
  onFontState: (state: string) => void;
};
const roleClass = (r: Role) => `pr-${r === 'section' ? 'section-font' : r}`;
export function Preview({
  project,
  styles,
  composition,
  error,
  width,
  onRole,
  onFontState,
}: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const fontStateRef = useRef(onFontState);
  fontStateRef.current = onFontState;
  const lastComposition = useRef(composition);
  const generation = useRef(0);
  const savedContext = useRef({ id: 'navigation', offset: 0, wasTop: true });
  const onRoleRef = useRef(onRole);
  onRoleRef.current = onRole;
  const base = new URL(
    `${import.meta.env.BASE_URL}fonts/`,
    window.location.href,
  ).href;
  const html = generateHTML(project, styles, composition, error, {
    fontBase: base,
  });
  useLayoutEffect(() => {
    const iframe = frame.current;
    if (!iframe) return;
    const serial = ++generation.current;
    const oldDoc = iframe.contentDocument;
    let context = savedContext.current;
    if (lastComposition.current !== composition)
      context = { id: 'navigation', offset: 0, wasTop: true };
    else if (oldDoc?.documentElement && oldDoc.readyState !== 'loading') {
      const y = oldDoc.documentElement.scrollTop;
      const nodes = [...oldDoc.querySelectorAll<HTMLElement>('[id]')].filter(
        (n) =>
          [
            'navigation',
            'hero',
            'section-one',
            'section-two',
            'detail',
            'footer',
          ].includes(n.id),
      );
      const anchor = nodes.filter((n) => n.offsetTop <= y + 12).at(-1);
      if (anchor)
        context = {
          id: anchor.id,
          offset: y - anchor.offsetTop,
          wasTop: y < 1,
        };
    }
    savedContext.current = context;
    lastComposition.current = composition;
    fontStateRef.current('Loading fonts…');
    const load = latestOnly(
      async (doc: Document) => {
        await Promise.all(
          [...new Set([styles.display, styles.text])].map(async (id) => {
            const f = fonts[id];
            const loaded = await doc.fonts.load(`400 16px "${f.name}"`);
            if (!loaded.length) throw Error(`Could not load ${f.name}`);
          }),
        );
        await doc.fonts.ready;
      },
      (state, err) => {
        if (serial !== generation.current) return;
        fontStateRef.current(
          state === 'ready'
            ? 'Fonts ready'
            : state === 'error'
              ? `Font failed: ${err}. Preview may use fallback.`
              : 'Loading fonts…',
        );
      },
    );
    iframe.onload = () => {
      if (serial !== generation.current) return;
      const doc = iframe.contentDocument;
      if (!doc) return;
      doc.addEventListener('click', (e) => {
        const link = (e.target as Element).closest<HTMLAnchorElement>(
          'a[href^="#"]',
        );
        if (link) {
          e.preventDefault();
          doc
            .getElementById(link.getAttribute('href')!.slice(1))
            ?.scrollIntoView();
        }
        const nearest = (e.target as Element).closest(
          roles.map((r) => `.${roleClass(r)}`).join(','),
        );
        if (nearest) {
          const r = roles.find((r) => nearest.classList.contains(roleClass(r)));
          if (r) onRoleRef.current(r);
        }
      });
      void load(doc).then(() => {
        if (serial === generation.current) {
          const anchor = doc.getElementById(context.id);
          doc.defaultView?.scrollTo(
            0,
            context.wasTop ? 0 : (anchor?.offsetTop ?? 0) + context.offset,
          );
        }
      });
    };
    iframe.srcdoc = html;
    return () => {
      iframe.onload = null;
    };
  }, [html, composition, styles.display, styles.text]);
  return (
    <iframe
      ref={frame}
      title="Proofroom specimen"
      sandbox="allow-same-origin"
      style={{ width, minWidth: width }}
    />
  );
}
