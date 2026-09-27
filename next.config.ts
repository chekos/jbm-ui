import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Inline the production host so lib/site.ts resolves the same origin on the
  // server and in the browser (see siteOrigin()).
  env: {
    VERCEL_PROJECT_PRODUCTION_URL:
      process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "",
  },
  experimental: {
    // app/global-not-found.tsx renders unmatched URLs on demand, so an unknown /c/<name> 404
    // can name the missing item without making the prerendered pages dynamic.
    globalNotFound: true,
  },
}

export default nextConfig
