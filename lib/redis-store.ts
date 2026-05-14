import "server-only";

import { Redis as UpstashRedis } from "@upstash/redis";
import IORedis from "ioredis";

export type RedisProvider = "upstash" | "tcp";

/** Minimal Redis API used across the app (Upstash REST + TCP/Aiven). */
export interface KvRedis {
  exists(key: string): Promise<number>;
  hset(key: string, fields: Record<string, string>): Promise<void>;
  hgetall<T extends Record<string, string>>(key: string): Promise<T | null>;
  hget(key: string, field: string): Promise<string | null>;
  hdel(key: string, ...fields: string[]): Promise<void>;
  sadd(key: string, ...members: string[]): Promise<void>;
  srem(key: string, ...members: string[]): Promise<void>;
  smembers<T>(key: string): Promise<T>;
  scan(
    cursor: number,
    options: { match: string; count: number }
  ): Promise<[number, string[]]>;
  rpush(key: string, value: string): Promise<void>;
  ltrim(key: string, start: number, end: number): Promise<void>;
  lrange(key: string, start: number, end: number): Promise<string[]>;
  llen(key: string): Promise<number>;
  get<T = string>(key: string): Promise<T | null>;
  set(key: string, value: string): Promise<void>;
}

function resolveProvider(): RedisProvider {
  const forced = process.env.REDIS_PROVIDER?.toLowerCase();
  if (forced === "upstash") return "upstash";
  if (
    forced === "aiven" ||
    forced === "redis" ||
    forced === "valkey" ||
    forced === "tcp"
  ) {
    return "tcp";
  }

  const tcpUrl =
    process.env.REDIS_URL ||
    process.env.AIVEN_REDIS_URL ||
    process.env.VALKEY_URL;
  if (tcpUrl) return "tcp";

  return "upstash";
}

function normalizeRedisUrl(url: string): string {
  if (url.startsWith("valkeys://")) return url.replace("valkeys://", "rediss://");
  if (url.startsWith("valkey://")) return url.replace("valkey://", "redis://");
  return url;
}

function getTcpUrl(): string {
  const url = normalizeRedisUrl(
    process.env.REDIS_URL ||
      process.env.AIVEN_REDIS_URL ||
      process.env.VALKEY_URL ||
      ""
  );
  if (!url) {
    throw new Error(
      "Missing REDIS_URL (or AIVEN_REDIS_URL). Get a free Valkey instance at https://console.aiven.io/signup"
    );
  }
  return url;
}

function getUpstashConfig(): { url: string; token: string } {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.UPSTASH_REDIS_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Missing Upstash Redis env vars (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)"
    );
  }
  return { url, token };
}

function wrapUpstash(client: UpstashRedis): KvRedis {
  return {
    async exists(key) {
      return (await client.exists(key)) ?? 0;
    },
    async hset(key, fields) {
      await client.hset(key, fields);
    },
    async hgetall<T extends Record<string, string>>(key: string) {
      const raw = await client.hgetall<Record<string, string>>(key);
      return raw && Object.keys(raw).length > 0 ? (raw as T) : null;
    },
    async hget(key, field) {
      return (await client.hget<string>(key, field)) ?? null;
    },
    async hdel(key, ...fields) {
      if (fields.length) await client.hdel(key, ...(fields as [string, ...string[]]));
    },
    async sadd(key, ...members) {
      if (members.length) await client.sadd(key, ...(members as [string, ...string[]]));
    },
    async srem(key, ...members) {
      if (members.length) await client.srem(key, ...(members as [string, ...string[]]));
    },
    async smembers(key) {
      return (await client.smembers(key)) as never;
    },
    async scan(cursor, options) {
      const [next, keys] = await client.scan(cursor, {
        match: options.match,
        count: options.count,
      });
      return [Number(next), keys as string[]];
    },
    async rpush(key, value) {
      await client.rpush(key, value);
    },
    async ltrim(key, start, end) {
      await client.ltrim(key, start, end);
    },
    async lrange(key, start, end) {
      const items = await client.lrange(key, start, end);
      return (items ?? []).map((item) =>
        typeof item === "string" ? item : JSON.stringify(item)
      );
    },
    async llen(key) {
      return (await client.llen(key)) ?? 0;
    },
    async get(key) {
      return (await client.get(key)) as never;
    },
    async set(key, value) {
      await client.set(key, value);
    },
  };
}

const globalTcp = globalThis as unknown as { __kvRedisTcp?: IORedis };

function wrapIoredis(client: IORedis): KvRedis {
  return {
    async exists(key) {
      return client.exists(key);
    },
    async hset(key, fields) {
      const entries = Object.entries(fields);
      if (!entries.length) return;
      await client.hset(key, ...entries.flat());
    },
    async hgetall<T extends Record<string, string>>(key: string) {
      const raw = await client.hgetall(key);
      return raw && Object.keys(raw).length > 0
        ? (raw as T)
        : null;
    },
    async hget(key, field) {
      return client.hget(key, field);
    },
    async hdel(key, ...fields) {
      if (fields.length) await client.hdel(key, ...fields);
    },
    async sadd(key, ...members) {
      if (members.length) await client.sadd(key, ...members);
    },
    async srem(key, ...members) {
      if (members.length) await client.srem(key, ...members);
    },
    async smembers(key) {
      return (await client.smembers(key)) as never;
    },
    async scan(cursor, options) {
      const [next, keys] = await client.scan(
        cursor,
        "MATCH",
        options.match,
        "COUNT",
        options.count
      );
      return [Number(next), keys];
    },
    async rpush(key, value) {
      await client.rpush(key, value);
    },
    async ltrim(key, start, end) {
      await client.ltrim(key, start, end);
    },
    async lrange(key, start, end) {
      return client.lrange(key, start, end);
    },
    async llen(key) {
      return client.llen(key);
    },
    async get(key) {
      return (await client.get(key)) as never;
    },
    async set(key, value) {
      await client.set(key, value);
    },
  };
}

let cached: { provider: RedisProvider; client: KvRedis } | null = null;

export function getRedisProvider(): RedisProvider {
  return resolveProvider();
}

export function getKvRedis(): KvRedis {
  const provider = resolveProvider();
  if (cached && cached.provider === provider) return cached.client;

  if (provider === "tcp") {
    if (!globalTcp.__kvRedisTcp) {
      const url = getTcpUrl();
      globalTcp.__kvRedisTcp = new IORedis(url, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        ...(url.startsWith("rediss://") ? { tls: {} } : {}),
      });
    }
    const client = wrapIoredis(globalTcp.__kvRedisTcp);
    cached = { provider, client };
    return client;
  }

  const { url, token } = getUpstashConfig();
  const client = wrapUpstash(new UpstashRedis({ url, token }));
  cached = { provider, client };
  return client;
}
