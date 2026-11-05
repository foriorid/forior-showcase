// Sitemap dinamis untuk showcase.forior.id
// Halaman statis (home + 4 kategori) + 1 URL /p/<slug> per PROYEK FOTO yang
// dibaca langsung dari Firestore, sehingga proyek baru otomatis ikut terindeks.
// Dijalankan sebagai Vercel Serverless Function (lihat rewrite di vercel.json).

const PROJECT_ID = "forior-showcase";
const API_KEY = "AIzaSyCJR4mH6VE3ci81zF3NzH9CtRtscZP_SqY";
const BASE = "https://showcase.forior.id";

// Harus identik dengan slugifyTitle() di index.html agar URL cocok.
function slugifyTitle(s) {
  return (s || "").toString().toLowerCase().trim()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function xmlEscape(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

async function fetchAllProjects() {
  let docs = [];
  let pageToken = "";
  for (let i = 0; i < 10; i++) {
    const url = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID +
      "/databases/(default)/documents/showcase_projects?key=" + API_KEY +
      "&pageSize=300" + (pageToken ? "&pageToken=" + encodeURIComponent(pageToken) : "");
    const r = await fetch(url);
    if (!r.ok) break;
    const j = await r.json();
    if (Array.isArray(j.documents)) docs = docs.concat(j.documents);
    if (j.nextPageToken) pageToken = j.nextPageToken; else break;
  }
  return docs;
}

module.exports = async function handler(req, res) {
  const today = new Date().toISOString().slice(0, 10);

  const urls = [
    { loc: BASE + "/", pr: "1.0" },
    { loc: BASE + "/foto", pr: "0.9" },
    { loc: BASE + "/video", pr: "0.8" },
    { loc: BASE + "/sosmed", pr: "0.8" },
    { loc: BASE + "/drone", pr: "0.8" }
  ];

  try {
    const docs = await fetchAllProjects();
    const seen = new Set();
    for (const d of docs) {
      const f = (d && d.fields) || {};
      const type = (f.type && f.type.stringValue) || "foto";
      if (type !== "foto") continue; // Tahap 1: hanya proyek foto
      const title = (f.title && f.title.stringValue) || "";
      const slug = slugifyTitle(title);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      urls.push({ loc: BASE + "/p/" + slug, pr: "0.7" });
    }
  } catch (e) {
    // Jika Firestore gagal diakses, tetap kembalikan sitemap statis (jangan 500).
  }

  const body = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u =>
      "  <url>\n" +
      "    <loc>" + xmlEscape(u.loc) + "</loc>\n" +
      "    <lastmod>" + today + "</lastmod>\n" +
      "    <changefreq>weekly</changefreq>\n" +
      "    <priority>" + u.pr + "</priority>\n" +
      "  </url>"
    ).join("\n") +
    "\n</urlset>\n";

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(body);
};
