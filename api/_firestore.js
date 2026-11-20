// Helper bersama untuk serverless functions: baca koleksi Firestore via REST.
const PROJECT_ID = "forior-showcase";
const API_KEY = "AIzaSyCJR4mH6VE3ci81zF3NzH9CtRtscZP_SqY";
const BASE = "https://firestore.googleapis.com/v1/projects/" + PROJECT_ID +
  "/databases/(default)/documents/showcase_projects";

function fromValue(v) {
  if (!v || typeof v !== "object") return undefined;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromValue);
  if ("mapValue" in v) {
    const o = {};
    const f = v.mapValue.fields || {};
    for (const k in f) o[k] = fromValue(f[k]);
    return o;
  }
  return undefined;
}

function docToObject(d) {
  const o = { id: d.name.split("/").pop() };
  const f = d.fields || {};
  for (const k in f) o[k] = fromValue(f[k]);
  return o;
}

async function fetchAllProjects() {
  let docs = [];
  let pageToken = "";
  for (let i = 0; i < 50; i++) {
    const url = BASE + "?key=" + API_KEY + "&pageSize=300" +
      (pageToken ? "&pageToken=" + encodeURIComponent(pageToken) : "");
    const r = await fetch(url);
    if (!r.ok) throw new Error("Firestore HTTP " + r.status);
    const j = await r.json();
    if (Array.isArray(j.documents)) docs = docs.concat(j.documents.map(docToObject));
    if (j.nextPageToken) pageToken = j.nextPageToken; else break;
  }
  return docs;
}

async function fetchProject(id, fields) {
  // fields (opsional): hanya ambil field tertentu, mis. ["image"], agar unduhan kecil.
  const mask = (fields || []).map(f => "&mask.fieldPaths=" + encodeURIComponent(f)).join("");
  const r = await fetch(BASE + "/" + encodeURIComponent(id) + "?key=" + API_KEY + mask);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("Firestore HTTP " + r.status);
  return docToObject(await r.json());
}

module.exports = { fetchAllProjects, fetchProject };
