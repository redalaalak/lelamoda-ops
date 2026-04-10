/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable client-side router cache so navigating back to a page
    // always fetches fresh server component data from the DB.
    // Without this, Next.js 14 caches server HTML client-side and
    // order status badges show stale values after external mutations.
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
}

module.exports = nextConfig
