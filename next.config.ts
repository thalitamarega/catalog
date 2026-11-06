import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/api/catalog-image/*": ["./data/catalog-photo-packs/**"] },
  images: {
    localPatterns: [{ pathname: "/api/catalog-image/**" }, { pathname: "/**", search: "" }],
    remotePatterns: [
      { protocol: "https", hostname: "qkhwtksyxvwozfyzhyfr.supabase.co", pathname: "/storage/v1/object/public/catalog-images/**" },
      {
        protocol: "https",
        hostname: "www.infinitypiercing.com.br",
        pathname: "/cdn/shop/files/**",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
    ],
  },
};

export default nextConfig;
