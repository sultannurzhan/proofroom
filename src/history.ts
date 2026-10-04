import { clone, type Project } from './model';
export type History = {
  past: Project[];
  present: Project;
  future: Project[];
  group: string | null;
};
export function initialHistory(project: Project): History {
  return { past: [], present: project, future: [], group: null };
}
export function edit(
  h: History,
  next: Project,
  group: string | null = null,
): History {
  if (JSON.stringify(h.present) === JSON.stringify(next)) return h;
  return {
    past:
      group && h.group === group
        ? h.past
        : [...h.past.slice(-79), clone(h.present)],
    present: next,
    future: [],
    group,
  };
}
export function endGroup(h: History): History {
  return { ...h, group: null };
}
export function undo(h: History): History {
  return h.past.length
    ? {
        past: h.past.slice(0, -1),
        present: h.past.at(-1)!,
        future: [h.present, ...h.future],
        group: null,
      }
    : h;
}
export function redo(h: History): History {
  return h.future.length
    ? {
        past: [...h.past, h.present],
        present: h.future[0],
        future: h.future.slice(1),
        group: null,
      }
    : h;
}
