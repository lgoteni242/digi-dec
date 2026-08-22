import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Domaines de diffusion UploadThing : les photos d'agents y sont hebergees.
    remotePatterns: [
      { protocol: "https", hostname: "*.ufs.sh" },
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
};

export default nextConfig;
