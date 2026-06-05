import { useCallback, useEffect, useState } from 'react';

export const useLocalStorageBoolean = (
  key: string,
  defaultValue: boolean,
): [boolean, (value: boolean) => void] => {
  const [value, setValue] = useState<boolean>(() => {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(key, String(value));
  }, [key, value]);

  const set = useCallback((next: boolean) => setValue(next), []);

  return [value, set];
};
