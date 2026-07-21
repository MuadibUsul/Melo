import Redis from "ioredis";

export async function clearRedisHold(redisUrl: string, holdId: string): Promise<void> {
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
  try {
    await redis.connect();
    await redis.del(`credit:hold:${holdId}`);
  } catch {
    // The credit ledger remains authoritative; Redis can be rebuilt from it.
  } finally {
    redis.disconnect();
  }
}

export async function refundRedisHold(
  redisUrl: string,
  userId: string,
  holdId: string,
  amount: number,
): Promise<void> {
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true });
  try {
    await redis.connect();
    await redis.incrby(`credit:balance:${userId}`, amount);
    await redis.del(`credit:hold:${holdId}`);
  } catch {
    // The credit ledger remains authoritative; Redis can be rebuilt from it.
  } finally {
    redis.disconnect();
  }
}
