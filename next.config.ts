import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for the initial Cloudflare Pages deploy — all content is
  // still placeholder/static sample data at this stage, so every route can
  // be prerendered at build time (see generateStaticParams on each dynamic
  // route). Once real Sanity + RSS data lands, this will need to move to a
  // proper SSR deployment (e.g. the OpenNext Cloudflare adapter on Workers)
  // instead of a static export.
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
