import { useCallback, useState } from 'react';

// Storage can be missing (prerender) or throw (private mode, blocked site
// data), so every access falls back to the default.
const readBoolean = (key: string, defaultValue: boolean) => {
  try {
    if (typeof localStorage === 'undefined') return defaultValue;
    const stored = localStorage.getItem(key);
    return stored === null ? defaultValue : stored === 'true';
  } catch {
    return defaultValue;
  }
};

const writeBoolean = (key: string, value: boolean) => {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Not persisted; the in-memory value still applies for this session.
  }
};

/**
 * A boolean persisted in localStorage under `key`. When `key` changes (e.g. it
 * embeds the active apiary id) the value is re-read for the new key instead of
 * carrying the previous key's value over.
 */
export const useLocalStorageBoolean = (
  key: string,
  defaultValue: boolean,
): [boolean, (value: boolean) => void] => {
  const [state, setState] = useState(() => ({
    key,
    value: readBoolean(key, defaultValue),
  }));

  let current = state;
  if (state.key !== key) {
    // Adjust state during render rather than in an effect, so the stale value
    // is never painted for the new key.
    current = { key, value: readBoolean(key, defaultValue) };
    setState(current);
  }

  const set = useCallback(
    (next: boolean) => {
      writeBoolean(key, next);
      setState({ key, value: next });
    },
    [key],
  );

  return [current.value, set];
};
