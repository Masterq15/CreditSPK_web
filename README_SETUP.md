# Setup Database PostgreSQL untuk SPK Kelayakan Nasabah

## Langkah-langkah Setup

### 1. Setup Database di pgAdmin4

1. Buka pgAdmin4
2. Klik kanan pada **Databases** → **Create** → **Database**
3. Beri nama: `credit_decision_db`
4. Klik **Save**

5. Buka Query Tool (klik kanan pada database yang baru dibuat → **Query Tool**)
6. Copy dan jalankan script SQL dari file `database/setup.sql`
7. Pastikan tabel `nasabah` berhasil dibuat dan data sample terinsert

### 2. Setup Backend API

1. Install Node.js jika belum ada: https://nodejs.org/

2. Install dependencies:
```bash
cd d:\CreditDecision_web-main
npm install
```

3. Konfigurasi database di file `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=credit_decision_db
DB_USER=postgres
DB_PASSWORD=your_password
```
Ganti `your_password` dengan password PostgreSQL Anda.

4. Jalankan server backend:
```bash
npm start
```
Server akan berjalan di `http://localhost:3000`

### 3. Jalankan Frontend

Buka file `spk.html` di browser. Frontend sekarang akan:
- Mengambil data dari PostgreSQL via API
- Menyimpan data baru ke database
- Menghapus data dari database

## API Endpoints

- `GET /api/nasabah` - Ambil semua data nasabah
- `GET /api/nasabah/:id` - Ambil nasabah by ID
- `POST /api/nasabah` - Tambah nasabah baru
- `PUT /api/nasabah/:id` - Update nasabah
- `DELETE /api/nasabah/:id` - Hapus nasabah

## Struktur Database

Tabel `nasabah`:
- `id` (SERIAL PRIMARY KEY)
- `nama` (VARCHAR)
- `nik` (VARCHAR UNIQUE)
- `penghasilan` (DECIMAL)
- `jumlah_pinjaman` (DECIMAL)
- `status_pekerjaan` (VARCHAR)
- `riwayat_kredit` (VARCHAR)
- `lama_bekerja` (DECIMAL)
- `tanggungan` (INTEGER)
- `jaminan` (VARCHAR)
- `tanggal` (DATE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
