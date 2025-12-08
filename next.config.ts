// Source - https://stackoverflow.com/a
// Posted by CodeWill, modified by community. See post 'Timeline' for change history
// Retrieved 2025-12-06, License - CC BY-SA 4.0

import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig = {
  output: "standalone", // Add this line
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
} satisfies NextConfig;

export default nextConfig;
