# Panduan Deploy — App Pengelola Bisnis

Tujuan: situs bisa dibuka siapa saja lewat internet, **tanpa laptop Anda menyala**.

---

## 1. Gambaran arsitektur

```
                    GitHub Pages (gratis, statis)
   Pengunjung  ──▶  https://<username>.github.io/<nama-repo>/
                              │
                              │  fetch  .../api/...  (lintas origin, perlu CORS)
                              ▼
                    Render — Web Service (gratis, Node.js)
                    https://<nama-backend>.onrender.com
                              │
                              │  mysql2 + TLS
                              ▼
                    MySQL cloud (TiDB Cloud / Aiven / Railway / ...)
```

Repositori GitHub menyimpan kodenya. GitHub Actions membangun frontend dan
menerbitkannya ke GitHub Pages setiap kali Anda push.

---

## 2. Tiga fakta penting sebelum mulai

Baca ini dulu supaya tidak kecewa di tengah jalan.

| Fakta | Konsekuensi |
|---|---|
| **GitHub Pages hanya menyajikan berkas statis.** Ia tidak bisa menjalankan Express maupun MySQL. | Backend wajib di-host terpisah (Render). Itu sebabnya perlu CORS. |
| **Free web service Render tidur setelah 15 menit tidak ada yang mengakses,** lalu butuh sekitar **1 menit** untuk bangun saat diakses lagi. | Pengunjung pertama setelah situs lama sepi akan menunggu ~1 menit. Ini normal di paket gratis. |
| **Render tidak menyediakan MySQL gratis.** Yang gratis hanya PostgreSQL, dan itu pun kedaluwarsa 30 hari. | Anda perlu MySQL dari penyedia lain. Jangan pakai PostgreSQL — kode ini memakai `mysql2`. |

Free tier penyedia cloud **sering berubah**. Angka di atas berasal dari
[artikel Render](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026)
(April 2026). Selalu cek halaman harga resmi sebelum memutuskan.

---

## 3. Prasyarat

- Akun GitHub
- Akun Render (<https://dashboard.render.com/register>) — tidak perlu kartu kredit
- Akun salah satu penyedia MySQL cloud (lihat Langkah 1)
- Git sudah terpasang (sudah ada di laptop ini)

---

## 4. Langkah 1 — Siapkan MySQL cloud

Pilih **salah satu**. Buat instance MySQL, lalu catat lima nilai ini:

```
host, port, user, password, nama database
```

| Pilihan | Kelebihan | Catatan |
|---|---|---|
| **Aiven for MySQL** | MySQL asli — skema dijamin cocok | Cek ketersediaan paket gratis saat ini |
| **TiDB Cloud Serverless** | Ada paket gratis, kompatibel MySQL | Bukan MySQL asli; sebagian detail (collation, CHECK) bisa beda |
| **Railway MySQL** | MySQL asli, paling mudah | Kredit gratis $1/bulan **tidak cukup** untuk online 24 jam |

> Kalau penyedia yang Anda pilih menolak sebagian `database/schema.sql`
> (misalnya soal `COLLATE utf8mb4_general_ci` atau `CHECK`), beri tahu saya —
> skema bisa disesuaikan tanpa mengubah kode aplikasi.

**Penting:** sebagian besar penyedia mewajibkan TLS. Kalau begitu, nanti set
`DB_SSL=true`. Kalau penyedia memakai sertifikat CA sendiri, unduh berkas CA-nya
dan arahkan `DB_SSL_CA` ke path berkas itu.

---

## 5. Langkah 2 — Deploy backend ke Render

### Cara A — lewat blueprint (lebih cepat)

1. Buka <https://dashboard.render.com/> → **New +** → **Blueprint**
2. Pilih repositori ini → **Apply**
3. Render membaca `render.yaml` dan membuat web service `pengelola-bisnis-api`
4. Isi variabel yang diminta (yang bertanda `sync: false`):

| Variabel | Nilai |
|---|---|
| `DB_HOST` | host MySQL dari Langkah 1 |
| `DB_USER` | user MySQL |
| `DB_PASSWORD` | password MySQL |
| `DB_NAME` | nama database |
| `CORS_ORIGIN` | `https://<username>.github.io` — **tanpa path, tanpa garis miring** |

`JWT_SECRET` dibuat otomatis dengan nilai acak. Bagus, biarkan.

### Cara B — manual (kalau blueprint gagal)

**New +** → **Web Service** → pilih repo → isi:

| Kolom | Nilai |
|---|---|
| Name | `pengelola-bisnis-api` |
| Language | `Node` |
| Root Directory | `Backend` |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Instance Type | `Free` |
| Health Check Path | `/` |

Lalu tambahkan Environment Variables seperti tabel di atas, ditambah:

| Variabel | Nilai |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `DB_PORT` | `3306` |
| `DB_SSL` | `true` (kalau penyedia mewajibkan TLS) |
| `DB_POOL_LIMIT` | `5` |

### ⚠️ Soal `CORS_ORIGIN` — kesalahan yang paling sering terjadi

Header `Origin` yang dikirim browser **tidak memuat path**. Untuk situs
`https://budi.github.io/app-pengelola-bisnis/`, yang dikirim adalah:

```
Origin: https://budi.github.io
```

Jadi isi `CORS_ORIGIN` dengan `https://budi.github.io` — **bukan**
`https://budi.github.io/app-pengelola-bisnis`.

Kalau salah, gejalanya: situs terbuka, login ditekan, lalu muncul
"Tidak bisa terhubung ke server" dan di Console browser ada pesan CORS.

Setelah selesai, catat URL backend Anda, misalnya:
`https://pengelola-bisnis-api.onrender.com`

---

## 6. Langkah 3 — Isi struktur tabel di database cloud

Database cloud masih kosong. Jalankan skrip ini **dari laptop** — ia akan
menyambung ke database cloud, membuat tabel, dan mengisi akun awal.

1. Salin contoh konfigurasi:

   ```bash
   cd Backend
   cp .env.example .env
   ```

2. Edit `Backend/.env`, isi dengan kredensial **cloud** (bukan localhost):

   ```ini
   DB_HOST=<host cloud>
   DB_PORT=3306
   DB_USER=<user cloud>
   DB_PASSWORD=<password cloud>
   DB_NAME=<nama database>
   DB_SSL=true
   JWT_SECRET=<nilai acak, boleh yang sama dengan di Render>
   ```

3. Jalankan:

   ```bash
   npm run db:setup
   ```

   Hasil yang benar kira-kira:

   ```
   [db] Menyiapkan database "..." di ... (TLS: ya)
   [db] Struktur tabel siap (4 pernyataan).
   [db] Data awal dimasukkan (2 pernyataan).
   [db] Ringkasan: admin/admin, budi/kasir
   [db] Selesai.
   ```

4. Cek backend sudah hidup:

   ```bash
   curl https://pengelola-bisnis-api.onrender.com/
   # {"pesan":"App Pengelola Bisnis berjalan"}
   ```

   Kalau ini gagal, kemungkinan besar `DB_SSL` belum `true`.

**Opsional** — kalau ingin dashboard terisi contoh data:

```bash
npm run demo:pasang     # pasang data demo (id 900+, aman)
npm run demo:hapus      # hapus lagi kapan saja
```

---

## 7. Langkah 4 — Beri tahu frontend alamat backend

1. Buka repo di GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Tab **Variables** → **New repository variable**

| Name | Value |
|---|---|
| `VITE_API_BASE` | `https://pengelola-bisnis-api.onrender.com/api` |

Perhatikan ada `/api` di belakangnya.

> GitHub Pages **bukan** tempat yang tepat untuk menyimpan ini sebagai Secret.
> Alamat API memang terlihat publik di bundle — itu wajar dan bukan rahasia.

---

## 8. Langkah 5 — Terbitkan frontend ke GitHub Pages

1. **Settings** → **Pages** → bagian **Build and deployment** → **Source**:
   pilih **GitHub Actions**

   *(Workflow sudah mencoba menyalakan ini otomatis. Langkah manual ini
   sebagai cadangan kalau deploy pertama gagal.)*

2. Buka tab **Actions** → pilih **Deploy Frontend ke GitHub Pages** →
   **Run workflow** → **Run workflow**

3. Tunggu ±1 menit. Setelah hijau, situs Anda ada di:

   ```
   https://<username>.github.io/<nama-repo>/
   ```

Setiap kali Anda push perubahan di folder `Frontend/`, workflow ini berjalan
sendiri dan situs ikut diperbarui.

---

## 9. Langkah 6 — Verifikasi

Buka URL GitHub Pages Anda, lalu pastikan:

- [ ] Halaman login tampil dengan logo dan font yang benar
- [ ] Login sebagai `admin` / `admin123` berhasil
- [ ] Enam kartu Quick Stats menampilkan angka
- [ ] Grafik dan tabel terisi
- [ ] Buka satu produk dengan tombol **Tambah** → tersimpan (berarti jalur tulis juga jalan)
- [ ] **Transaksi → Transaksi Baru** → pilih produk, isi nama pembeli, simpan →
      rincian transaksi muncul beserta itemnya (berarti `detail_transaksi` terisi)
- [ ] Di rincian itu, coba **Batalkan Transaksi** → status jadi Dibatalkan
- [ ] Buka Console browser (F12) → tidak ada error CORS merah

Kalau kartu statistik berisi angka nol semua, itu bukan error — begitulah
keadaan database baru yang belum punya data.

---

## 10. 🔒 Keamanan — WAJIB dibaca

Situs Anda sekarang **terbuka untuk umum**, dan password bawaannya
(`admin123` / `budi123`) tertulis di README repo publik. Siapa pun bisa masuk
sebagai admin dan menghapus produk Anda.

**Ganti segera** setelah deploy berhasil:

```bash
cd Backend
npm run user:password -- admin "PasswordPanjangAnda2026!"
npm run user:password -- budi  "PasswordKasirYangBeda99"
```

Pastikan `Backend/.env` masih menunjuk ke database **cloud** saat menjalankan
perintah itu.

Hal lain:

- `JWT_SECRET` di Render sudah dibuat acak otomatis oleh blueprint. Kalau Anda
  mengisinya manual, pakai nilai acak yang panjang:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- Berkas `Backend/.env` **tidak** ikut ter-commit (sudah ada di `.gitignore`).
  Jangan pernah menempelkan isinya ke issue, chat, atau screenshot.
- Ini aplikasi demo. Jangan menyimpan data pelanggan asli di paket gratis.

---

## 11. Kalau ada masalah

| Gejala | Penyebab & solusi |
|---|---|
| Halaman Pages tampil polos tanpa CSS | `VITE_BASE` salah. Workflow menghitungnya dari nama repo, jadi pastikan workflow yang dipakai adalah versi di repo ini. |
| "Tidak bisa terhubung ke server" + error CORS di Console | `CORS_ORIGIN` di Render salah. Isi `https://<username>.github.io` tanpa path. |
| "Tidak bisa terhubung ke server" tanpa error CORS | Backend sedang bangun dari tidur (~1 menit). Tunggu lalu muat ulang. |
| Build Render gagal di `npm ci` | `package-lock.json` tidak ikut ter-commit. Push ulang folder `Backend`. |
| API balas `Terjadi kesalahan pada server` (500) | Masalah koneksi database. Cek Environment Variables di Render dan pastikan `DB_SSL` sesuai. |
| API balas 401 padahal baru login | `JWT_SECRET` berbeda antara saat token dibuat dan diverifikasi, atau token sudah lewat 1 jam. Login ulang. |
| `db:setup` gagal `ER_BAD_DB_ERROR` | Nama database belum dibuat di penyedia. Buat dulu di dashboard-nya. |
| `db:setup` gagal `UNABLE_TO_VERIFY_LEAF_SIGNATURE` | Penyedia memakai CA sendiri. Unduh CA-nya, set `DB_SSL_CA=<path berkas>`. |
| Situs lambat saat dibuka pertama kali | Normal untuk paket gratis Render (spin-up ~1 menit). |
| Deploy Pages gagal "Pages not enabled" | Settings → Pages → Source → **GitHub Actions**. |

---

## 12. Ringkasan biaya

| Komponen | Paket | Biaya |
|---|---|---|
| GitHub repo + Actions + Pages | Free | Rp 0 |
| Render Web Service | Free (tidur saat idle) | Rp 0 |
| MySQL cloud | Paket gratis penyedia | Rp 0 |

Semuanya bisa Rp 0, dengan konsekuensi: backend tidur saat sepi dan penyedia
MySQL gratis biasanya membatasi ukuran serta jumlah koneksi.

---

## 13. Catatan: penyederhanaan yang mungkin Anda inginkan

Arsitektur di atas punya dua origin, sehingga butuh CORS. Kalau nanti ingin
lebih sederhana, backend Express bisa sekaligus menyajikan hasil build
frontend — satu URL, satu origin, CORS tidak lagi diperlukan, dan GitHub Pages
tidak dipakai. Konfigurasi yang ada sekarang **belum** memakai cara itu;
bilang saja kalau mau saya pindahkan.
