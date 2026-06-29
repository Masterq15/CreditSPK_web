# 🏦 Credit Decision - Sistem Pendukung Keputusan Kelayakan Nasabah

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-13.0+-blue.svg)

Aplikasi web untuk mengevaluasi kelayakan nasabah pinjaman menggunakan metode **SAW (Simple Additive Weighting)**. Sistem ini membantu lembaga keuangan dalam mengambil keputusan kredit berdasarkan analisis multi-kriteria.

## ✨ Fitur Utama

- 📊 **Analisis Multi-Kriteria** menggunakan metode SAW
- 💳 **Credit Score Calculation** dengan 7 parameter penilaian
- 📈 **Dashboard Statistik** dengan visualisasi data
- 🗂️ **Riwayat Pengajuan** dengan pencarian dan filter
- 🔄 **Real-time Processing** untuk hasil instant
- 💾 **Database PostgreSQL** untuk penyimpanan permanen
- 🎨 **UI/UX Modern** dan responsive

## 🖼️ Screenshot

### Dashboard Utama
Tampilan dashboard dengan statistik kelayakan nasabah

### Form Input Nasabah
Form lengkap untuk input data calon peminjam

### Hasil Analisis
Hasil credit score dan rekomendasi keputusan

## 🛠️ Tech Stack

**Frontend:**
- HTML5
- CSS3 (Custom styling)
- Vanilla JavaScript
- Chart.js untuk visualisasi data

**Backend:**
- Node.js
- Express.js
- PostgreSQL
- CORS middleware

## 📋 Prerequisites

Pastikan sudah terinstall:
- [Node.js](https://nodejs.org/) (v14 atau lebih tinggi)
- [PostgreSQL](https://www.postgresql.org/) (v13 atau lebih tinggi)
- [pgAdmin 4](https://www.pgadmin.org/) (opsional, untuk GUI database)

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/Masterq15/CreditSPK_web.git
cd CreditSPK_web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Database

1. Buka pgAdmin4 atau psql terminal
2. Buat database baru:
   ```sql
   CREATE DATABASE credit_decision_db;
   ```
3. Jalankan script SQL dari file `database/setup.sql`

Atau via terminal:
```bash
psql -U postgres
CREATE DATABASE credit_decision_db;
\c credit_decision_db
\i database/setup.sql
```

### 4. Konfigurasi Environment

Buat file `.env` di root folder:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=credit_decision_db
DB_USER=postgres
DB_PASSWORD=your_password
```

⚠️ **Ganti `your_password` dengan password PostgreSQL Anda**

### 5. Jalankan Aplikasi

**Start Backend Server:**
```bash
npm start
```

Server akan berjalan di `http://localhost:3000`

**Buka Frontend:**
Buka file `spk.html` di browser Anda.

## 📚 Dokumentasi

### API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/nasabah` | Ambil semua data nasabah |
| GET | `/api/nasabah/:id` | Ambil nasabah by ID |
| POST | `/api/nasabah` | Tambah nasabah baru |
| PUT | `/api/nasabah/:id` | Update data nasabah |
| DELETE | `/api/nasabah/:id` | Hapus nasabah |

### Contoh Request

**POST /api/nasabah**
```json
{
  "nama": "John Doe",
  "nik": "1234567890123456",
  "penghasilan": 8000000,
  "jumlah_pinjaman": 50000000,
  "status_pekerjaan": "Pegawai Tetap",
  "riwayat_kredit": "Baik",
  "lama_bekerja": 5,
  "tanggungan": 2,
  "jaminan": "Sertifikat Rumah"
}
```

### Kriteria Penilaian SAW

| Kriteria | Bobot | Tipe |
|----------|-------|------|
| Penghasilan | 25% | Benefit |
| Riwayat Kredit | 25% | Benefit |
| Status Pekerjaan | 20% | Benefit |
| Lama Bekerja | 10% | Benefit |
| Tanggungan | 10% | Cost |
| Jumlah Pinjaman | 5% | Cost |
| Jaminan | 5% | Benefit |

### Skala Keputusan

| Nilai SAW | Status | Credit Score |
|-----------|--------|--------------|
| ≥ 0.70 | ✅ Layak | 700-1000 |
| 0.45 - 0.69 | ⚠️ Dipertimbangkan | 450-699 |
| < 0.45 | ❌ Tidak Layak | 0-449 |

## 📂 Struktur Project

```
CreditSPK_web/
├── database/
│   ├── setup.sql           # Script inisialisasi database
│   └── databse.sql         # Backup data
├── spk.html                # Frontend utama
├── style.css               # Stylesheet
├── script.js               # Logika frontend & perhitungan SAW
├── server.js               # Backend API server
├── package.json            # Dependencies
├── .env                    # Environment variables (buat manual)
├── .gitignore              # Git ignore rules
├── README.md               # Dokumentasi utama
├── README_SETUP.md         # Panduan setup detail
└── MANUAL_BOOK.md          # Manual pengguna lengkap
```

## 🔧 Development

**Jalankan dengan auto-reload:**
```bash
npm run dev
```

Menggunakan `nodemon` untuk auto-restart server saat ada perubahan kode.

## 🧪 Testing

### Test Manual via Browser

1. Buka `spk.html` di browser
2. Isi form dengan data sample
3. Klik "Proses Analisis"
4. Periksa hasil di halaman hasil analisis
5. Cek dashboard untuk melihat statistik

### Test API dengan cURL

```bash
# Get all data
curl http://localhost:3000/api/nasabah

# Add new data
curl -X POST http://localhost:3000/api/nasabah \
  -H "Content-Type: application/json" \
  -d '{"nama":"Test User","nik":"1234567890123456",...}'
```

## 🐛 Troubleshooting

**Problem: Server tidak bisa start**
- Periksa apakah PostgreSQL sudah berjalan
- Cek credentials di file `.env`
- Pastikan port 3000 tidak digunakan aplikasi lain

**Problem: Data tidak tersimpan**
- Periksa koneksi database di console browser
- Lihat error message di terminal server
- Pastikan tabel sudah dibuat dengan benar

**Problem: Grafik tidak muncul**
- Pastikan koneksi internet aktif (Chart.js dari CDN)
- Buka console browser untuk lihat error

## 📖 Dokumentasi Lengkap

- [Setup Guide](README_SETUP.md) - Panduan instalasi detail
- [Manual Book](MANUAL_BOOK.md) - Panduan pengguna lengkap

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan:

1. Fork repository ini
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📝 License

Project ini dilisensikan under ISC License.

## 👨‍💻 Author

**Masterq15**
- GitHub: [@Masterq15](https://github.com/Masterq15)

## 🙏 Acknowledgments

- Metode SAW (Simple Additive Weighting) untuk multi-criteria decision making
- Chart.js untuk visualisasi data
- PostgreSQL untuk database management
- Express.js untuk REST API framework

---

⭐ **Jika project ini membantu, jangan lupa kasih star!** ⭐
