import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@upstash/redis", "ioredis"],
};

export default nextConfig;
