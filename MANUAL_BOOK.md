# Manual Book Project KreditSPK

## 1. Pendahuluan
Aplikasi ini adalah sistem pendukung keputusan (SPK) untuk mengevaluasi kelayakan nasabah pinjaman menggunakan metode **SAW (Simple Additive Weighting)**.

Tujuan aplikasi:
- membantu menilai kelayakan calon nasabah,
- menampilkan hasil analisis secara cepat,
- menyimpan riwayat data nasabah di browser,
- memberikan gambaran statistik dari data yang telah diinput.

---

## 2. Struktur Folder Project
Project terdiri dari 3 file utama:

| File | Fungsi |
|------|--------|
| `spk.html` | File utama yang memuat struktur tampilan dan elemen halaman |
| `style.css` | File stylesheet untuk desain UI dan layout |
| `script.js` | File logika aplikasi, perhitungan SAW, routing halaman, dan penyimpanan data |

---

## 3. Cara Menjalankan Aplikasi
1. Buka file `spk.html` menggunakan browser (Chrome, Edge, Firefox).
2. Pastikan file `style.css` dan `script.js` berada di folder yang sama agar tampilan dan logika berjalan dengan benar.
3. Aplikasi akan otomatis membuka halaman beranda.

> Catatan: Karena aplikasi menggunakan JavaScript dan localStorage, file harus dijalankan dari browser lokal, bukan dari editor preview saja.

---

## 4. Fitur Utama

### 4.1 Halaman Beranda
Menampilkan halaman utama dengan deskripsi aplikasi dan tombol untuk:
- mulai analisis,
- melihat dashboard.

### 4.2 Halaman Input Nasabah
Pengguna dapat memasukkan data nasabah yang meliputi:
- nama lengkap,
- NIK,
- penghasilan bulanan,
- jumlah pinjaman,
- status pekerjaan,
- riwayat kredit,
- lama bekerja,
- jumlah tanggungan,
- jenis jaminan.

### 4.3 Halaman Hasil Analisis
Setelah data di-submit, sistem akan:
- menghitung nilai SAW,
- menentukan status kelayakan,
- menampilkan credit score,
- menampilkan tingkat risiko.

### 4.4 Dashboard Statistik
Menampilkan ringkasan:
- total data nasabah,
- jumlah yang layak,
- jumlah yang dipertimbangkan,
- jumlah yang tidak layak.

### 4.5 Riwayat Pengajuan
Menampilkan semua data yang sudah pernah dimasukkan beserta:
- nama,
- credit score,
- status keputusan,
- tanggal penginputan,
- tombol hapus data.

---

## 5. Logika Perhitungan SAW
Aplikasi menggunakan metode SAW dengan kriteria berikut:

| Kriteria | Bobot |
|----------|-------|
| Penghasilan | 0.25 |
| Riwayat Kredit | 0.25 |
| Status Pekerjaan | 0.20 |
| Lama Bekerja | 0.10 |
| Tanggungan | 0.10 |
| Jumlah Pinjaman | 0.05 |
| Jaminan | 0.05 |

Kriteria yang bersifat benefit dan cost ditentukan secara otomatis berdasarkan jenis data.

### Langkah perhitungan:
1. Data input dikonversi ke nilai numerik.
2. Sistem mencari nilai maksimum/minimum untuk tiap kriteria.
3. Nilai dinormalisasi.
4. Nilai normalisasi dikalikan bobot.
5. Hasil akhir digunakan untuk menentukan status:
   - `Layak` jika nilai >= 0.70,
   - `Dipertimbangkan` jika nilai >= 0.45,
   - `Tidak Layak` jika di bawah 0.45.

---

## 6. Alur Penggunaan
1. Buka halaman beranda.
2. Klik tombol **Mulai Analisis**.
3. Isi form data nasabah.
4. Klik tombol **Proses Analisis**.
5. Lihat hasil keputusan.
6. Untuk melihat riwayat, buka menu **Riwayat**.
7. Jika diperlukan, gunakan fitur hapus untuk menghapus data tertentu.

---

## 7. Penyimpanan Data
Data nasabah disimpan ke browser menggunakan `localStorage` dengan key:

- `spk_nasabah_data`

Artinya:
- data akan tetap ada selama browser tidak membersihkan storage,
- data hanya tersimpan di perangkat yang sama,
- data tidak diunggah ke server.

---

## 8. Troubleshooting

### Masalah: Halaman tidak tampil rapi
- Pastikan file `style.css` benar-benar ada dan tidak diubah namanya.

### Masalah: Tombol tidak berfungsi
- Periksa apakah file `script.js` sudah terhubung dengan benar di `spk.html`.

### Masalah: Data hilang setelah refresh
- Biasanya disebabkan browser membersihkan storage atau aplikasi dibuka di mode privat.

### Masalah: Grafik tidak muncul di dashboard
- Pastikan koneksi internet aktif karena aplikasi memuat Chart.js dari CDN.

---

## 9. Kesimpulan
Project ini merupakan aplikasi sederhana namun fungsional untuk membantu keputusan kelayakan nasabah dengan metode SAW. Dengan antarmuka yang mudah dipahami, pengguna dapat menginput data, melihat hasil analisis, dan memantau statistik riwayat dalam satu aplikasi.
