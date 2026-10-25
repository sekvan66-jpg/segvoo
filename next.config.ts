import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node:sqlite is a built-in; keep it external from the server bundle.
  serverExternalPackages: ["node:sqlite"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
