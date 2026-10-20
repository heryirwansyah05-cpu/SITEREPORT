G-NET TRACK ANALYZER — VERSI SEDERHANA
======================================

CARA PAKAI
1. Ekstrak ZIP.
2. Untuk uji lokal, buka folder di VS Code dan jalankan index.html menggunakan ekstensi Live Server.
3. Klik Pilih foto screenshot, pilih screenshot G-Net Track.
4. Klik Analisis foto dan tunggu proses OCR selesai.
5. Baca Kesimpulan, Tindakan, dan Site Terdekat. Bagian “Lihat data yang terbaca” membantu memeriksa angka yang berhasil dikenali.

GO LIVE DI GITHUB PAGES
1. Buat repository GitHub baru.
2. Upload seluruh isi folder ke root repository (index.html di root, serta folder data/).
3. Buka Settings > Pages > Deploy from a branch > main > /(root) > Save.
4. Gunakan URL Pages yang diberikan GitHub.

PENTING
- Screenshot diproses dengan OCR di browser menggunakan Tesseract.js CDN; koneksi internet diperlukan saat memuat modul OCR.
- OCR bisa salah membaca angka. Periksa hasilnya sebelum membuat laporan.
- Screenshot yang dipotong, buram, atau teks kecil dapat gagal dibaca. Untuk G-Net Track Indonesia, Bujur adalah longitude dan Lintang adalah latitude.
- Site terdekat dihitung dari GPS terhadap database SITE. Itu bukan bukti serving cell. Untuk memastikan site yang melayani HP, diperlukan pemetaan eNB/Cell ID/PCI dari konfigurasi radio.
- Database Excel asli yang diberikan disertakan dalam folder data sebagai referensi; aplikasi memakai data/sites.json yang sudah disiapkan dari sheet SITE agar pemuatan lebih sederhana.
- Data profil site akan dipublikasikan sebagai file statis jika repository dibuat publik. Pastikan kebijakan organisasi mengizinkan publikasi database ini.


PEMBARUAN LAPORAN TECHNICAL
- Judul web: Simple Report NETWORK ISSUE.
- Alur dibuat untuk pengguna awam: Upload screenshot > Analisis foto > Salin laporan untuk Technical.
- Laporan salinan berisi status, kesimpulan bahasa sederhana, perkiraan aplikasi yang mungkin terganggu, parameter terbaca, identitas sel, GPS, site terdekat, dan tindakan awal.
- Perkiraan pemakaian aplikasi hanya indikasi dari parameter radio. Hasil nyata juga dipengaruhi kecepatan data, ping, kepadatan jaringan, perangkat, dan aplikasi; bukan jaminan bahwa aplikasi tertentu bisa/tidak bisa digunakan.

PEMBARUAN FORMAT LAPORAN TECHNICAL
- Tombol Salin laporan tidak lagi menyertakan bagian Tindakan awal atau Catatan.
- Laporan meminta tim Technical memeriksa status SITE berdasarkan ID dan nama site terdekat.
- Ditambahkan keterangan kartu SIM yang digunakan saat pengecekan: TRI / IM3 / Telkomsel / lainnya. Pastikan laporan dikirim bersama operator kartu yang benar-benar digunakan di HP pengukur.
