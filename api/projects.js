// Daftar proyek RINGAN untuk pengunjung umum.
// Gambar base64 lama (bisa >10MB total) diganti URL /api/img yang di-cache CDN,
// sehingga halaman tidak perlu mengunduh seluruh koleksi Firestore (~16MB) di HP.
const { fetchAllProjects } = require("./_firestore");

function isDataUrl(s) { return typeof s === "string" && s.startsWith("data:"); }

module.exports = async function handler(req, res) {
  try {
    const docs = await fetchAllProjects();
    const light = docs.map(p => {
      const v = p.timestamp || 0;
      const q = "id=" + encodeURIComponent(p.id) + "&v=" + v;
      const out = { ...p };
      if (isDataUrl(out.image)) out.image = "/api/img?" + q;
      if (Array.isArray(out.gallery)) {
        out.gallery = out.gallery.map((g, i) => isDataUrl(g) ? "/api/img?" + q + "&g=" + i : g);
      }
      return out;
    }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    // Segar ~1 menit di CDN; setelahnya CDN tetap langsung menyajikan salinan lama (instan)
    // sambil memperbarui di latar belakang, jadi pengunjung tidak pernah menunggu Firestore.
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=86400");
    res.status(200).send(JSON.stringify(light));
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(502).json({ error: "upstream", message: String(e && e.message || e) });
  }
};
