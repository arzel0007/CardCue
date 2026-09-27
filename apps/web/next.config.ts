import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Monorepo: apps/web has its own lockfile; keep traces scoped here.
  outputFileTracingRoot: path.join(__dirname),
  // Firebase Hosting serves the static export in apps/web/out
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
