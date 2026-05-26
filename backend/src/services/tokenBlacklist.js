const { getRedis, isRedisReady } = require('../config/redis');

const memoryBlacklist = new Set();

function jwtTtlSeconds() {
  const raw = process.env.JWT_EXPIRES_IN || '24h';
  const match = String(raw).match(/^(\d+)([smhd])?$/i);
  if (!match) return 86400;
  const n = Number(match[1]);
  const unit = (match[2] || 's').toLowerCase();
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * (multipliers[unit] || 1);
}

async function blacklistToken(token) {
  if (!token) return;
  const ttl = jwtTtlSeconds();
  if (isRedisReady()) {
    await getRedis().setex(`auth:blacklist:${token}`, ttl, '1');
    return;
  }
  memoryBlacklist.add(token);
  setTimeout(() => memoryBlacklist.delete(token), ttl * 1000);
}

async function isTokenBlacklisted(token) {
  if (!token) return false;
  if (isRedisReady()) {
    const hit = await getRedis().get(`auth:blacklist:${token}`);
    return hit === '1';
  }
  return memoryBlacklist.has(token);
}

module.exports = { blacklistToken, isTokenBlacklisted };
