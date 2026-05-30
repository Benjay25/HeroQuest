import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // factionFrames.ts reads public/border-decoration.svg from disk at runtime.
  // Vercel's serverless bundles don't include public/ files by default, so we
  // explicitly trace the SVG into the faction routes that use it. Without this
  // the /factions pages 500 in production while working fine locally.
  outputFileTracingIncludes: {
    '/factions': ['./public/border-decoration.svg'],
    '/factions/*': ['./public/border-decoration.svg'],
  },
};

export default nextConfig;
