import { z } from 'zod';

export const fontIds = ['source-sans-3', 'source-serif-4', 'manrope'] as const;
export type FontId = (typeof fontIds)[number];
export const fonts: Record<
  FontId,
  {
    name: string;
    min: number;
    max: number;
    optical: boolean;
    file: string;
    license: string;
  }
> = {
  'source-sans-3': {
    name: 'Source Sans 3',
    min: 200,
    max: 900,
    optical: false,
    file: 'source-sans-3-latin-wght-normal.woff2',
    license: 'source-sans-3-OFL.txt',
  },
  'source-serif-4': {
    name: 'Source Serif 4',
    min: 200,
    max: 900,
    optical: true,
    file: 'source-serif-4-latin-standard-normal.woff2',
    license: 'source-serif-4-OFL.txt',
  },
  manrope: {
    name: 'Manrope',
    min: 200,
    max: 800,
    optical: false,
    file: 'manrope-latin-wght-normal.woff2',
    license: 'manrope-OFL.txt',
  },
};
export const roles = [
  'title',
  'section',
  'body',
  'caption',
  'label',
  'button',
] as const;
export type Role = (typeof roles)[number];
export const roleNames: Record<Role, string> = {
  title: 'Title',
  section: 'Section heading',
  body: 'Body',
  caption: 'Caption',
  label: 'Label',
  button: 'Button',
};
export const roleDescriptions: Record<Role, string> = {
  title: 'The main heading in both compositions.',
  section: 'Both overview section headings and the detail heading.',
  body: 'Introductions, section paragraphs, instructions and field inputs.',
  caption: 'Eyebrows, detail text, helper messages and form errors.',
  label: 'Navigation links and field labels.',
  button: 'The overview call to action and signup button.',
};
const text = z
  .string()
  .max(4000)
  .refine(
    (v) => !/[\u202a-\u202e\u2066-\u2069]/u.test(v),
    'Directional control characters are not supported. Use left-to-right content.',
  );
const short = text.max(300);
export const contentSchema = z.strictObject({
  brand: short,
  navOne: short,
  navTwo: short,
  eyebrow: short,
  title: text,
  intro: text,
  sectionOneTitle: text,
  sectionOneBody: text,
  sectionTwoTitle: text,
  sectionTwoBody: text,
  detailLabel: short,
  detailTitle: text,
  detailBody: text,
  cta: short,
  footer: text,
  signupTitle: text,
  signupIntro: text,
  nameLabel: short,
  namePlaceholder: short,
  nameHelp: text,
  emailLabel: short,
  emailPlaceholder: short,
  emailHelp: text,
  error: text,
  signupButton: short,
  signupNote: text,
});
const roleSchema = z.strictObject({
  slot: z.enum(['display', 'text']),
  size: z.number().min(10).max(112),
  weight: z.number().int().min(200).max(900),
  lineHeight: z.number().min(1).max(2.2),
  tracking: z.number().min(-0.06).max(0.15),
});
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a six-digit hex color.');
export const stylesSchema = z
  .strictObject({
    name: short,
    display: z.enum(fontIds),
    text: z.enum(fontIds),
    optical: z.boolean(),
    roles: z.strictObject({
      title: roleSchema,
      section: roleSchema,
      body: roleSchema,
      caption: roleSchema,
      label: roleSchema,
      button: roleSchema,
    }),
    spacing: z.strictObject({
      readingWidth: z.number().min(280).max(1100),
      section: z.number().min(12).max(120),
      stack: z.number().min(4).max(48),
      padding: z.number().min(8).max(80),
    }),
    colors: z.strictObject({
      background: hex,
      surface: hex,
      text: hex,
      muted: hex,
      accent: hex,
      onAccent: hex,
      border: hex,
      error: hex,
    }),
  })
  .superRefine((s, ctx) => {
    for (const r of roles) {
      const f = fonts[s[s.roles[r].slot]];
      if (s.roles[r].weight > f.max)
        ctx.addIssue({
          code: 'custom',
          path: ['roles', r, 'weight'],
          message: `${f.name} supports weights ${f.min}–${f.max}.`,
        });
    }
  });
export const projectSchema = z.strictObject({
  version: z.literal(1),
  id: z.string().min(1).max(100),
  name: short,
  content: contentSchema,
  working: stylesSchema,
  pinned: stylesSchema.nullable(),
  fontReferences: z.tuple([
    z.literal('source-sans-3@5.3.0'),
    z.literal('source-serif-4@5.3.0'),
    z.literal('manrope@5.3.0'),
  ]),
  decisionNote: text,
});
export type Content = z.infer<typeof contentSchema>;
export type Styles = z.infer<typeof stylesSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Composition = 'overview' | 'signup';
export const clone = <T>(value: T): T => structuredClone(value);
export const editorial: Styles = {
  name: 'Editorial',
  display: 'source-serif-4',
  text: 'source-sans-3',
  optical: true,
  roles: {
    title: {
      slot: 'display',
      size: 64,
      weight: 500,
      lineHeight: 1.06,
      tracking: -0.025,
    },
    section: {
      slot: 'display',
      size: 29,
      weight: 500,
      lineHeight: 1.2,
      tracking: -0.015,
    },
    body: {
      slot: 'text',
      size: 18,
      weight: 400,
      lineHeight: 1.55,
      tracking: 0,
    },
    caption: {
      slot: 'text',
      size: 13,
      weight: 400,
      lineHeight: 1.5,
      tracking: 0.01,
    },
    label: {
      slot: 'text',
      size: 14,
      weight: 600,
      lineHeight: 1.35,
      tracking: 0.015,
    },
    button: {
      slot: 'text',
      size: 15,
      weight: 600,
      lineHeight: 1.4,
      tracking: 0.01,
    },
  },
  spacing: { readingWidth: 920, section: 48, stack: 18, padding: 32 },
  colors: {
    background: '#fffefb',
    surface: '#f0f0e8',
    text: '#252b26',
    muted: '#60675f',
    accent: '#334e3e',
    onAccent: '#ffffff',
    border: '#cbd0c6',
    error: '#ad302a',
  },
};
export const presets: Record<string, Styles> = {
  Editorial: editorial,
  Clear: {
    ...clone(editorial),
    name: 'Clear',
    display: 'manrope',
    text: 'source-sans-3',
    roles: {
      ...clone(editorial.roles),
      title: {
        slot: 'display',
        size: 56,
        weight: 600,
        lineHeight: 1.1,
        tracking: -0.04,
      },
      section: {
        slot: 'display',
        size: 25,
        weight: 600,
        lineHeight: 1.25,
        tracking: -0.025,
      },
    },
    spacing: { readingWidth: 880, section: 40, stack: 16, padding: 28 },
    colors: {
      background: '#ffffff',
      surface: '#f0f3f8',
      text: '#1d2a3b',
      muted: '#526276',
      accent: '#2854c7',
      onAccent: '#ffffff',
      border: '#cad3df',
      error: '#b42934',
    },
  },
  Warm: {
    ...clone(editorial),
    name: 'Warm',
    display: 'source-serif-4',
    text: 'manrope',
    spacing: { readingWidth: 860, section: 56, stack: 20, padding: 36 },
    colors: {
      background: '#faf7f1',
      surface: '#efe8db',
      text: '#382f29',
      muted: '#756253',
      accent: '#844327',
      onAccent: '#ffffff',
      border: '#d9caba',
      error: '#af2424',
    },
  },
};
export function createProject(content: Content): Project {
  return {
    version: 1,
    id: crypto.randomUUID(),
    name: 'Untitled proof',
    content: clone(content),
    working: clone(editorial),
    pinned: null,
    fontReferences: [
      'source-sans-3@5.3.0',
      'source-serif-4@5.3.0',
      'manrope@5.3.0',
    ],
    decisionNote: '',
  };
}
export function parseProject(raw: string): Project {
  if (new TextEncoder().encode(raw).byteLength > 250_000)
    throw Error('Project exceeds the 250 KB limit.');
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw Error(
      'This is not valid JSON. Choose a Proofroom project JSON file.',
    );
  }
  if (
    typeof data === 'object' &&
    data &&
    'version' in data &&
    data.version !== 1
  )
    throw Error(
      `Unsupported project version ${String(data.version)}. This release opens version 1.`,
    );
  const result = projectSchema.safeParse(data);
  if (!result.success)
    throw Error(
      result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.') || 'Project'}: ${i.message}`)
        .join('\n'),
    );
  return result.data;
}
export function setFont(
  s: Styles,
  slot: 'display' | 'text',
  id: FontId,
): Styles {
  const next = clone(s);
  next[slot] = id;
  for (const r of roles)
    if (next.roles[r].slot === slot)
      next.roles[r].weight = Math.min(next.roles[r].weight, fonts[id].max);
  return next;
}
export function pin(p: Project): Project {
  return { ...p, pinned: clone(p.working) };
}
export function duplicate(p: Project): Project {
  return {
    ...clone(p),
    id: crypto.randomUUID(),
    name: `${p.name.slice(0, 290)} copy`,
  };
}
export function resolveImport(
  p: Project,
  existing: Project[],
): { project: Project; wasCopy: boolean } {
  const collision = existing.find(
    (e) => e.id === p.id && JSON.stringify(e) !== JSON.stringify(p),
  );
  return collision
    ? { project: { ...p, id: crypto.randomUUID() }, wasCopy: true }
    : { project: p, wasCopy: false };
}
