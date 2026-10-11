const NS = 'mood-calendar';

export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(`${NS}:${key}`);
      return value ? (JSON.parse(value) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(`${NS}:${key}`, JSON.stringify(value));
    } catch {
      // In private browsing, the app keeps working for the current session.
    }
  },
};
