# FORIOR Showcase — index.html (static, Firebase Firestore)

## Problem statement
Website portofolio single-file HTML (Gemini-assisted), Firebase Firestore, deploy Vercel, domain showcase.forior.id.
Keluhan: (1) proyek publish tak muncul di "Semua", hanya di "Rumah" + duplikat; (2) error "Terjadi masalah saat memproses gambar"; (3) blank di HP/browser lain.

## Arsitektur
- 1 file `index.html`. Firebase compat v10 (app + firestore). TIDAK pakai Firebase Storage.
- Gambar disimpan sebagai base64 DI DALAM dokumen Firestore (koleksi `showcase_projects`). Limit keras Firestore = 1MB/dokumen.
- User memilih tetap paket GRATIS (Spark) → tidak pakai Firebase Storage (kini wajib Blaze). Solusi: perkuat base64-in-Firestore.

## Root cause (terverifikasi via kode)
- Kombinasi cover+galeri base64 bisa > 1MB → tulis Firestore GAGAL → kode lama diam-diam simpan ke localStorage & tampilkan sukses. Akibat: proyek hanya ada di browser itu → tidak muncul di HP/browser lain & di device lain "blank"/kosong; user mengulang → duplikat.
- "Semua vs Rumah": logika filter sebenarnya benar (Rumah ⊆ Semua). Persepsi bug berasal dari data lokal-per-browser yang berbeda + limit tampil 9.
- "Memproses gambar": foto HEIC iPhone tak bisa didecode `new Image()`, dan `FileReader.onerror` tidak ditangani (promise menggantung). Budget per-gambar punya lantai 160KB → total membengkak > 1MB.

## Implemented (2026-06)
- Kompresi gambar dirombak: konversi HEIC/HEIF (heic2any CDN), tangani error FileReader/decode, JAMIN hasil ≤ budget byte.
- Penjaga ukuran dokumen < 950KB (aman di bawah limit 1MB Firestore); tolak + pesan jelas bila kebanyakan foto.
- Budget per-gambar dibagi rata tanpa lantai 160KB (penyebab membengkak).
- Error jujur: bila tulis Cloud gagal, TIDAK pura-pura sukses; pesan spesifik (permission/koneksi/ukuran). Fallback lokal hanya bila cloud offline & diberi peringatan mencolok.
- Anti-blank: lucide CDN dipin ke unpkg umd 0.454.0 + guard no-op bila CDN gagal; global error/unhandledrejection handler + try/catch init agar tak terkunci di skeleton.
- Pesan toast mendukung tipe error (ikon merah, durasi lebih lama).

## Catatan
- Data proyek lama TIDAK dihapus/dimigrasi.
- File kerja: /app/index.html (untuk di-commit ke GitHub).

## Backlog / Next
- (Opsional) Upgrade Blaze → migrasi ke Firebase Storage (hapus limit 1MB, upload banyak/berat).
- Batasi jumlah foto galeri di UI + tampilkan estimasi ukuran sebelum submit.
- Cek Firestore Security Rules (read publik / write admin) agar publish tidak permission-denied.
