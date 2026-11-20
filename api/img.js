// Menyajikan gambar base64 lama yang tersimpan di dokumen Firestore sebagai file gambar biasa.
// URL berisi ?v=<timestamp proyek> sehingga aman di-cache lama (berubah saat proyek diedit).
// /api/img?id=<docId>[&g=<indexGaleri>]&v=<timestamp>
const { fetchProject } = require("./_firestore");

module.exports = async function handler(req, res) {
  const { id, g } = req.query || {};
  if (!id) { res.status(400).send("missing id"); return; }
  try {
    const isGallery = g !== undefined && g !== "";
    const p = await fetchProject(String(id), [isGallery ? "gallery" : "image"]);
    if (!p) { res.status(404).send("not found"); return; }

    let src;
    if (isGallery) {
      const i = parseInt(g, 10);
      src = Array.isArray(p.gallery) ? p.gallery[i] : undefined;
    } else {
      src = p.image;
    }

    if (typeof src === "string" && src.startsWith("http")) {
      // Sudah dimigrasi ke URL biasa: alihkan.
      res.setHeader("Cache-Control", "public, max-age=300");
      res.redirect(302, src);
      return;
    }

    const m = typeof src === "string" && src.match(/^data:([^;,]+)?(;base64)?,(.*)$/s);
    if (!m) { res.status(404).send("no image"); return; }
    const mime = m[1] || "image/jpeg";
    const body = m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]));

    res.setHeader("Content-Type", mime);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=31536000, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(body);
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.status(502).send("upstream error");
  }
};
