import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Inline the production host so lib/site.ts resolves the same origin on the
  // server and in the browser (see siteOrigin()).
  env: {
    VERCEL_PROJECT_PRODUCTION_URL:
      process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "",
  },
}

export default nextConfig
