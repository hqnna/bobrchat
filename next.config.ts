import type { NextConfig } from "next";

import { serverEnv } from "./src/lib/env";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tiktoken", "tokenlens"],
  images: {
    remotePatterns: [
      {
        hostname: serverEnv.R2_PUBLIC_URL?.replace(/^https?:\/\//, "") || "",
      },
    ],
  },
};

export default nextConfig;
