import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = "https://trendi-blog.omarspace.com";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_KEY,
);

// const slugify = (text) =>
//   text
//     .toLowerCase()
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/(^-|-$)+/g, "");

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

const escapeXml = (text) => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

const generateSitemap = async () => {
  const { data: posts, error: postsError } = await supabase
    .from("blogs")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  if (postsError) {
    throw postsError;
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("username");

  if (profilesError) {
    throw profilesError;
  }

  const postUrls = posts
    .map((post) => {
      const slug = `${slugify(post.title)}-${post.id}`;

      return `
  <url>
    <loc>${SITE_URL}/app/post/${escapeXml(slug)}</loc>
    <lastmod>${new Date(post.created_at).toISOString()}</lastmod>
  </url>`;
    })
    .join("");

  const profileUrls = profiles
    .filter((profile) => profile.username)
    .map(
      (profile) => `
  <url>
    <loc>${SITE_URL}/app/profile/${escapeXml(profile.username)}</loc>
  </url>`,
    )
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
  <url>
    <loc>${SITE_URL}/</loc>
  </url>

  <url>
    <loc>${SITE_URL}/app</loc>
  </url>

  ${postUrls}

  ${profileUrls}
</urlset>`;

  const publicDir = path.resolve(__dirname, "../public");

  fs.mkdirSync(publicDir, { recursive: true });

  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemap.trim());

  console.log(
    `Sitemap generated: ${posts.length} posts, ${profiles.length} profiles`,
  );
};

generateSitemap().catch((error) => {
  console.error("Failed to generate sitemap:", error);
  process.exit(1);
});
