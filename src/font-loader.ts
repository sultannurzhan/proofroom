export function latestOnly<T>(
  load: (value: T) => Promise<void>,
  notify: (state: 'loading' | 'ready' | 'error', error?: string) => void,
) {
  let request = 0;
  return async (value: T) => {
    const current = ++request;
    notify('loading');
    try {
      await load(value);
      if (current === request) notify('ready');
    } catch (e) {
      if (current === request)
        notify('error', e instanceof Error ? e.message : 'Font loading failed');
    }
  };
}
