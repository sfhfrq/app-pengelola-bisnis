<#
    Menjalankan App Pengelola Bisnis di komputer sendiri.

    Pemakaian:
        Klik dua kali  jalankan.bat
        atau di PowerShell:  .\jalankan.ps1

    Skrip ini:
      1. memeriksa Node.js, MySQL, dan berkas konfigurasi
      2. memasang dependensi kalau belum ada
      3. menjalankan backend dan frontend di jendela terpisah
      4. membuka browser

    Aman dijalankan berulang: kalau backend/frontend sudah jalan,
    bagian itu dilewati, bukan dinyalakan dua kali (yang akan
    menyebabkan error "port sudah dipakai").

    Opsi:
        -Otomatis   tanpa membuka browser dan tanpa menunggu tombol
                    (dipakai untuk pengujian otomatis)
#>

param([switch]$Otomatis)

$ErrorActionPreference = "Continue"

$akar          = $PSScriptRoot
$folderBackend = Join-Path $akar "Backend"
$folderFrontend= Join-Path $akar "Frontend"

function Baris($teks, $warna = "Gray") { Write-Host $teks -ForegroundColor $warna }
function Info($teks)  { Baris "  $teks" }
function Ok($teks)    { Baris "  [v] $teks" "Green" }
function Ingat($teks) { Baris "  [!] $teks" "Yellow" }
function Salah($teks) { Baris "  [X] $teks" "Red" }

# Memeriksa apakah ada yang mendengarkan di port tersebut.
function PortTerpakai([int]$port) {
    try {
        $klien = New-Object System.Net.Sockets.TcpClient
        $klien.Connect("127.0.0.1", $port)
        $klien.Close()
        return $true
    } catch {
        return $false
    }
}

function TungguHttp([string]$url, [int]$detikMaks = 40) {
    $batas = (Get-Date).AddSeconds($detikMaks)
    while ((Get-Date) -lt $batas) {
        try {
            $r = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 3
            if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { return $true }
        } catch { }
        Start-Sleep -Milliseconds 700
    }
    return $false
}

Baris ""
Baris "==========================================================" "Cyan"
Baris "   App Pengelola Bisnis - menjalankan di komputer sendiri" "Cyan"
Baris "==========================================================" "Cyan"
Baris ""

# ---------------------------------------------------------------
# 1. Node.js
# ---------------------------------------------------------------
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Salah "Node.js tidak ditemukan."
    Info  "Pasang dulu dari https://nodejs.org (pilih versi LTS), lalu jalankan ulang."
    if (-not $Otomatis) { Read-Host "Tekan Enter untuk menutup" | Out-Null }
    exit 1
}
Ok "Node.js $(node -v)  |  npm $(npm -v)"

# ---------------------------------------------------------------
# 2. Berkas konfigurasi backend
# ---------------------------------------------------------------
$envBackend = Join-Path $folderBackend ".env"
if (-not (Test-Path -LiteralPath $envBackend)) {
    $contoh = Join-Path $folderBackend ".env.example"
    if (Test-Path -LiteralPath $contoh) {
        Copy-Item -LiteralPath $contoh -Destination $envBackend
        Ingat "Backend\.env dibuat dari contoh."
        Info  "Kalau password MySQL Anda tidak kosong, buka Backend\.env dan isi DB_PASSWORD."
    } else {
        Salah "Backend\.env tidak ada dan .env.example juga tidak ditemukan."
        if (-not $Otomatis) { Read-Host "Tekan Enter untuk menutup" | Out-Null }
        exit 1
    }
} else {
    Ok "Backend\.env ada"
}

# ---------------------------------------------------------------
# 3. MySQL
# ---------------------------------------------------------------
if (PortTerpakai 3306) {
    Ok "MySQL aktif di port 3306"
} else {
    Ingat "MySQL TIDAK terdeteksi di port 3306."
    Info  "Nyalakan dulu: buka XAMPP/Laragon lalu Start MySQL,"
    Info  "atau jalankan layanan MySQL di Windows (services.msc)."
    Baris ""
    Ingat "Tanpa MySQL, login akan gagal. Skrip dihentikan."
    if (-not $Otomatis) { Read-Host "Tekan Enter untuk menutup" | Out-Null }
    exit 1
}

# ---------------------------------------------------------------
# 4. Dependensi
# ---------------------------------------------------------------
foreach ($bagian in @(
    @{ nama = "backend";  folder = $folderBackend },
    @{ nama = "frontend"; folder = $folderFrontend }
)) {
    if (Test-Path -LiteralPath (Join-Path $bagian.folder "node_modules")) {
        Ok "Dependensi $($bagian.nama) sudah terpasang"
    } else {
        Info "Memasang dependensi $($bagian.nama) (butuh beberapa menit)..."
        Push-Location $bagian.folder
        & npm install --no-audit --no-fund
        Pop-Location
        Ok "Dependensi $($bagian.nama) selesai"
    }
}

# ---------------------------------------------------------------
# 5. Backend
# ---------------------------------------------------------------
Baris ""
if (PortTerpakai 3000) {
    Ok "Backend sudah jalan di port 3000 (dilewati)"
} else {
    Info "Menjalankan backend..."
    # -WorkingDirectory dipakai supaya npm start berjalan di folder yang benar.
    # Cara ini menghindari masalah tanda kutip pada path yang mengandung spasi.
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "npm start" -WorkingDirectory $folderBackend

    if (TungguHttp "http://localhost:3000/") {
        Ok "Backend siap -> http://localhost:3000"
    } else {
        Salah "Backend belum merespons. Lihat jendela 'cmd' yang baru terbuka"
        Info  "untuk membaca pesan errornya (biasanya soal koneksi MySQL)."
        if (-not $Otomatis) { Read-Host "Tekan Enter untuk menutup" | Out-Null }
        exit 1
    }
}

# ---------------------------------------------------------------
# 6. Uji cepat: apakah database sudah berisi akun?
# ---------------------------------------------------------------
try {
    $masuk = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
        -Method Post -ContentType "application/json" `
        -Body '{"nama":"admin","password":"admin123"}' -TimeoutSec 8
    Ok "Database terhubung - login 'admin' berhasil (peran: $($masuk.user.role))"
} catch {
    Ingat "Backend jalan, tetapi login gagal."
    Info  "Kemungkinan tabel belum dibuat. Jalankan sekali:"
    Info  "    cd Backend"
    Info  "    npm run db:setup"
}

# ---------------------------------------------------------------
# 7. Frontend
# ---------------------------------------------------------------
Baris ""
if (PortTerpakai 5173) {
    Ok "Frontend sudah jalan di port 5173 (dilewati)"
} else {
    Info "Menjalankan frontend..."
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "npm run dev" -WorkingDirectory $folderFrontend

    if (TungguHttp "http://localhost:5173/") {
        Ok "Frontend siap -> http://localhost:5173"
    } else {
        Salah "Frontend belum merespons. Lihat jendela 'cmd' yang baru terbuka."
        if (-not $Otomatis) { Read-Host "Tekan Enter untuk menutup" | Out-Null }
        exit 1
    }
}

# ---------------------------------------------------------------
# 8. Selesai
# ---------------------------------------------------------------
Baris ""
Baris "==========================================================" "Cyan"
Baris "   Siap dipakai" "Green"
Baris "==========================================================" "Cyan"
Info  "Alamat   : http://localhost:5173"
Info  "Login    : admin / admin123   atau   budi / budi123"
Info  "API      : http://localhost:3000"
Baris ""
Info  "Untuk menghentikan: tutup dua jendela 'cmd' yang baru terbuka,"
Info  "atau tekan Ctrl+C di masing-masing jendela."
Baris ""

if (-not $Otomatis) {
    Start-Process "http://localhost:5173"
    Read-Host "Tekan Enter untuk menutup jendela ini" | Out-Null
}
