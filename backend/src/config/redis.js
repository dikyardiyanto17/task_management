const Redis = require('ioredis');

let client = null;
let enabled = false;

function isRedisConfigured() {
  return Boolean(process.env.REDIS_URL?.trim());
}

async function connectRedis() {
  if (!isRedisConfigured()) {
    console.log('[Redis] REDIS_URL not set — in-memory cache/queue (fine for local dev)');
    return null;
  }

  client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    retryStrategy: () => null,
  });

  client.on('error', (err) => {
    if (enabled) console.warn('[Redis] error:', err.message);
  });

  try {
    await client.ping();
    enabled = true;
    console.log('[Redis] connected');
    return client;
  } catch (err) {
    if (client) {
      try {
        client.disconnect();
      } catch {
        /* ignore */
      }
    }
    client = null;
    enabled = false;
    throw err;
  }
}

function getRedis() {
  return enabled ? client : null;
}

function isRedisReady() {
  return enabled && client?.status === 'ready';
}

async function pingRedis() {
  if (!isRedisReady()) return false;
  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

async function closeRedis() {
  if (client) {
    try {
      await client.quit();
    } catch {
      client.disconnect();
    }
    client = null;
    enabled = false;
  }
}

module.exports = {
  connectRedis,
  closeRedis,
  getRedis,
  isRedisReady,
  isRedisConfigured,
  pingRedis,
};
