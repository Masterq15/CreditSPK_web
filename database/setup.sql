-- ============================================================
-- Setup Database untuk Sistem Pendukung Keputusan (SPK)
-- PostgreSQL Database Schema
-- ============================================================

-- Buat Database (jalankan ini di pgAdmin4 Query Tool)
-- CREATE DATABASE credit_decision_db;

-- Connect ke database yang baru dibuat, lalu jalankan script di bawah ini:

-- Drop tabel jika sudah ada (untuk fresh setup)
DROP TABLE IF EXISTS nasabah CASCADE;

-- Buat tabel nasabah sesuai laporan (5 kriteria)
CREATE TABLE nasabah (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    nik VARCHAR(16) UNIQUE NOT NULL,
    penghasilan DECIMAL(15, 2) NOT NULL, -- C1: Penghasilan Per Bulan (Benefit)
    nilai_jaminan DECIMAL(15, 2) NOT NULL, -- C2: Nilai Jaminan/Aset (Benefit)
    riwayat_kredit INTEGER NOT NULL, -- C3: Riwayat Kredit (1-100, Benefit)
    tanggungan INTEGER NOT NULL, -- C4: Jumlah Tanggungan (Cost)
    pengeluaran DECIMAL(15, 2) NOT NULL, -- C5: Pengeluaran Per Bulan (Cost)
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat index untuk pencarian cepat
CREATE INDEX idx_nasabah_nik ON nasabah(nik);
CREATE INDEX idx_nasabah_tanggal ON nasabah(tanggal);

-- Insert data sample sesuai laporan (10 alternatif)
INSERT INTO nasabah (nama, nik, penghasilan, nilai_jaminan, riwayat_kredit, tanggungan, pengeluaran, tanggal) VALUES
('A1', '1234567890123456', 8000000, 150000000, 85, 2, 3500000, CURRENT_DATE),
('A2', '2345678901234567', 5000000, 200000000, 60, 4, 4000000, CURRENT_DATE),
('A3', '3456789012345678', 15000000, 500000000, 95, 1, 2000000, CURRENT_DATE),
('A4', '4567890123456789', 3500000, 70000000, 50, 3, 3000000, CURRENT_DATE),
('A5', '5678901234567890', 10000000, 120000000, 90, 3, 4500000, CURRENT_DATE),
('A6', '6789012345678901', 6500000, 180000000, 75, 2, 3800000, CURRENT_DATE),
('A7', '7890123456789012', 12500000, 350000000, 88, 1, 2200000, CURRENT_DATE),
('A8', '8901234567890123', 4200000, 95000000, 55, 4, 3100000, CURRENT_DATE),
('A9', '9012345678901234', 9000000, 130000000, 80, 3, 4200000, CURRENT_DATE),
('A10', '0123456789012345', 14000000, 420000000, 92, 2, 2700000, CURRENT_DATE);

-- Verifikasi tabel
SELECT * FROM nasabah;
