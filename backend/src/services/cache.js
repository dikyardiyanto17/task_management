const { getRedis, isRedisReady } = require('../config/redis');

const memory = new Map();

const DEFAULT_TTL = Number(process.env.CACHE_TTL_SECONDS) || 60;

async function cacheGet(key) {
  if (isRedisReady()) {
    const raw = await getRedis().get(key);
    return raw ? JSON.parse(raw) : null;
  }
  const entry = memory.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

async function cacheSet(key, value, ttlSeconds = DEFAULT_TTL) {
  const payload = JSON.stringify(value);
  if (isRedisReady()) {
    await getRedis().setex(key, ttlSeconds, payload);
    return;
  }
  memory.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

async function cacheDel(key) {
  if (isRedisReady()) {
    await getRedis().del(key);
    return;
  }
  memory.delete(key);
}

async function cacheDelPattern(pattern) {
  if (isRedisReady()) {
    const redis = getRedis();
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
    return;
  }
  for (const key of memory.keys()) {
    if (key.includes(pattern.replace(/\*/g, ''))) memory.delete(key);
  }
}

function buildTaskListCacheKey(query) {
  const normalized = Object.keys(query)
    .sort()
    .reduce((acc, key) => {
      const val = query[key];
      if (val !== undefined && val !== '') acc[key] = val;
      return acc;
    }, {});
  return `tasks:list:${JSON.stringify(normalized)}`;
}

async function invalidateTaskCaches(taskId = null) {
  await cacheDelPattern('tasks:list:*');
  if (taskId) await cacheDel(`tasks:detail:${taskId}`);
}

module.exports = {
  cacheGet,
  cacheSet,
  cacheDel,
  invalidateTaskCaches,
  buildTaskListCacheKey,
};
