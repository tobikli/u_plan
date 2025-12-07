// Source - https://stackoverflow.com/a
// Posted by CodeWill, modified by community. See post 'Timeline' for change history
// Retrieved 2025-12-06, License - CC BY-SA 4.0

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // Add this line
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
