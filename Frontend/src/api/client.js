/**
 * Klien API terpusat.
 *
 * Semua request lewat sini supaya:
 *  - token JWT otomatis dipasang di header Authorization;
 *  - error backend ({ pesan: "..." }) otomatis jadi Error yang rapi;
 *  - respons 401 otomatis memicu logout (lewat jembatan dari AuthContext).
 *
 * Base URL default "/api" -> diteruskan proxy Vite ke http://localhost:3000
 * sehingga tidak ada masalah CORS. Bisa dioverride lewat VITE_API_BASE.
 */

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export class ApiError extends Error {
    constructor(message, status, payload) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.payload = payload;
    }
}

let tokenProvider = () => null;
let unauthorizedHandler = null;

/** Dipanggil sekali oleh AuthProvider untuk menyambungkan token & logout. */
export const setAuthBridge = ({ getToken, onUnauthorized } = {}) => {
    if (getToken) tokenProvider = getToken;
    if (onUnauthorized) unauthorizedHandler = onUnauthorized;
};

const buildUrl = (path, query) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query || {})) {
        if (value === undefined || value === null || value === "") continue;
        params.set(key, String(value));
    }
    const qs = params.toString();
    return `${API_BASE}${path}${qs ? `?${qs}` : ""}`;
};

const request = async (path, { method = "GET", body, query, signal } = {}) => {
    const headers = {};
    const token = tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let response;
    try {
        response = await fetch(buildUrl(path, query), {
            method,
            headers,
            signal,
            body: body === undefined ? undefined : JSON.stringify(body)
        });
    } catch (error) {
        if (error.name === "AbortError") throw error;
        throw new ApiError(
            `Tidak bisa terhubung ke server (${API_BASE}). ` +
                "Pastikan backend sedang berjalan dan alamat API sudah benar.",
            0,
            null
        );
    }

    // Baca sebagai teks dulu: 204 No Content tidak punya body JSON.
    const text = await response.text();
    let payload = null;
    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            payload = { pesan: text };
        }
    }

    if (!response.ok) {
        if (response.status === 401 && unauthorizedHandler) unauthorizedHandler();
        throw new ApiError(
            payload?.pesan || `Permintaan gagal (HTTP ${response.status})`,
            response.status,
            payload
        );
    }

    return payload;
};

export const api = {
    // ---- Auth ----
    login: (nama, password) =>
        request("/auth/login", { method: "POST", body: { nama, password } }),

    // ---- Dashboard ----
    ringkasan: ({ tahun, signal } = {}) =>
        request("/dashboard/ringkasan", { query: { tahun }, signal }),

    // ---- Produk ----
    daftarProduk: ({ cari, status, limit = 20, offset = 0, signal } = {}) =>
        request("/produk", { query: { cari, status, limit, offset }, signal }),

    tambahProduk: (data) =>
        request("/produk", { method: "POST", body: data }),

    ubahProduk: (id, data) =>
        request(`/produk/${id}`, { method: "PUT", body: data }),

    hapusProduk: (id) => request(`/produk/${id}`, { method: "DELETE" }),

    // ---- Transaksi ----
    daftarTransaksi: ({ cari, status, limit = 20, offset = 0, signal } = {}) =>
        request("/transaksi", { query: { cari, status, limit, offset }, signal }),

    // Membuat penjualan baru (dipakai layar kasir).
    // Backend menulis 1 baris `transaksi` + semua item ke `detail_transaksi`
    // dengan transaksi_id barunya, lalu mengurangi stok — dalam satu
    // transaksi database.
    tambahTransaksi: ({ nama_pembeli, metode_pembayaran, produk }) =>
        request("/transaksi", {
            method: "POST",
            body: { nama_pembeli, metode_pembayaran, produk }
        }),

    detailTransaksi: (id, { signal } = {}) =>
        request(`/transaksi/${id}`, { signal }),

    // Membatalkan transaksi: status jadi CANCELLED dan stok dikembalikan.
    // Barisnya tidak dihapus, jadi riwayat penjualan tetap utuh.
    batalkanTransaksi: (id) =>
        request(`/transaksi/${id}/batal`, { method: "PATCH" }),

    // ---- Pengguna ----
    daftarPengguna: ({ signal } = {}) => request("/users", { signal })
};
