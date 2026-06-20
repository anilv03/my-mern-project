const cache = new Map();
const MAX_KEYS = 100;
const DEFAULT_TTL = 30 * 1000;
const CLEANUP_INTERVAL = 60 * 1000;

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now > entry.expiresAt) cache.delete(key);
  }
}, CLEANUP_INTERVAL);
cleanupTimer.unref();

const get = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const set = (key, data, ttl = DEFAULT_TTL) => {
  if (cache.size >= MAX_KEYS) {
    const oldest = [...cache.entries()].sort(([, a], [, b]) => a.expiresAt - b.expiresAt)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  cache.set(key, { data, expiresAt: Date.now() + ttl });
};

const del = (key) => {
  cache.delete(key);
};

const flush = () => {
  cache.clear();
};

const wrap = async (key, fetchFn, ttl = DEFAULT_TTL) => {
  const cached = get(key);
  if (cached !== null) return cached;
  const data = await fetchFn();
  set(key, data, ttl);
  return data;
};

module.exports = { get, set, del, flush, wrap };
