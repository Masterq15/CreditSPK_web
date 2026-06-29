// ============================================================
// 1. KONFIGURASI & STATE MANAGEMENT
// ============================================================

// Bobot & Jenis Kriteria (SAW) sesuai laporan
const WEIGHTS = { 
    penghasilan: 0.30,      // C1: Penghasilan Per Bulan (Benefit)
    nilai_jaminan: 0.20,   // C2: Nilai Jaminan/Aset (Benefit)
    riwayat_kredit: 0.25,  // C3: Riwayat Kredit (Benefit)
    tanggungan: 0.15,      // C4: Jumlah Tanggungan (Cost)
    pengeluaran: 0.10      // C5: Pengeluaran Per Bulan (Cost)
};
const CRITERIA_TYPE = { 
    penghasilan: "benefit",
    nilai_jaminan: "benefit",
    riwayat_kredit: "benefit",
    tanggungan: "cost",
    pengeluaran: "cost"
};

// Threshold sesuai laporan
const THRESHOLD = { layak: 0.65, dipertimbangkan: 0.45 };

// MANAJEMEN DATA (API PostgreSQL)
const API_URL = 'http://localhost:3000/api/nasabah';
let nasabahList = [];
let lastResult = null;

// Load data dari API saat aplikasi pertama kali dimuat
async function loadDataFromAPI() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            console.error('Error fetching data:', response.statusText);
            return;
        }
        const data = await response.json();
        // Convert snake_case dari database ke camelCase untuk frontend
        nasabahList = data.map(n => ({
            id: n.id,
            nama: n.nama,
            nik: n.nik,
            penghasilan: n.penghasilan,
            nilai_jaminan: n.nilai_jaminan,
            riwayat_kredit: n.riwayat_kredit,
            tanggungan: n.tanggungan,
            pengeluaran: n.pengeluaran,
            tanggal: n.tanggal,
            created_at: n.created_at
        }));
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Load data saat aplikasi dimuat
loadDataFromAPI();

// ============================================================
// 2. SAW ENGINE (Logika Perhitungan)
// ============================================================

function runSAW(data) {
    if (data.length === 0) return [];
    
    // Step 1: Konversi ke angka (tidak perlu konversi kualitatif, semua sudah numerik)
    let numeric = data.map(n => ({
        ...n,
        penghasilan: parseFloat(n.penghasilan) || 0,
        nilai_jaminan: parseFloat(n.nilai_jaminan) || 0,
        riwayat_kredit: parseFloat(n.riwayat_kredit) || 0,
        tanggungan: parseInt(n.tanggungan) || 0,
        pengeluaran: parseFloat(n.pengeluaran) || 0
    }));

    // Step 2: Tentukan nilai maksimum/minimum tiap kriteria
    let stats = {};
    Object.keys(WEIGHTS).forEach(key => {
        let vals = numeric.map(r => r[key]);
        stats[key] = {
            max: Math.max(...vals),
            min: Math.min(...vals)
        };
    });

    // Step 3: Normalisasi dan hitung nilai SAW
    let results = numeric.map((row, idx) => {
        let weightedSum = 0;
        let normalizationDetails = {};

        Object.keys(WEIGHTS).forEach(key => {
            let value = row[key];
            let max = stats[key].max;
            let min = stats[key].min;

            let normalized = 0;
            if (CRITERIA_TYPE[key] === "benefit") {
                normalized = max === 0 ? 0 : value / max;
            } else {
                normalized = (min === 0 || value === 0) ? 0 : min / value;
            }

            normalizationDetails[key] = {
                value: value,
                max: max,
                min: min,
                normalized: normalized,
                weight: WEIGHTS[key],
                weighted: normalized * WEIGHTS[key]
            };

            weightedSum += normalized * WEIGHTS[key];
        });

        let status = weightedSum >= THRESHOLD.layak ? "Layak" : (weightedSum >= THRESHOLD.dipertimbangkan ? "Dipertimbangkan" : "Tidak Layak");
        
        let risk = "";
        if (weightedSum >= 0.8) risk = "Rendah";
        else if (weightedSum >= 0.6) risk = "Sedang";
        else risk = "Tinggi";

        return {
            ...row,
            id: data[idx].id,
            creditScore: Math.round(weightedSum * 100),
            utilityDegree: weightedSum,
            risk: risk,
            status: status,
            details: normalizationDetails
        };
    }).sort((a, b) => b.utilityDegree - a.utilityDegree);
    
    return results;
}

// ============================================================
// 3. UI RENDERING & ROUTING
// ============================================================

const root = document.getElementById('app-root');

function setPage(page) {
    document.querySelectorAll('.nav-menu button').forEach(b => b.classList.remove('active'));
    let activeBtn = document.getElementById(`btn-${page}`);
    if(activeBtn) activeBtn.classList.add('active');

    switch(page) {
        case 'landing': renderLanding(); break;
        case 'input': renderInput(); break;
        case 'hasil': renderHasil(); break;
        case 'dashboard': renderDashboard(); break;
        case 'riwayat': renderRiwayat(); break;
        case 'settings': renderSettings(); break;
    }
    window.scrollTo(0,0);
}

function renderLanding() {
    root.innerHTML = `
        <section class="hero">
            <h1 style="color: white; font-size: 48px; line-height: 1.2; margin-bottom: 20px; font-weight: 700;">
                Sistem Pendukung Keputusan<br>
                <span style="color: #60A5FA;">Kelayakan Nasabah dalam Pemberian Kredit Bank</span>
            </h1>
            <p style="color: #E5E7EB; font-size: 18px; max-width: 600px; margin-bottom: 32px; line-height: 1.6;">
                Analisis kredit objektif & terstruktur menggunakan metode SAW untuk membantu pengambilan keputusan perbankan secara akurat dan transparan.
            </p>
            <div style="display: flex; gap: 16px;">
                <button class="btn-cta" style="padding: 14px 32px; font-size: 16px; background: #2563EB; color: white; border: none; border-radius: 8px; font-weight: 600;" onclick="setPage('input')">📝 Mulai Analisis</button>
                <button class="btn-cta" style="padding: 14px 32px; font-size: 16px; background: rgba(255,255,255,0.1); color: white; border: 2px solid rgba(255,255,255,0.3); border-radius: 8px; font-weight: 600;" onclick="setPage('dashboard')">📊 Dashboard</button>
            </div>
            
            <div class="grid-4" style="margin-top: 60px; max-width: 900px;">
                <div class="card" style="text-align: center; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px);">
                    <div style="font-size: 32px; margin-bottom: 12px;">📊</div>
                    <h4 style="color: white; margin-bottom: 8px;">5 Kriteria Penilaian</h4>
                    <p style="font-size: 12px; color: #E5E7EB;">Penghasilan, Jaminan, Riwayat Kredit, Tanggungan, Pengeluaran</p>
                </div>
                <div class="card" style="text-align: center; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px);">
                    <div style="font-size: 32px; margin-bottom: 12px;">⚖️</div>
                    <h4 style="color: white; margin-bottom: 8px;">Bobot Dinamis</h4>
                    <p style="font-size: 12px; color: #E5E7EB;">Dapat disesuaikan sesuai kebutuhan bank</p>
                </div>
                <div class="card" style="text-align: center; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(10px);">
                    <div style="font-size: 32px; margin-bottom: 12px;">📐</div>
                    <h4 style="color: white; margin-bottom: 8px;">Transparan</h4>
                    <p style="font-size: 12px; color: #E5E7EB;">Detail perhitungan SAW lengkap</p>
                </div>
            </div>
        </section>
    `;
}

function renderInput() {
    root.innerHTML = `
        <div class="container">
            <h1 style="margin-bottom: 24px;">📝 Input Data Nasabah</h1>
            <div class="card">
                <form id="formNasabah">
                    <div class="grid-4" style="grid-template-columns: 1fr 1fr;">
                        <div class="form-group"><label>Nama Lengkap</label><input type="text" id="nama" required placeholder="Contoh: Budi Santoso"></div>
                        <div class="form-group"><label>NIK (16 Digit)</label><input type="text" id="nik" required maxlength="16"></div>
                        <div class="form-group"><label>Penghasilan Per Bulan (Rp)</label><input type="number" id="penghasilan" required placeholder="Contoh: 8000000"></div>
                        <div class="form-group"><label>Nilai Jaminan/Aset (Rp)</label><input type="number" id="nilai_jaminan" required placeholder="Contoh: 150000000"></div>
                        <div class="form-group"><label>Riwayat Kredit (1-100)</label><input type="number" id="riwayat_kredit" required min="1" max="100" placeholder="Contoh: 85"></div>
                        <div class="form-group"><label>Jumlah Tanggungan (Orang)</label><input type="number" id="tanggungan" required min="0" placeholder="Contoh: 2"></div>
                        <div class="form-group"><label>Pengeluaran Per Bulan (Rp)</label><input type="number" id="pengeluaran" required placeholder="Contoh: 3500000"></div>
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button type="submit" class="btn-cta" style="background: var(--primary); color: white; padding: 12px 30px;">🔍 Proses Analisis</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('formNasabah').onsubmit = async (e) => {
        e.preventDefault();
        
        // Validasi input
        const nama = document.getElementById('nama').value.trim();
        const nik = document.getElementById('nik').value.trim();
        const penghasilan = parseFloat(document.getElementById('penghasilan').value);
        const nilai_jaminan = parseFloat(document.getElementById('nilai_jaminan').value);
        const riwayat_kredit = parseInt(document.getElementById('riwayat_kredit').value);
        const tanggungan = parseInt(document.getElementById('tanggungan').value);
        const pengeluaran = parseFloat(document.getElementById('pengeluaran').value);
        
        if (nama.length < 3) {
            alert('Nama harus minimal 3 karakter');
            return;
        }
        
        if (!/^\d{16}$/.test(nik)) {
            alert('NIK harus 16 digit angka');
            return;
        }
        
        if (penghasilan <= 0) {
            alert('Penghasilan harus lebih dari 0');
            return;
        }
        
        if (nilai_jaminan <= 0) {
            alert('Nilai jaminan harus lebih dari 0');
            return;
        }
        
        if (riwayat_kredit < 1 || riwayat_kredit > 100) {
            alert('Riwayat kredit harus antara 1-100');
            return;
        }
        
        if (tanggungan < 0) {
            alert('Tanggungan tidak boleh negatif');
            return;
        }
        
        if (pengeluaran <= 0) {
            alert('Pengeluaran harus lebih dari 0');
            return;
        }
        
        // Cek NIK duplikat
        const nikExists = nasabahList.some(n => n.nik === nik);
        if (nikExists) {
            alert('NIK sudah terdaftar');
            return;
        }
        
        const newData = {
            nama: nama,
            nik: nik,
            penghasilan: penghasilan,
            nilai_jaminan: nilai_jaminan,
            riwayat_kredit: riwayat_kredit,
            tanggungan: tanggungan,
            pengeluaran: pengeluaran,
            tanggal: new Date().toISOString().split('T')[0]
        };
        
        try {
            // Simpan ke database via API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData)
            });
            
            if (response.ok) {
                const savedData = await response.json();
                // Convert ke format frontend
                const frontendData = {
                    id: savedData.id,
                    nama: savedData.nama,
                    nik: savedData.nik,
                    penghasilan: savedData.penghasilan,
                    nilai_jaminan: savedData.nilai_jaminan,
                    riwayat_kredit: savedData.riwayat_kredit,
                    tanggungan: savedData.tanggungan,
                    pengeluaran: savedData.pengeluaran,
                    tanggal: savedData.tanggal,
                    created_at: savedData.created_at
                };
                
                nasabahList.push(frontendData);
                
                // Hitung hasil khusus untuk data terbaru ini
                const analisis = runSAW([frontendData]);
                lastResult = { nasabah: frontendData, hasil: analisis[0] };
                setPage('hasil');
            } else {
                alert('Gagal menyimpan data: ' + (await response.json()).error);
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert('Gagal menyimpan data. Pastikan server backend berjalan.');
        }
    };
}

function renderHasil() {
    if(!lastResult) { setPage('input'); return; }
    const { nasabah, hasil } = lastResult;
    
    const criteriaLabels = {
        penghasilan: 'Penghasilan',
        riwayatKredit: 'Riwayat Kredit',
        statusPekerjaan: 'Status Pekerjaan',
        lamaBekerja: 'Lama Bekerja',
        tanggungan: 'Tanggungan',
        jumlahPinjaman: 'Jumlah Pinjaman',
        jaminan: 'Jaminan'
    };
    
    root.innerHTML = `
        <div class="container">
            <h1 style="margin-bottom: 24px;">📊 Hasil Analisis Baru</h1>
            <div class="card" style="text-align: center; border-top: 5px solid ${hasil.status === 'Layak' ? '#10b981' : '#f59e0b'}">
                <div style="font-size: 50px;">${hasil.status === 'Layak' ? '✅' : '⚠️'}</div>
                <h2 style="font-size: 32px;">${hasil.status}</h2>
                <p style="color: var(--text-muted)">Keputusan untuk nasabah <b>${nasabah.nama}</b></p>
                <div class="grid-4" style="margin-top: 30px;">
                    <div class="card"><h4>${hasil.creditScore}</h4><p>Credit Score</p></div>
                    <div class="card"><h4>${hasil.utilityDegree.toFixed(4)}</h4><p>Utility Index</p></div>
                    <div class="card"><h4>${hasil.risk}</h4><p>Tingkat Risiko</p></div>
                </div>
                <button class="btn-cta" style="background: var(--secondary); color: white; margin-top: 20px;" onclick="showCalculationDetails(${hasil.id})">📐 Lihat Detail Perhitungan</button>
                <button class="btn-cta" style="background: rgba(255,255,255,0.1); color: white; margin-top: 10px; border: 1px solid white;" onclick="setPage('riwayat')">Lihat Semua Riwayat</button>
            </div>
            
            <div class="card" style="margin-top: 24px;">
                <h3 style="margin-bottom: 16px;">📊 Profil Nasabah (Radar Chart)</h3>
                <div style="height: 400px; position: relative;">
                    <canvas id="radarChart"></canvas>
                </div>
            </div>
        </div>
    `;
    
    // Create Radar Chart
    const radarData = Object.keys(hasil.normalizationDetails).map(key => ({
        label: criteriaLabels[key],
        value: hasil.normalizationDetails[key].normalized,
        weight: hasil.normalizationDetails[key].weight
    }));
    
    new Chart(document.getElementById('radarChart'), {
        type: 'radar',
        data: {
            labels: radarData.map(d => d.label),
            datasets: [{
                label: 'Skor Normalisasi',
                data: radarData.map(d => d.value),
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(37, 99, 235, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(37, 99, 235, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                        stepSize: 0.2
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        }
    });
}

function showCalculationDetails(id) {
    const analysis = runSAW(nasabahList);
    const result = analysis.find(r => r.id === id);
    
    if (!result) return;
    
    const criteriaLabels = {
        penghasilan: 'Penghasilan',
        riwayatKredit: 'Riwayat Kredit',
        statusPekerjaan: 'Status Pekerjaan',
        lamaBekerja: 'Lama Bekerja',
        tanggungan: 'Tanggungan',
        jumlahPinjaman: 'Jumlah Pinjaman',
        jaminan: 'Jaminan'
    };
    
    const criteriaTypeLabels = {
        benefit: 'Benefit (Semakin besar semakin baik)',
        cost: 'Cost (Semakin kecil semakin baik)'
    };
    
    let calculationTable = '';
    Object.keys(result.normalizationDetails).forEach(key => {
        const detail = result.normalizationDetails[key];
        calculationTable += `
            <tr>
                <td><b>${criteriaLabels[key]}</b></td>
                <td>${criteriaTypeLabels[CRITERIA_TYPE[key]]}</td>
                <td>${detail.weight}</td>
                <td>${detail.value}</td>
                <td>${detail.max}</td>
                <td>${detail.min}</td>
                <td>${detail.normalized.toFixed(4)}</td>
                <td><b>${detail.weighted.toFixed(4)}</b></td>
            </tr>
        `;
    });
    
    root.innerHTML = `
        <div class="container">
            <h1 style="margin-bottom: 24px;">📐 Detail Perhitungan SAW</h1>
            <div class="card">
                <h3 style="margin-bottom: 16px;">Nasabah: ${result.nama}</h3>
                <p style="margin-bottom: 20px; color: var(--text-muted);">Utility Index: <b>${result.utilityDegree.toFixed(4)}</b> | Status: <b>${result.status}</b></p>
                
                <div style="overflow-x: auto;">
                    <table style="font-size: 12px;">
                        <thead>
                            <tr>
                                <th>Kriteria</th>
                                <th>Tipe</th>
                                <th>Bobot</th>
                                <th>Nilai</th>
                                <th>Max</th>
                                <th>Min</th>
                                <th>Normalisasi</th>
                                <th>Terbobot</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${calculationTable}
                        </tbody>
                        <tfoot>
                            <tr style="background: #f0f9ff;">
                                <td colspan="7" style="text-align: right; font-weight: bold;">Total Utility Index:</td>
                                <td style="font-weight: bold; color: var(--primary);">${result.utilityDegree.toFixed(4)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div style="margin-top: 24px; padding: 16px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid var(--primary);">
                    <h4 style="margin-bottom: 8px;">📚 Penjelasan Metode SAW:</h4>
                    <ul style="margin-left: 20px; font-size: 13px; line-height: 1.6;">
                        <li><b>Normalisasi Benefit:</b> Nilai / Max (semakin besar semakin baik)</li>
                        <li><b>Normalisasi Cost:</b> Min / Nilai (semakin kecil semakin baik)</li>
                        <li><b>Utility Index:</b> Σ (Normalisasi × Bobot)</li>
                        <li><b>Threshold:</b> ≥ 0.70 = Layak, ≥ 0.45 = Dipertimbangkan, < 0.45 = Tidak Layak</li>
                    </ul>
                </div>
                
                <button class="btn-cta" style="background: var(--primary); color: white; margin-top: 20px;" onclick="setPage('hasil')">← Kembali ke Hasil</button>
            </div>
        </div>
    `;
}

function renderDashboard() {
    // Reload data dari API
    loadDataFromAPI().then(() => {
        const analysis = runSAW(nasabahList);
        const stats = {
            total: nasabahList.length,
            layak: analysis.filter(a => a.status === 'Layak').length,
            timbang: analysis.filter(a => a.status === 'Dipertimbangkan').length,
            tidak: analysis.filter(a => a.status === 'Tidak Layak').length,
        };

        // Hitung rata-rata dan insight
        const avgScore = analysis.length > 0 ? (analysis.reduce((sum, a) => sum + a.creditScore, 0) / analysis.length).toFixed(2) : 0;
        const avgUtility = analysis.length > 0 ? (analysis.reduce((sum, a) => sum + a.utilityDegree, 0) / analysis.length).toFixed(4) : 0;
        const approvalRate = stats.total > 0 ? ((stats.layak / stats.total) * 100).toFixed(1) : 0;

        root.innerHTML = `
            <div class="container">
                <h1 style="margin-bottom: 24px;">📊 Dashboard Statistik</h1>
                
                <!-- Statistik Cards -->
                <div class="grid-4" style="margin-top: 20px;">
                    <div class="card" style="text-align: center; padding: 24px; background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); color: white; border: none;">
                        <h3 style="font-size: 36px; margin-bottom: 8px; color: white;">${stats.total}</h3>
                        <p style="color: rgba(255,255,255,0.9); margin: 0;">Total Nasabah</p>
                    </div>
                    <div class="card" style="text-align: center; padding: 24px; background: #DCFCE7; border: 2px solid #86EFAC;">
                        <h3 style="font-size: 36px; margin-bottom: 8px; color: #166534;">${stats.layak}</h3>
                        <p style="color: var(--text-muted); margin: 0;">Layak Kredit</p>
                    </div>
                    <div class="card" style="text-align: center; padding: 24px; background: #FEF3C7; border: 2px solid #FCD34D;">
                        <h3 style="font-size: 36px; margin-bottom: 8px; color: #92400E;">${stats.timbang}</h3>
                        <p style="color: var(--text-muted); margin: 0;">Dipertimbangkan</p>
                    </div>
                    <div class="card" style="text-align: center; padding: 24px; background: #FEE2E2; border: 2px solid #FCA5A5;">
                        <h3 style="font-size: 36px; margin-bottom: 8px; color: #991B1B;">${stats.tidak}</h3>
                        <p style="color: var(--text-muted); margin: 0;">Tidak Layak</p>
                    </div>
                </div>

                <!-- Insight Cards -->
                <div class="grid-4" style="margin-top: 24px;">
                    <div class="card" style="text-align: center; padding: 20px; border-left: 4px solid var(--primary);">
                        <h3 style="font-size: 28px; margin-bottom: 8px; color: var(--primary);">${avgScore}</h3>
                        <p style="color: var(--text-muted); margin: 0;">Rata-rata Credit Score</p>
                    </div>
                    <div class="card" style="text-align: center; padding: 20px; border-left: 4px solid var(--secondary);">
                        <h3 style="font-size: 28px; margin-bottom: 8px; color: var(--secondary);">${avgUtility}</h3>
                        <p style="color: var(--text-muted); margin: 0;">Rata-rata Utility Index</p>
                    </div>
                    <div class="card" style="text-align: center; padding: 20px; border-left: 4px solid #22C55E;">
                        <h3 style="font-size: 28px; margin-bottom: 8px; color: #22C55E;">${approvalRate}%</h3>
                        <p style="color: var(--text-muted); margin: 0;">Tingkat Approval</p>
                    </div>
                    <div class="card" style="text-align: center; padding: 20px; border-left: 4px solid #F59E0B;">
                        <h3 style="font-size: 28px; margin-bottom: 8px; color: #F59E0B;">5</h3>
                        <p style="color: var(--text-muted); margin: 0;">Kriteria Penilaian</p>
                    </div>
                </div>

                <!-- Charts -->
                <div class="grid-4" style="grid-template-columns: 1fr 1fr; margin-top: 24px;">
                    <div class="card">
                        <h3 style="margin-bottom: 16px;">📈 Distribusi Status</h3>
                        <canvas id="chartStatus" height="200"></canvas>
                    </div>
                    <div class="card">
                        <h3 style="margin-bottom: 16px;">📊 Statistik Kriteria</h3>
                        <canvas id="chartCriteria" height="200"></canvas>
                    </div>
                </div>

                <!-- Top 3 Nasabah -->
                <div class="card" style="margin-top: 24px;">
                    <h3 style="margin-bottom: 16px;">🏆 Top 3 Nasabah Tertinggi</h3>
                    ${analysis.length > 0 ? `
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${analysis.sort((a, b) => b.utilityDegree - a.utilityDegree).slice(0, 3).map((n, i) => `
                                <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: ${i === 0 ? '#FEF3C7' : (i === 1 ? '#F3F4F6' : '#F9FAFB')}; border-radius: 8px; border-left: 4px solid ${i === 0 ? '#F59E0B' : (i === 1 ? '#9CA3AF' : '#6B7280')};">
                                    <div style="font-size: 28px;">${i === 0 ? '🥇' : (i === 1 ? '🥈' : '🥉')}</div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; color: var(--text-main);">${n.nama}</div>
                                        <div style="font-size: 13px; color: var(--text-muted);">${n.nik}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 700; color: #22C55E; font-size: 18px;">${n.utilityDegree.toFixed(4)}</div>
                                        <div style="font-size: 12px; color: var(--text-muted);">Score: ${n.creditScore}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p style="text-align: center; padding: 20px; color: var(--text-muted);">Belum ada data nasabah</p>'}
                </div>
            </div>
        `;

        if (stats.total > 0) {
            // Chart Status
            new Chart(document.getElementById('chartStatus'), {
                type: 'doughnut',
                data: {
                    labels: ['Layak', 'Dipertimbangkan', 'Tidak Layak'],
                    datasets: [{
                        data: [stats.layak, stats.timbang, stats.tidak],
                        backgroundColor: ['#22C55E', '#F59E0B', '#EF4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });

            // Chart Criteria (rata-rata per kriteria)
            const avgPenghasilan = (nasabahList.reduce((sum, n) => sum + n.penghasilan, 0) / nasabahList.length).toFixed(0);
            const avgJaminan = (nasabahList.reduce((sum, n) => sum + n.nilai_jaminan, 0) / nasabahList.length).toFixed(0);
            const avgRiwayat = (nasabahList.reduce((sum, n) => sum + n.riwayat_kredit, 0) / nasabahList.length).toFixed(1);
            const avgTanggungan = (nasabahList.reduce((sum, n) => sum + n.tanggungan, 0) / nasabahList.length).toFixed(1);
            const avgPengeluaran = (nasabahList.reduce((sum, n) => sum + n.pengeluaran, 0) / nasabahList.length).toFixed(0);

            new Chart(document.getElementById('chartCriteria'), {
                type: 'bar',
                data: {
                    labels: ['Penghasilan', 'Jaminan', 'Riwayat', 'Tanggungan', 'Pengeluaran'],
                    datasets: [{
                        label: 'Rata-rata',
                        data: [avgPenghasilan, avgJaminan, avgRiwayat, avgTanggungan, avgPengeluaran],
                        backgroundColor: ['#1E3A8A', '#2563EB', '#60A5FA', '#F59E0B', '#EF4444']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } else {
            document.getElementById('chartStatus').parentElement.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-muted);">Belum ada data untuk ditampilkan</p>';
            document.getElementById('chartCriteria').parentElement.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-muted);">Belum ada data untuk ditampilkan</p>';
        }
    });
}

function generatePDF(id) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Ambil data nasabah
    const nasabah = nasabahList.find(n => n.id === id);
    if (!nasabah) return;
    
    // Run SAW untuk mendapatkan hasil analisis lengkap dengan normalization details
    const analysis = runSAW(nasabahList);
    const hasil = analysis.find(a => a.id === id);
    if (!hasil) return;
    
    // Format angka
    const formatRupiah = (num) => new Intl.NumberFormat('id-ID').format(num);
    
    // Kop surat header
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('LAPORAN ANALISIS KELAYAKAN KREDIT', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Sistem Pendukung Keputusan - Metode SAW (Simple Additive Weighting)', 105, 28, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text(`Nomor: LKP/${new Date().getFullYear()}/${String(id).padStart(4, '0')}`, 20, 38);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, 140, 38);
    
    doc.setFontSize(9);
    doc.text('Bank Kredit Nasional', 20, 46);
    doc.text('Jl. Jendral Sudirman No. 123, Jakarta', 20, 51);
    
    // Garis pemisah ganda
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(20, 55, 190, 55);
    doc.setLineWidth(0.3);
    doc.line(20, 58, 190, 58);
    
    // Informasi Nasabah
    let currentY = 68;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text('I. INFORMASI NASABAH', 20, currentY);
    currentY += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const labelWidth = 45;
    const dataX = 20 + labelWidth;
    
    doc.text('Nama Lengkap', 20, currentY);
    doc.text(`: ${nasabah.nama}`, dataX, currentY);
    currentY += 8;
    
    doc.text('NIK', 20, currentY);
    doc.text(`: ${nasabah.nik}`, dataX, currentY);
    currentY += 8;
    
    doc.text('Tanggal Pengajuan', 20, currentY);
    const tanggal = nasabah.created_at ? new Date(nasabah.created_at).toLocaleString('id-ID') : nasabah.tanggal;
    doc.text(`: ${tanggal}`, dataX, currentY);
    currentY += 8;
    
    doc.text('Penghasilan/Bulan', 20, currentY);
    doc.text(`: Rp ${formatRupiah(nasabah.penghasilan)}`, dataX, currentY);
    currentY += 8;
    
    doc.text('Nilai Jaminan', 20, currentY);
    doc.text(`: Rp ${formatRupiah(nasabah.nilai_jaminan)}`, dataX, currentY);
    currentY += 8;
    
    doc.text('Riwayat Kredit', 20, currentY);
    doc.text(`: ${nasabah.riwayat_kredit}`, dataX, currentY);
    currentY += 8;
    
    doc.text('Jumlah Tanggungan', 20, currentY);
    doc.text(`: ${nasabah.tanggungan}`, dataX, currentY);
    currentY += 8;
    
    doc.text('Pengeluaran/Bulan', 20, currentY);
    doc.text(`: Rp ${formatRupiah(nasabah.pengeluaran)}`, dataX, currentY);
    currentY += 12;
    
    // Hasil Analisis
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('II. HASIL ANALISIS', 20, currentY);
    currentY += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Credit Score', 20, currentY);
    doc.text(`: ${hasil.creditScore}`, dataX, currentY);
    currentY += 8;
    
    doc.text('Utility Index', 20, currentY);
    doc.text(`: ${hasil.utilityDegree.toFixed(4)}`, dataX, currentY);
    currentY += 8;
    
    doc.text('Tingkat Risiko', 20, currentY);
    doc.text(`: ${hasil.risk}`, dataX, currentY);
    currentY += 12;
    
    // Status dengan box
    const statusColor = hasil.status === 'Layak' ? [34, 197, 94] : (hasil.status === 'Dipertimbangkan' ? [245, 158, 11] : [239, 68, 68]);
    doc.setFillColor(...statusColor);
    doc.rect(20, currentY, 170, 14, 'F');
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`KEPUTUSAN: ${hasil.status.toUpperCase()}`, 105, currentY + 10, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    currentY += 22;
    
    // Detail Perhitungan SAW
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('III. DETAIL PERHITUNGAN SAW', 20, currentY);
    currentY += 10;
    
    // Tabel perhitungan
    doc.autoTable({
        startY: currentY,
        startX: 20,
        head: [['No', 'Kriteria', 'Bobot', 'Tipe', 'Nilai', 'Max/Min', 'Normalisasi', 'Nilai Tertimbang']],
        body: [
            ['1', 'Penghasilan (C1)', '0.30', 'Benefit', formatRupiah(nasabah.penghasilan), formatRupiah(hasil.details?.penghasilan?.max || 0), (hasil.details?.penghasilan?.normalized || 0).toFixed(4), (hasil.details?.penghasilan?.weighted || 0).toFixed(4)],
            ['2', 'Jaminan (C2)', '0.20', 'Benefit', formatRupiah(nasabah.nilai_jaminan), formatRupiah(hasil.details?.nilai_jaminan?.max || 0), (hasil.details?.nilai_jaminan?.normalized || 0).toFixed(4), (hasil.details?.nilai_jaminan?.weighted || 0).toFixed(4)],
            ['3', 'Riwayat Kredit (C3)', '0.25', 'Benefit', nasabah.riwayat_kredit, hasil.details?.riwayat_kredit?.max || '-', (hasil.details?.riwayat_kredit?.normalized || 0).toFixed(4), (hasil.details?.riwayat_kredit?.weighted || 0).toFixed(4)],
            ['4', 'Tanggungan (C4)', '0.15', 'Cost', nasabah.tanggungan, hasil.details?.tanggungan?.min || '-', (hasil.details?.tanggungan?.normalized || 0).toFixed(4), (hasil.details?.tanggungan?.weighted || 0).toFixed(4)],
            ['5', 'Pengeluaran (C5)', '0.10', 'Cost', formatRupiah(nasabah.pengeluaran), formatRupiah(hasil.details?.pengeluaran?.min || 0), (hasil.details?.pengeluaran?.normalized || 0).toFixed(4), (hasil.details?.pengeluaran?.weighted || 0).toFixed(4)],
            ['', '', '', '', '', '', 'TOTAL', hasil.utilityDegree.toFixed(4)]
        ],
        theme: 'grid',
        headStyles: { 
            fillColor: [0, 0, 0], 
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 9,
            cellPadding: 3
        },
        styles: { 
            fontSize: 8,
            cellPadding: 3,
            textColor: [0, 0, 0],
            lineColor: [0, 0, 0],
            lineWidth: 0.1
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 32 },
            2: { cellWidth: 14, halign: 'center' },
            3: { cellWidth: 14, halign: 'center' },
            4: { cellWidth: 32 },
            5: { cellWidth: 28 },
            6: { cellWidth: 22, halign: 'center' },
            7: { cellWidth: 26, halign: 'right' }
        }
    });
    
    currentY = doc.lastAutoTable.finalY + 15;
    
    // Kesimpulan
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('IV. KESIMPULAN', 20, currentY);
    currentY += 10;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const kesimpulan = hasil.status === 'Layak' 
        ? 'Berdasarkan hasil perhitungan metode SAW dengan 5 kriteria penilaian (Penghasilan, Jaminan, Riwayat Kredit, Tanggungan, dan Pengeluaran), nasabah dinyatakan LAYAK untuk mendapatkan kredit dengan tingkat risiko rendah. Nasabah memiliki profil keuangan yang baik dan memenuhi persyaratan kelayakan kredit.'
        : (hasil.status === 'Dipertimbangkan' 
            ? 'Berdasarkan hasil perhitungan metode SAW dengan 5 kriteria penilaian (Penghasilan, Jaminan, Riwayat Kredit, Tanggungan, dan Pengeluaran), nasabah perlu DIPERTIMBANGKAN lebih lanjut sebelum persetujuan kredit. Beberapa aspek perlu dievaluasi tambahan untuk memastikan kelayakan kredit.'
            : 'Berdasarkan hasil perhitungan metode SAW dengan 5 kriteria penilaian (Penghasilan, Jaminan, Riwayat Kredit, Tanggungan, dan Pengeluaran), nasabah dinyatakan TIDAK LAYAK untuk mendapatkan kredit karena tingkat risiko tinggi. Nasabah tidak memenuhi persyaratan kelayakan kredit berdasarkan evaluasi yang dilakukan.');
    
    const splitKesimpulan = doc.splitTextToSize(kesimpulan, 160);
    doc.text(splitKesimpulan, 20, currentY);
    currentY += splitKesimpulan.length * 5 + 15;
    
    // Tanda tangan
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Demikian laporan ini dibuat untuk dipergunakan sebagaimana mestinya.', 20, currentY);
    currentY += 25;
    
    // Signature boxes
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    
    // Left signature
    doc.text('Hormat kami,', 20, currentY);
    doc.line(20, currentY + 25, 70, currentY + 25);
    doc.text('Petugas Analisis', 20, currentY + 30);
    
    // Right signature
    doc.text('Mengetahui,', 130, currentY);
    doc.line(130, currentY + 25, 180, currentY + 25);
    doc.text('Kepala Bagian Kredit', 130, currentY + 30);
    
    // Tempat dan tanggal
    const tempatTanggal = `Jakarta, ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    doc.text(tempatTanggal, 105, currentY - 5, { align: 'center' });
    
    // Save PDF
    doc.save(`Laporan_Kredit_${nasabah.nama}_${nasabah.nik}.pdf`);
}

function renderRiwayat() {
    // Reload data dari API
    loadDataFromAPI().then(() => {
        const analysis = runSAW(nasabahList);
        root.innerHTML = `
            <div class="container">
                <h1>📋 Riwayat Pengajuan</h1>
                <div class="card" style="margin-top: 20px;">
                    <div style="display: flex; gap: 16px; margin-bottom: 20px;">
                        <input type="text" id="searchInput" placeholder="🔍 Cari nama atau NIK..." style="flex: 1; padding: 10px 14px; border: 1px solid var(--border); border-radius: 10px;">
                        <select id="filterStatus" style="padding: 10px 14px; border: 1px solid var(--border); border-radius: 10px;">
                            <option value="">Semua Status</option>
                            <option value="Layak">Layak</option>
                            <option value="Dipertimbangkan">Dipertimbangkan</option>
                            <option value="Tidak Layak">Tidak Layak</option>
                        </select>
                    </div>
                </div>
                <div class="card" style="padding: 0; overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Kredit Score</th>
                                <th>Utility Index</th>
                                <th>Status</th>
                                <th>Tanggal & Jam</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="riwayatTable">
                            ${analysis.map(n => `
                                <tr data-nama="${n.nama.toLowerCase()}" data-nik="${n.nik}" data-status="${n.status}">
                                    <td><b>${n.nama}</b><br><small>${n.nik}</small></td>
                                    <td>${n.creditScore}</td>
                                    <td>${n.utilityDegree.toFixed(4)}</td>
                                    <td><span class="badge ${n.status === 'Layak' ? 'badge-layak' : (n.status === 'Dipertimbangkan' ? 'badge-timbang' : 'badge-tidak')}">${n.status}</span></td>
                                    <td>${n.created_at ? new Date(n.created_at).toLocaleString('id-ID') : n.tanggal}</td>
                                    <td>
                                        <button onclick="generatePDF(${n.id})" style="color: var(--secondary); border:none; background:none; cursor:pointer; margin-right: 8px;">📄 PDF</button>
                                        <button onclick="editData(${n.id})" style="color: var(--primary); border:none; background:none; cursor:pointer; margin-right: 8px;">Edit</button>
                                        <button onclick="deleteData(${n.id})" style="color: red; border:none; background:none; cursor:pointer;">Hapus</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${analysis.length === 0 ? '<p style="padding: 20px; text-align:center">Belum ada data nasabah.</p>' : ''}
                </div>
                <button class="btn-cta" style="background: var(--success); color: white; margin-top: 20px;" onclick="exportToCSV()">📥 Export ke CSV</button>
            </div>
        `;
        
        // Add search and filter functionality
        document.getElementById('searchInput').addEventListener('input', filterRiwayat);
        document.getElementById('filterStatus').addEventListener('change', filterRiwayat);
    });
}

function filterRiwayat() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterStatus = document.getElementById('filterStatus').value;
    const rows = document.querySelectorAll('#riwayatTable tr');
    
    rows.forEach(row => {
        const nama = row.dataset.nama;
        const nik = row.dataset.nik;
        const status = row.dataset.status;
        
        const matchesSearch = nama.includes(searchTerm) || nik.includes(searchTerm);
        const matchesStatus = filterStatus === '' || status === filterStatus;
        
        row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
}

function exportToCSV() {
    const analysis = runSAW(nasabahList);
    if (analysis.length === 0) {
        alert('Tidak ada data untuk diexport');
        return;
    }
    
    const headers = ['Nama', 'NIK', 'Penghasilan', 'Nilai Jaminan', 'Riwayat Kredit', 'Tanggungan', 'Pengeluaran', 'Utility Index', 'Credit Score', 'Status', 'Tanggal'];
    
    // Format data untuk Excel (gunakan semicolon sebagai delimiter untuk Excel Indonesia)
    const csvContent = [
        headers.join(';'),
        ...analysis.map(n => [
            `"${n.nama}"`, // Quote nama untuk handle spasi
            `"${n.nik}"`,
            n.penghasilan,
            n.nilai_jaminan,
            n.riwayat_kredit,
            n.tanggungan,
            n.pengeluaran,
            n.utilityDegree.toFixed(4),
            n.creditScore,
            `"${n.status}"`,
            `"${n.created_at ? new Date(n.created_at).toLocaleString('id-ID') : n.tanggal}"`
        ].join(';'))
    ].join('\n');
    
    // Tambah BOM (Byte Order Mark) untuk UTF-8 agar Excel bisa membaca dengan benar
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_nasabah_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

async function editData(id) {
    const nasabah = nasabahList.find(n => n.id === id);
    if (!nasabah) return;
    
    root.innerHTML = `
        <div class="container">
            <h1 style="margin-bottom: 24px;">✏️ Edit Data Nasabah</h1>
            <div class="card">
                <form id="formEditNasabah">
                    <div class="grid-4" style="grid-template-columns: 1fr 1fr;">
                        <div class="form-group"><label>Nama Lengkap</label><input type="text" id="editNama" required value="${nasabah.nama}"></div>
                        <div class="form-group"><label>NIK (16 Digit)</label><input type="text" id="editNik" required maxlength="16" value="${nasabah.nik}"></div>
                        <div class="form-group"><label>Penghasilan Per Bulan (Rp)</label><input type="number" id="editPenghasilan" required value="${nasabah.penghasilan}"></div>
                        <div class="form-group"><label>Nilai Jaminan/Aset (Rp)</label><input type="number" id="editNilaiJaminan" required value="${nasabah.nilai_jaminan}"></div>
                        <div class="form-group"><label>Riwayat Kredit (1-100)</label><input type="number" id="editRiwayatKredit" required min="1" max="100" value="${nasabah.riwayat_kredit}"></div>
                        <div class="form-group"><label>Jumlah Tanggungan (Orang)</label><input type="number" id="editTanggungan" required min="0" value="${nasabah.tanggungan}"></div>
                        <div class="form-group"><label>Pengeluaran Per Bulan (Rp)</label><input type="number" id="editPengeluaran" required value="${nasabah.pengeluaran}"></div>
                    </div>
                    <div style="text-align: right; margin-top: 20px;">
                        <button type="button" class="btn-cta" style="background: #64748b; color: white; margin-right: 10px;" onclick="setPage('riwayat')">Batal</button>
                        <button type="submit" class="btn-cta" style="background: #2563eb; color: white;">💾 Simpan Perubahan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('formEditNasabah').onsubmit = async (e) => {
        e.preventDefault();
        const updatedData = {
            nama: document.getElementById('editNama').value,
            nik: document.getElementById('editNik').value,
            penghasilan: document.getElementById('editPenghasilan').value,
            nilai_jaminan: document.getElementById('editNilaiJaminan').value,
            riwayat_kredit: document.getElementById('editRiwayatKredit').value,
            tanggungan: document.getElementById('editTanggungan').value,
            pengeluaran: document.getElementById('editPengeluaran').value
        };
        
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
            
            if (response.ok) {
                const savedData = await response.json();
                const frontendData = {
                    id: savedData.id,
                    nama: savedData.nama,
                    nik: savedData.nik,
                    penghasilan: savedData.penghasilan,
                    nilai_jaminan: savedData.nilai_jaminan,
                    riwayat_kredit: savedData.riwayat_kredit,
                    tanggungan: savedData.tanggungan,
                    pengeluaran: savedData.pengeluaran,
                    tanggal: savedData.tanggal,
                    created_at: savedData.created_at
                };
                
                const index = nasabahList.findIndex(n => n.id === id);
                nasabahList[index] = frontendData;
                alert('Data berhasil diupdate!');
                renderRiwayat();
            } else {
                alert('Gagal mengupdate data: ' + (await response.json()).error);
            }
        } catch (error) {
            console.error('Error updating data:', error);
            alert('Gagal mengupdate data. Pastikan server backend berjalan.');
        }
    };
}

function renderSettings() {
    const criteriaLabels = {
        penghasilan: 'Penghasilan Per Bulan (C1)',
        nilai_jaminan: 'Nilai Jaminan/Aset (C2)',
        riwayat_kredit: 'Riwayat Kredit (C3)',
        tanggungan: 'Jumlah Tanggungan (C4)',
        pengeluaran: 'Pengeluaran Per Bulan (C5)'
    };
    
    root.innerHTML = `
        <div class="container">
            <h1 style="margin-bottom: 24px;">⚙️ Pengaturan Bobot Kriteria</h1>
            <div class="card">
                <p style="margin-bottom: 20px; color: var(--text-muted);">Atur bobot untuk setiap kriteria penilaian. Total bobot harus sama dengan 1.0 (100%).</p>
                
                <form id="formWeights">
                    <div class="grid-4" style="grid-template-columns: 1fr 1fr;">
                        ${Object.keys(WEIGHTS).map(key => `
                            <div class="form-group">
                                <label>${criteriaLabels[key]}</label>
                                <input type="number" 
                                       id="weight_${key}" 
                                       step="0.01" 
                                       min="0" 
                                       max="1" 
                                       value="${WEIGHTS[key]}" 
                                       required
                                       onchange="validateWeights()">
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="margin-top: 20px; padding: 16px; background: ${Object.values(WEIGHTS).reduce((a, b) => a + b, 0) === 1 ? '#DCFCE7' : '#FEE2E2'}; border-radius: 8px; border-left: 4px solid ${Object.values(WEIGHTS).reduce((a, b) => a + b, 0) === 1 ? 'var(--success)' : 'var(--danger)'};">
                        <strong>Total Bobot: <span id="totalWeight">${Object.values(WEIGHTS).reduce((a, b) => a + b, 0).toFixed(2)}</span></strong>
                        <p style="font-size: 12px; margin-top: 4px;">${Object.values(WEIGHTS).reduce((a, b) => a + b, 0) === 1 ? '✅ Bobot valid' : '❌ Total harus 1.0'}</p>
                    </div>
                    
                    <div style="text-align: right; margin-top: 20px;">
                        <button type="button" class="btn-cta" style="background: #6B7280; color: white; margin-right: 10px;" onclick="resetWeights()">Reset Default</button>
                        <button type="submit" class="btn-cta" style="background: var(--primary); color: white;">💾 Simpan Bobot</button>
                    </div>
                </form>
            </div>
            
            <div class="card" style="margin-top: 24px;">
                <h3 style="margin-bottom: 16px;">📚 Penjelasan Kriteria</h3>
                <div style="font-size: 13px; line-height: 1.8;">
                    <p><b>C1: Penghasilan Per Bulan (30%):</b> Semakin tinggi penghasilan, semakin baik untuk kelayakan kredit (Benefit).</p>
                    <p><b>C2: Nilai Jaminan/Aset (20%):</b> Semakin tinggi nilai jaminan, risiko bank semakin rendah (Benefit).</p>
                    <p><b>C3: Riwayat Kredit (25%):</b> Skor berdasarkan pembayaran di masa lalu, semakin tinggi semakin baik (Benefit).</p>
                    <p><b>C4: Jumlah Tanggungan (15%):</b> Semakin banyak tanggungan, kemampuan bayar biasanya menurun (Cost).</p>
                    <p><b>C5: Pengeluaran Per Bulan (10%):</b> Semakin besar pengeluaran rutin, sisa dana untuk cicilan semakin kecil (Cost).</p>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('formWeights').onsubmit = (e) => {
        e.preventDefault();
        const total = parseFloat(document.getElementById('totalWeight').textContent);
        
        if (Math.abs(total - 1.0) > 0.01) {
            alert('Total bobot harus sama dengan 1.0 (100%)');
            return;
        }
        
        Object.keys(WEIGHTS).forEach(key => {
            WEIGHTS[key] = parseFloat(document.getElementById(`weight_${key}`).value);
        });
        
        alert('Bobot berhasil disimpan! Perhitungan akan menggunakan bobot baru.');
    };
}

function validateWeights() {
    let total = 0;
    Object.keys(WEIGHTS).forEach(key => {
        total += parseFloat(document.getElementById(`weight_${key}`).value) || 0;
    });
    
    const totalElement = document.getElementById('totalWeight');
    const container = totalElement.parentElement;
    
    totalElement.textContent = total.toFixed(2);
    
    if (Math.abs(total - 1.0) <= 0.01) {
        container.style.background = '#d1fae5';
        container.style.borderLeftColor = '#10b981';
        container.querySelector('p').textContent = '✅ Bobot valid';
    } else {
        container.style.background = '#fee2e2';
        container.style.borderLeftColor = '#ef4444';
        container.querySelector('p').textContent = '❌ Total harus 1.0';
    }
}

function resetWeights() {
    const defaultWeights = {
        penghasilan: 0.30,
        nilai_jaminan: 0.20,
        riwayat_kredit: 0.25,
        tanggungan: 0.15,
        pengeluaran: 0.10
    };
    
    Object.keys(defaultWeights).forEach(key => {
        WEIGHTS[key] = defaultWeights[key];
        document.getElementById(`weight_${key}`).value = defaultWeights[key];
    });
    
    validateWeights();
}

async function deleteData(id) {
    if(confirm('Hapus data nasabah ini secara permanen?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                nasabahList = nasabahList.filter(n => n.id !== id);
                renderRiwayat();
            } else {
                alert('Gagal menghapus data');
            }
        } catch (error) {
            console.error('Error deleting data:', error);
            alert('Gagal menghapus data. Pastikan server backend berjalan.');
        }
    }
}

// Jalankan Halaman Pertama
setPage('landing');