import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  clone,
  createProject,
  duplicate,
  fontIds,
  fonts,
  parseProject,
  pin,
  presets,
  roleDescriptions,
  roleNames,
  roles,
  setFont,
  resolveImport,
  type Content,
  type FontId,
  type Project,
  type Role,
  type Styles,
  type Composition,
} from './model';
import { packs, contentLabels } from './packs';
import {
  edit,
  endGroup,
  initialHistory,
  redo,
  undo,
  type History,
} from './history';
import {
  createSaveQueue,
  loadProjects,
  writeProject,
  type SaveState,
} from './persistence';
import { download, exportZip } from './export';
import { contrast } from './generate';
import { Preview } from './Preview';

const colorNames: Record<keyof Styles['colors'], string> = {
  background: 'Background',
  surface: 'Surface',
  text: 'Text',
  muted: 'Muted text',
  accent: 'Accent',
  onAccent: 'Text on accent',
  border: 'Border',
  error: 'Error',
};
const spacingNames: Record<keyof Styles['spacing'], string> = {
  readingWidth: 'Reading width',
  section: 'Section spacing',
  stack: 'Stack spacing',
  padding: 'Component padding',
};
const spacingLimits = {
  readingWidth: [280, 1100],
  section: [12, 120],
  stack: [4, 48],
  padding: [8, 80],
};
const packKeys = Object.keys(packs);
const tabNames = ['Type', 'Space', 'Color', 'Content', 'Project'] as const;
type Tab = (typeof tabNames)[number];
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  change,
  finish,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  change: (v: number) => void;
  finish: () => void;
}) {
  return (
    <label className="field slider">
      <span>
        {label}
        <output>
          {value}
          {unit}
        </output>
      </span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => change(Number(e.target.value))}
        onPointerUp={finish}
        onKeyUp={finish}
        onBlur={finish}
      />
    </label>
  );
}
export function App() {
  const [history, setHistory] = useState(() =>
    initialHistory(createProject(packs.Fieldnote)),
  );
  const historyRef = useRef(history);
  historyRef.current = history;
  const project = history.present;
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState<Project[]>([]);
  const [saveState, setSaveState] = useState<SaveState>('saving');
  const [saveError, setSaveError] = useState('');
  const [message, setMessage] = useState('');
  const [active, setActive] = useState<'working' | 'reference'>('working');
  const [composition, setComposition] = useState<Composition>('overview');
  const [width, setWidth] = useState(768);
  const [tab, setTab] = useState<Tab>('Type');
  const [role, setRole] = useState<Role>('title');
  const [pack, setPack] = useState('Fieldnote');
  const [showError, setShowError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);
  const queue = useRef<ReturnType<typeof createSaveQueue> | null>(null);
  if (!queue.current)
    queue.current = createSaveQueue(writeProject, (state, error) => {
      setSaveState(state);
      setSaveError(error ?? '');
    });
  useEffect(() => {
    let mounted = true;
    void loadProjects()
      .then(({ active: stored, projects }) => {
        if (!mounted) return;
        if (stored) setHistory(initialHistory(stored));
        setSaved(projects);
        setReady(true);
      })
      .catch((e) => {
        if (mounted) {
          setSaveError(
            `Could not read saved projects: ${e instanceof Error ? e.message : 'Storage unavailable'}`,
          );
          setSaveState('error');
          setReady(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    queue.current?.(project);
    setSaved((prev) => [project, ...prev.filter((p) => p.id !== project.id)]);
  }, [project, ready]);
  useEffect(() => {
    if (active === 'reference' && !project.pinned) setActive('working');
  }, [project.pinned, active]);
  const update = useCallback(
    (fn: (p: Project) => void, group: string | null = null) => {
      setHistory((h) => {
        const next = clone(h.present);
        fn(next);
        return edit(h, next, group);
      });
    },
    [],
  );
  const finish = useCallback(() => setHistory((h) => endGroup(h)), []);
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable="true"]'))
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setHistory((h) => (e.shiftKey ? redo(h) : undo(h)));
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        setHistory((h) => redo(h));
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  const styles =
    active === 'reference' && project.pinned ? project.pinned : project.working;
  const frozen = active === 'reference';
  const rs = styles.roles[role];
  const family = fonts[styles[rs.slot]];
  function changeStyle(fn: (s: Styles) => void, key?: string) {
    update((p) => fn(p.working), key ?? null);
  }
  function changeRole(
    key: keyof typeof rs,
    value: number | 'display' | 'text',
  ) {
    changeStyle((s) => {
      Object.assign(s.roles[role], { [key]: value });
      s.roles[role].weight = Math.min(
        s.roles[role].weight,
        fonts[s[s.roles[role].slot]].max,
      );
    }, `role-${role}-${key}`);
  }
  function saveJSON() {
    download(
      JSON.stringify(project, null, 2),
      'project.proofroom.json',
      'application/json',
    );
  }
  async function zip() {
    setExporting(true);
    setMessage('Preparing standalone files…');
    try {
      const bytes = await exportZip(project, styles);
      download(
        new Uint8Array(bytes).buffer,
        'proofroom-export.zip',
        'application/zip',
      );
      setMessage(
        `Exported ${active === 'working' ? 'working direction' : 'pinned reference'} with both compositions, fonts and project.`,
      );
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : 'Export failed. Project JSON is still available.',
      );
    } finally {
      setExporting(false);
    }
  }
  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 250_000) throw Error('Project exceeds the 250 KB limit.');
      const parsed = parseProject(await file.text());
      const imported = resolveImport(parsed, [project, ...saved]);
      setHistory((h) => edit(h, imported.project));
      setActive('working');
      setMessage(
        imported.wasCopy
          ? `Opened ${parsed.name} as an imported copy. Existing project retained. Import can be undone.`
          : `Opened ${parsed.name}. Import can be undone.`,
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Import failed');
    }
  }
  const shownFields = (Object.keys(contentLabels) as (keyof Content)[]).filter(
    (key) =>
      composition === 'overview'
        ? !key.startsWith('signup') &&
          ![
            'nameLabel',
            'namePlaceholder',
            'nameHelp',
            'emailLabel',
            'emailPlaceholder',
            'emailHelp',
            'error',
          ].includes(key)
        : [
            'brand',
            'footer',
            'signupTitle',
            'signupIntro',
            'nameLabel',
            'namePlaceholder',
            'nameHelp',
            'emailLabel',
            'emailPlaceholder',
            'emailHelp',
            'error',
            'signupButton',
            'signupNote',
          ].includes(key),
  );
  return (
    <div className="studio">
      <a href="#inspector" className="skip-link">
        Skip to inspector
      </a>
      <header className="studio-header">
        <div className="identity">
          <span className="mark" aria-hidden="true">
            p<span>r</span>
          </span>
          <div>
            <strong>
              Proofroom<span className="version">01</span>
            </strong>
            <small>Words first. Direction next.</small>
          </div>
        </div>
        <div className="project-identity">
          <span>{project.name}</span>
          <small role="status">
            {!ready
              ? 'Opening device storage…'
              : saveState === 'saved'
                ? 'Saved on this device'
                : saveState === 'saving'
                  ? 'Saving…'
                  : 'Could not save on this device'}
          </small>
        </div>
        <div className="header-actions">
          <button
            onClick={() => setHistory((h) => undo(h))}
            disabled={!history.past.length}
            title="Undo (Ctrl/Cmd+Z outside text fields)"
          >
            Undo
          </button>
          <button
            onClick={() => setHistory((h) => redo(h))}
            disabled={!history.future.length}
          >
            Redo
          </button>
          <button onClick={() => setTab('Project')}>Project</button>
          <button
            className="primary"
            onClick={() => void zip()}
            disabled={exporting || !ready}
          >
            {exporting ? 'Exporting…' : 'Export ZIP'}{' '}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>
      {saveState === 'error' && (
        <div className="notice danger" role="alert">
          {saveError}. Your work is still open. Export a project to keep a copy.{' '}
          <button onClick={() => queue.current?.(project)}>Retry save</button>
          <button onClick={saveJSON}>Project JSON</button>
        </div>
      )}
      {message && (
        <div className="notice" role="status">
          {message}
          <button
            className="text-button"
            onClick={() => setMessage('')}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}
      <div className="toolbar">
        <div className="toolbar-group">
          <label className="compact-field">
            Composition
            <select
              aria-label="Composition"
              value={composition}
              onChange={(e) => setComposition(e.target.value as Composition)}
            >
              <option value="overview">Overview</option>
              <option value="signup">Signup</option>
            </select>
          </label>
          <div className="segments" aria-label="Active direction">
            <button
              aria-pressed={active === 'working'}
              onClick={() => setActive('working')}
            >
              Working
            </button>
            <button
              aria-pressed={active === 'reference'}
              disabled={!project.pinned}
              onClick={() => setActive('reference')}
            >
              Reference
            </button>
          </div>
          <button
            className="flip"
            aria-label="Flip direction"
            title="Flip direction"
            disabled={!project.pinned}
            onClick={() =>
              setActive((a) => (a === 'working' ? 'reference' : 'working'))
            }
          >
            ⇄
          </button>
          <button
            onClick={() => {
              update((p) => {
                p.pinned = pin(p).pinned;
              });
              setMessage(
                'Styles pinned. Content stays shared between directions.',
              );
            }}
            disabled={!ready}
          >
            {project.pinned ? 'Replace reference' : 'Pin reference'}
          </button>
        </div>
        <div className="toolbar-group viewport-controls">
          <span className="quiet">Viewport</span>
          <div className="segments">
            {[360, 768, 1280].map((v) => (
              <button
                key={v}
                aria-pressed={width === v}
                onClick={() => setWidth(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <label className="width-input">
            <input
              aria-label="Viewport width"
              type="number"
              min="320"
              max="1600"
              value={width}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (n >= 320 && n <= 1600) setWidth(n);
              }}
            />
            px
          </label>
        </div>
      </div>
      <div className="workbench">
        <main className="desk">
          <div className="desk-caption">
            <span>
              <i className={frozen ? 'reference-dot' : ''} />{' '}
              {frozen ? 'PINNED REFERENCE' : 'WORKING DIRECTION'}{' '}
              <span className="separator">/</span> {styles.name}
            </span>
            <span>
              {width} PX · {composition.toUpperCase()}
            </span>
          </div>
          <div className="canvas-scroll">
            <div className="specimen-wrap" style={{ width }}>
              <Preview
                project={project}
                styles={styles}
                composition={composition}
                error={showError}
                width={width}
                onRole={(r) => {
                  setRole(r);
                  setTab('Type');
                }}
              />
            </div>
          </div>
          <footer className="desk-footer">
            <span>
              {project.pinned
                ? 'One set of words. Two directions.'
                : 'Pin your working styles, then try another direction.'}
            </span>
            <span>100% · real reflow</span>
          </footer>
        </main>
        <aside
          className="inspector"
          id="inspector"
          aria-label="Contextual inspector"
          tabIndex={-1}
        >
          <nav className="inspector-tabs" aria-label="Inspector">
            {tabNames.map((t) => (
              <button
                key={t}
                aria-pressed={tab === t}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>
          <div className="inspector-content">
            <div className="panel-kicker">
              {tab === 'Content'
                ? 'SHARED WORDS'
                : tab === 'Project'
                  ? 'YOUR PROOF'
                  : frozen
                    ? 'REFERENCE · FROZEN'
                    : 'WORKING STYLES'}
            </div>
            {['Type', 'Space', 'Color'].includes(tab) && (
              <>
                <h2>
                  {tab === 'Type'
                    ? 'Set the voice'
                    : tab === 'Space'
                      ? 'Give it room'
                      : 'Find the balance'}
                </h2>
                {frozen ? (
                  <p className="panel-note">
                    Pinned styles are frozen.{' '}
                    <button
                      className="inline"
                      onClick={() => setActive('working')}
                    >
                      Edit working direction
                    </button>
                  </p>
                ) : (
                  <p className="panel-note">
                    Changes affect the working direction. Your words stay in
                    place.
                  </p>
                )}
              </>
            )}
            <fieldset
              disabled={
                !ready || (frozen && ['Type', 'Space', 'Color'].includes(tab))
              }
            >
              {tab === 'Type' && (
                <>
                  <Field label="Style preset">
                    <select
                      aria-label="Style preset"
                      value={
                        Object.hasOwn(presets, styles.name) ? styles.name : ''
                      }
                      onChange={(e) =>
                        update((p) => {
                          p.working = clone(presets[e.target.value]);
                        })
                      }
                    >
                      {!Object.hasOwn(presets, styles.name) && (
                        <option value="">Custom</option>
                      )}
                      {Object.keys(presets).map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                  </Field>
                  <div className="font-slots">
                    {(['display', 'text'] as const).map((slot) => (
                      <Field
                        key={slot}
                        label={`${slot === 'display' ? 'Display' : 'Text'} font`}
                      >
                        <select
                          aria-label={`${slot === 'display' ? 'Display' : 'Text'} font`}
                          value={styles[slot]}
                          onChange={(e) =>
                            update((p) => {
                              p.working = setFont(
                                p.working,
                                slot,
                                e.target.value as FontId,
                              );
                            })
                          }
                        >
                          {fontIds.map((id) => (
                            <option key={id} value={id}>
                              {fonts[id].name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    ))}
                  </div>
                  <hr />
                  <Field label="Semantic role">
                    <select
                      aria-label="Semantic role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {roleNames[r]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <p className="role-explanation">{roleDescriptions[role]}</p>
                  <Field label="Family assignment">
                    <select
                      aria-label="Family assignment"
                      value={rs.slot}
                      onChange={(e) => {
                        changeRole(
                          'slot',
                          e.target.value as 'display' | 'text',
                        );
                        finish();
                      }}
                    >
                      <option value="display">
                        Display · {fonts[styles.display].name}
                      </option>
                      <option value="text">
                        Text · {fonts[styles.text].name}
                      </option>
                    </select>
                  </Field>
                  <Slider
                    label="Size"
                    value={rs.size}
                    min={10}
                    max={112}
                    unit=" px"
                    change={(v) => changeRole('size', v)}
                    finish={finish}
                  />
                  <Slider
                    label="Weight"
                    value={rs.weight}
                    min={family.min}
                    max={family.max}
                    step={100}
                    change={(v) => changeRole('weight', v)}
                    finish={finish}
                  />
                  <Slider
                    label="Line height"
                    value={rs.lineHeight}
                    min={1}
                    max={2.2}
                    step={0.01}
                    change={(v) => changeRole('lineHeight', v)}
                    finish={finish}
                  />
                  {(fonts[styles.display].optical ||
                    fonts[styles.text].optical) && (
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={styles.optical}
                        onChange={(e) =>
                          changeStyle((s) => {
                            s.optical = e.target.checked;
                          })
                        }
                      />
                      Automatic optical sizing
                      <small>Source Serif 4 only · supported axis 8–60</small>
                    </label>
                  )}
                  <details>
                    <summary>Advanced</summary>
                    <Slider
                      label="Tracking"
                      value={rs.tracking}
                      min={-0.06}
                      max={0.15}
                      step={0.001}
                      unit=" em"
                      change={(v) => changeRole('tracking', v)}
                      finish={finish}
                    />
                  </details>
                  <p className="footnote">
                    Bundled upright Latin fonts. Other glyphs may use system
                    fallback. No font covers every script.
                  </p>
                </>
              )}
              {tab === 'Space' && (
                <>
                  {(
                    Object.keys(spacingNames) as (keyof Styles['spacing'])[]
                  ).map((k) => (
                    <Slider
                      key={k}
                      label={spacingNames[k]}
                      value={styles.spacing[k]}
                      min={spacingLimits[k][0]}
                      max={spacingLimits[k][1]}
                      unit=" px"
                      change={(v) =>
                        changeStyle((s) => {
                          s.spacing[k] = v;
                        }, `spacing-${k}`)
                      }
                      finish={finish}
                    />
                  ))}
                  <p className="footnote">
                    Reading width limits the page measure. Section spacing
                    separates major blocks. Stack spacing separates related
                    text. Component padding gives the page and detail block
                    breathing room.
                  </p>
                </>
              )}
              {tab === 'Color' && (
                <>
                  {(Object.keys(colorNames) as (keyof Styles['colors'])[]).map(
                    (k) => (
                      <label className="color-row" key={k}>
                        <span>{colorNames[k]}</span>
                        <span>
                          <input
                            type="color"
                            aria-label={colorNames[k]}
                            value={styles.colors[k]}
                            onChange={(e) =>
                              changeStyle((s) => {
                                s.colors[k] = e.target.value;
                              }, `color-${k}`)
                            }
                            onBlur={finish}
                          />
                          <code>{styles.colors[k]}</code>
                        </span>
                      </label>
                    ),
                  )}
                </>
              )}
              {tab === 'Content' && (
                <>
                  <h2>Make the words yours</h2>
                  <p className="panel-note">
                    Plain text, shared by both directions. Initial workflow:
                    left-to-right content. Directional control characters are
                    removed.
                  </p>
                  {composition === 'signup' && (
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={showError}
                        onChange={(e) => setShowError(e.target.checked)}
                      />
                      Preview error state
                    </label>
                  )}
                  {shownFields.map((key) => (
                    <Field key={key} label={contentLabels[key]}>
                      <textarea
                        aria-label={contentLabels[key]}
                        rows={
                          [
                            'title',
                            'intro',
                            'signupTitle',
                            'signupIntro',
                          ].includes(key) || key.endsWith('Body')
                            ? 3
                            : 2
                        }
                        maxLength={
                          [
                            'brand',
                            'navOne',
                            'navTwo',
                            'eyebrow',
                            'detailLabel',
                            'cta',
                            'nameLabel',
                            'namePlaceholder',
                            'emailLabel',
                            'emailPlaceholder',
                            'signupButton',
                          ].includes(key)
                            ? 300
                            : 4000
                        }
                        value={project.content[key]}
                        onChange={(e) =>
                          update((p) => {
                            p.content[key] = e.target.value.replace(
                              /[\u202a-\u202e\u2066-\u2069]/gu,
                              '',
                            );
                          }, `content-${key}`)
                        }
                        onBlur={finish}
                      />
                    </Field>
                  ))}
                </>
              )}
              {tab === 'Project' && (
                <>
                  <h2>Keep your thinking</h2>
                  <Field label="Project name">
                    <input
                      aria-label="Project name"
                      value={project.name}
                      maxLength={300}
                      onChange={(e) =>
                        update((p) => {
                          p.name = e.target.value.replace(
                            /[\u202a-\u202e\u2066-\u2069]/gu,
                            '',
                          );
                        }, 'name')
                      }
                      onBlur={finish}
                    />
                  </Field>
                  <Field label="Saved projects">
                    <select
                      aria-label="Saved projects"
                      value={project.id}
                      onChange={(e) => {
                        const p = saved.find((p) => p.id === e.target.value);
                        if (p) {
                          setHistory(initialHistory(clone(p)));
                          setActive('working');
                        }
                      }}
                    >
                      {!saved.some((p) => p.id === project.id) && (
                        <option value={project.id}>{project.name}</option>
                      )}
                      {saved.map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <button
                    className="full"
                    onClick={() => {
                      const p = duplicate(project);
                      setHistory(initialHistory(p));
                      setMessage(
                        'Created an independent project copy on this device.',
                      );
                    }}
                  >
                    Duplicate project
                  </button>
                  <hr />
                  <Field label="Example content">
                    <select
                      aria-label="Example content"
                      value={pack}
                      onChange={(e) => setPack(e.target.value)}
                    >
                      {packKeys.map((k) => (
                        <option key={k}>{k}</option>
                      ))}
                    </select>
                  </Field>
                  <button
                    className="full"
                    onClick={() => {
                      update((p) => {
                        p.content = clone(packs[pack]);
                      });
                      setMessage(
                        `Loaded ${pack} content. Styles are unchanged. Undo restores your words.`,
                      );
                    }}
                  >
                    Load example content
                  </button>
                  <p className="footnote">
                    Loading replaces shared words only. It can be undone.
                  </p>
                  <hr />
                  <Field
                    label="Decision note"
                    hint="Optional. What made this direction work?"
                  >
                    <textarea
                      aria-label="Decision note"
                      rows={4}
                      value={project.decisionNote}
                      maxLength={4000}
                      onChange={(e) =>
                        update((p) => {
                          p.decisionNote = e.target.value.replace(
                            /[\u202a-\u202e\u2066-\u2069]/gu,
                            '',
                          );
                        }, 'note')
                      }
                      onBlur={finish}
                    />
                  </Field>
                  <button className="full" onClick={saveJSON}>
                    Export project JSON
                  </button>
                  <button
                    className="full"
                    onClick={() => importInput.current?.click()}
                  >
                    Import project JSON
                  </button>
                  <p className="footnote">
                    Version 1 · strict JSON · 250 KB maximum. Local autosave
                    stays on this device. Export a file to keep a portable copy.
                  </p>
                  <details>
                    <summary>Fonts & licenses</summary>
                    {fontIds.map((id) => (
                      <p className="footnote" key={id}>
                        {fonts[id].name} · Fontsource 5.3.0 · weights{' '}
                        {fonts[id].min}–{fonts[id].max}.{' '}
                        <a
                          href={`${import.meta.env.BASE_URL}fonts/${fonts[id].license}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          OFL license
                        </a>
                      </p>
                    ))}
                    <a
                      href={`${import.meta.env.BASE_URL}fonts/SOURCES.md`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Asset sources & binary audit
                    </a>
                  </details>
                </>
              )}
            </fieldset>
            {tab === 'Color' && (
              <div className="contrast">
                <h3>Contrast checks</h3>
                {[
                  [
                    'Text / background',
                    styles.colors.text,
                    styles.colors.background,
                  ],
                  [
                    'Muted / background',
                    styles.colors.muted,
                    styles.colors.background,
                  ],
                  ['Text / surface', styles.colors.text, styles.colors.surface],
                  [
                    'Muted / surface',
                    styles.colors.muted,
                    styles.colors.surface,
                  ],
                  [
                    'Button text / accent',
                    styles.colors.onAccent,
                    styles.colors.accent,
                  ],
                  [
                    'Error / background',
                    styles.colors.error,
                    styles.colors.background,
                  ],
                ].map(([label, a, b]) => {
                  const n = contrast(a, b);
                  return (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{n.toFixed(2)}:1</strong>
                      <small>
                        {n >= 4.5
                          ? 'Meets 4.5:1 for normal text'
                          : n >= 3
                            ? 'Large text only at 3:1'
                            : 'Below 3:1'}
                      </small>
                    </div>
                  );
                })}
                <p className="footnote">
                  Selected color pairs only. This is not a complete
                  accessibility certification.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
      <input
        ref={importInput}
        type="file"
        accept=".json,application/json"
        aria-label="Import JSON file"
        hidden
        onChange={(e) => {
          void importFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
