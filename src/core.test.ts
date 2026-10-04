import { describe, it, expect, vi } from 'vitest';
import {
  createProject,
  pin,
  duplicate,
  parseProject,
  setFont,
  clone,
  presets,
  resolveImport,
} from './model';
import { packs } from './packs';
import { edit, endGroup, initialHistory, undo, redo } from './history';
import { generateHTML, themeCSS, tokens, contrast } from './generate';
import { createSaveQueue } from './persistence';
import { latestOnly } from './font-loader';
import { exportZip } from './export';
import { unzipSync, strFromU8 } from 'fflate';
const make = () => createProject(packs.Fieldnote);
const deferred = () => {
  let resolve!: () => void, reject!: (e: Error) => void;
  const promise = new Promise<void>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
};
describe('versioned document boundaries', () => {
  it('uses Signal for fresh projects without rewriting legacy directions or content', () => {
    const legacy = make();
    legacy.working = clone(presets.Editorial);
    legacy.pinned = clone(presets.Warm);
    legacy.content.title = 'Previously saved words';
    const fresh = make();
    expect(fresh.working).toEqual(presets.Signal);
    fresh.working.roles.title.size = 70;
    expect(presets.Signal.roles.title.size).toBe(64);
    expect(parseProject(JSON.stringify(legacy))).toEqual(legacy);
    expect(duplicate(legacy).working).toEqual(presets.Editorial);
  });
  it('round trips all original content packs including Unicode', () => {
    for (const content of Object.values(packs)) {
      const p = createProject(content);
      p.content.title += ' café 한국어 🪡';
      expect(parseProject(JSON.stringify(p))).toEqual(p);
    }
  });
  it.each([
    ['unknown key', (p: any) => (p.executable = 'bad')],
    ['CSS injection', (p: any) => (p.working.colors.text = 'red;display:none')],
    ['role size bound', (p: any) => (p.working.roles.title.size = 10000)],
    [
      'unsupported weight',
      (p: any) => {
        p.working.display = 'manrope';
        p.working.roles.title.weight = 900;
      },
    ],
    ['extra nested key', (p: any) => (p.content.html = '<p>bad</p>')],
    ['bidi controls', (p: any) => (p.decisionNote = 'a\u202eb')],
  ])('rejects %s', (_, mutate) => {
    const p = make();
    mutate(p);
    expect(() => parseProject(JSON.stringify(p))).toThrow();
  });
  it('explains unknown versions and malformed/oversized imports', () => {
    expect(() => parseProject('{')).toThrow('valid JSON');
    expect(() => parseProject('{"version":2}')).toThrow('version 2');
    expect(() => parseProject('🪡'.repeat(70000))).toThrow('250 KB');
  });
  it('pin freezes styles only while content is shared', () => {
    const p = pin(make());
    const pinned = clone(p.pinned);
    p.content.title = 'New shared words';
    p.working.roles.title.size = 80;
    expect(p.pinned).toEqual(pinned);
    expect(generateHTML(p, p.pinned!, 'overview')).toContain(
      'New shared words',
    );
  });
  it('presets leave copy alone and duplicates are independent', () => {
    const p = make(),
      c = clone(p.content);
    p.working = clone(presets.Clear);
    expect(p.content).toEqual(c);
    const copy = duplicate(p);
    copy.content.title = 'different';
    expect(copy.id).not.toEqual(p.id);
    expect(p.content.title).not.toEqual(copy.content.title);
  });
  it('clamps font family weights to the real supported range', () => {
    const p = make();
    p.working.roles.title.weight = 900;
    expect(setFont(p.working, 'display', 'manrope').roles.title.weight).toBe(
      800,
    );
  });
  it('preserves existing documents on a differing import ID collision', () => {
    const old = make(),
      newer = clone(old);
    newer.content.title = 'Newer work';
    const imported = resolveImport(old, [newer]);
    expect(imported.wasCopy).toBe(true);
    expect(imported.project.id).not.toBe(old.id);
    expect(imported.project.content).toEqual(old.content);
    expect(newer.content.title).toBe('Newer work');
    expect(resolveImport(old, [clone(old)]).wasCopy).toBe(false);
  });
});
describe('logical history', () => {
  it('groups a continuous adjustment, ends transaction, then undoes/redoes meaningfully', () => {
    let h = initialHistory(make());
    const original = h.present.working.roles.title.size;
    for (const v of [65, 66, 67, 68]) {
      const p = clone(h.present);
      p.working.roles.title.size = v;
      h = edit(h, p, 'title');
    }
    expect(h.past).toHaveLength(1);
    h = endGroup(h);
    const p = clone(h.present);
    p.content.title = 'Edit copy';
    h = edit(h, p, 'copy');
    expect(h.past).toHaveLength(2);
    h = undo(h);
    expect(h.present.working.roles.title.size).toBe(68);
    h = undo(h);
    expect(h.present.working.roles.title.size).toBe(original);
    h = redo(h);
    expect(h.present.working.roles.title.size).toBe(68);
  });
  it('new edit after undo clears future; no-op edits preserve history', () => {
    let h = initialHistory(make());
    expect(edit(h, clone(h.present))).toBe(h);
    const p = clone(h.present);
    p.name = 'One';
    h = undo(edit(h, p));
    const n = clone(h.present);
    n.name = 'Two';
    expect(edit(h, n).future).toHaveLength(0);
  });
});
describe('generation and export', () => {
  it('escapes text and attributes without executing imported markup', () => {
    const p = make();
    p.content.title = '<script>alert("x")</script> & café';
    p.content.emailPlaceholder = '" autofocus onfocus="alert(1)';
    const html = generateHTML(p, p.working, 'overview');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    const form = generateHTML(p, p.working, 'signup');
    expect(form).toContain('&quot; autofocus');
    expect(form).not.toMatch(/<input[^>]*" autofocus/);
    expect(form).not.toContain('onsubmit=');
    expect(form).toContain("form-action 'none'");
  });
  it('generates deterministic CSS/HTML/tokens and known contrast', () => {
    const p = make();
    expect(generateHTML(p, p.working, 'overview')).toBe(
      generateHTML(p, p.working, 'overview'),
    );
    expect(themeCSS(p.working)).toContain('.pr-section-font{font-family:');
    expect(tokens(p.working).format).toBe('Proofroom semantic tokens');
    expect(contrast('#000000', '#ffffff')).toBe(21);
  });
  it('exports reopenable project and the same independent stylesheet with licenses', async () => {
    const p = pin(make());
    const fetcher = vi.fn(
      async () => new Response('asset', { status: 200 }),
    ) as typeof fetch;
    const zip = await exportZip(p, p.working, fetcher);
    const files = unzipSync(zip);
    expect(strFromU8(files['theme.css'])).toBe(themeCSS(p.working));
    expect(parseProject(strFromU8(files['project.proofroom.json']))).toEqual(p);
    expect(strFromU8(files['index.html'])).toContain('./theme.css');
    expect(Object.keys(files).filter((k) => k.endsWith('woff2'))).toHaveLength(
      3,
    );
    expect(
      Object.keys(files).filter((k) => k.endsWith('OFL.txt')),
    ).toHaveLength(3);
  });
  it('reports an asset failure rather than exporting a broken bundle', async () => {
    await expect(
      exportZip(
        make(),
        make().working,
        async () => new Response('', { status: 404 }),
      ),
    ).rejects.toThrow('Export could not read');
  });
});
describe('async integrity', () => {
  it('serializes overlapping saves, coalesces latest same-project revision and only then says saved', async () => {
    const gate = deferred(),
      written: string[] = [],
      notify = vi.fn();
    const save = createSaveQueue(async (p) => {
      written.push(p.name);
      if (written.length === 1) await gate.promise;
    }, notify);
    const p = make();
    save({ ...p, name: 'first' });
    save({ ...p, name: 'second' });
    save({ ...p, name: 'latest' });
    expect(written).toEqual(['first']);
    expect(notify).not.toHaveBeenCalledWith('saved');
    gate.resolve();
    await vi.waitFor(() => expect(written).toEqual(['first', 'latest']));
    expect(notify).toHaveBeenLastCalledWith('saved');
  });
  it('does not discard a previous project when switching during an in-flight write', async () => {
    const gate = deferred(),
      written: string[] = [];
    const save = createSaveQueue(
      async (p) => {
        written.push(p.name);
        if (written.length === 1) await gate.promise;
      },
      () => {},
    );
    const p = make();
    save({ ...p, name: 'A1' });
    save({ ...p, name: 'A2' });
    save({ ...duplicate(p), name: 'B1' });
    gate.resolve();
    await vi.waitFor(() => expect(written).toEqual(['A1', 'A2', 'B1']));
  });
  it('preserves input work and reports persistence failure, supports retry', async () => {
    const p = make(),
      notify = vi.fn();
    let failing = true;
    const save = createSaveQueue(async () => {
      if (failing) throw Error('Quota exhausted');
    }, notify);
    save(p);
    await vi.waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        'error',
        expect.stringContaining('Quota exhausted'),
      ),
    );
    expect(parseProject(JSON.stringify(p))).toEqual(p);
    failing = false;
    save(p);
    await vi.waitFor(() => expect(notify).toHaveBeenLastCalledWith('saved'));
  });
  it('an older font success cannot replace the latest selection or failure', async () => {
    const a = deferred(),
      b = deferred(),
      notify = vi.fn();
    const load = latestOnly(
      (id: string) => (id === 'a' ? a.promise : b.promise),
      notify,
    );
    void load('a');
    void load('b');
    b.reject(Error('Newest font unavailable'));
    await vi.waitFor(() =>
      expect(notify).toHaveBeenLastCalledWith(
        'error',
        'Newest font unavailable',
      ),
    );
    a.resolve();
    await Promise.resolve();
    expect(notify).toHaveBeenLastCalledWith('error', 'Newest font unavailable');
  });
  it('does not hide an earlier project failure behind a later successful save', async () => {
    const gate = deferred(),
      notify = vi.fn();
    const a = make(),
      b = duplicate(a);
    const save = createSaveQueue(async (p) => {
      if (p.id === a.id) {
        await gate.promise;
        throw Error('A failed');
      }
    }, notify);
    save(a);
    save(b);
    gate.resolve();
    await vi.waitFor(() =>
      expect(notify).toHaveBeenLastCalledWith(
        'error',
        expect.stringContaining('A failed'),
      ),
    );
    expect(notify).not.toHaveBeenCalledWith('saved');
  });
});
