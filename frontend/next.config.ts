import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  // `npm run build` runs the flat-config ESLint CLI first. Avoid Next 15's
  // legacy lint wrapper running a second, incompatible configuration pass.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
