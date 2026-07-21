import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://melo.local").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account/",
        "/admin/",
        "/api/",
        "/embed/",
        "/library/",
        "/login",
        "/me/",
        "/oembed",
        "/signin",
        "/sign-in",
        "/studio/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
