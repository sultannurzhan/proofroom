import { parseProject, type Project } from './model';
export type SaveState = 'saving' | 'saved' | 'error';
export function createSaveQueue(
  write: (p: Project) => Promise<void>,
  notify: (state: SaveState, error?: string) => void,
) {
  const pending = new Map<string, { p: Project; version: number }>();
  const failed = new Map<string, { p: Project; message: string }>();
  let running = false,
    version = 0;
  async function drain() {
    if (running) return;
    running = true;
    while (pending.size) {
      const [id, item] = pending.entries().next().value!;
      pending.delete(id);
      try {
        await write(item.p);
        failed.delete(id);
      } catch (e) {
        failed.set(id, {
          p: item.p,
          message: `${item.p.name}: ${e instanceof Error ? e.message : 'Storage unavailable'}`,
        });
      }
      if (failed.size)
        notify('error', [...failed.values()].map((f) => f.message).join('; '));
      else if (item.version === version) notify('saved');
    }
    running = false;
  }
  return (p: Project) => {
    for (const [id, item] of failed)
      if (id !== p.id && !pending.has(id))
        pending.set(id, { p: structuredClone(item.p), version: 0 });
    pending.delete(p.id);
    pending.set(p.id, { p: structuredClone(p), version: ++version });
    notify('saving');
    void drain();
  };
}
let dbPromise: Promise<IDBDatabase> | undefined;
function openDB(): Promise<IDBDatabase> {
  if (!dbPromise)
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (!globalThis.indexedDB) {
        reject(Error('IndexedDB is unavailable'));
        return;
      }
      const req = indexedDB.open('proofroom', 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore('projects', { keyPath: 'id' });
        req.result.createObjectStore('meta');
      };
      req.onsuccess = () => {
        req.result.onversionchange = () => {
          req.result.close();
          dbPromise = undefined;
        };
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
      req.onblocked = () =>
        reject(
          Error(
            'Storage upgrade is blocked by another tab. Close other Proofroom tabs and retry.',
          ),
        );
    }).catch((e) => {
      dbPromise = undefined;
      throw e;
    });
  return dbPromise;
}
export async function writeProject(p: Project) {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(['projects', 'meta'], 'readwrite');
    tx.objectStore('projects').put(p);
    tx.objectStore('meta').put(p.id, 'active');
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? Error('Could not save on this device'));
    tx.onabort = () => reject(tx.error ?? Error('Storage transaction aborted'));
  });
}
export async function loadProjects(): Promise<{
  active: Project | null;
  projects: Project[];
}> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['projects', 'meta'], 'readonly');
    const list = tx.objectStore('projects').getAll();
    const current = tx.objectStore('meta').get('active');
    tx.oncomplete = () => {
      try {
        const projects = list.result.map((p) =>
          parseProject(JSON.stringify(p)),
        );
        resolve({
          active: projects.find((p) => p.id === current.result) ?? null,
          projects,
        });
      } catch (e) {
        reject(e);
      }
    };
    tx.onerror = () => reject(tx.error);
  });
}
