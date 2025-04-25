import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        '.app.github.dev' // This will allow GitHub Codespace domains
      ]
    }
  }
};

export default nextConfig;


