/** Pemformat angka & tanggal — dipakai bersama semua halaman. */

/**
 * Angka ringkas untuk kartu statistik, gaya referensi:
 *   500   -> "500"
 *   1200  -> "1,2 rb"
 *   28000 -> "28 rb"
 *   1200000 -> "1,2 jt"
 * Nol di belakang koma dipotong supaya "500 rb" tidak jadi "500,0 rb".
 */
export const ringkasAngka = (value) => {
    const angka0 = Number(value) || 0;
    const n = Math.abs(angka0);
    const tanda = angka0 < 0 ? "-" : "";

    const bagi = (satuan, sufiks) => {
        const v = n / satuan;
        const teks =
            v >= 100
                ? String(Math.round(v))
                : v.toFixed(1).replace(/\.0$/, "").replace(".", ",");
        return `${tanda}${teks} ${sufiks}`;
    };

    if (n >= 1_000_000_000) return bagi(1_000_000_000, "M");
    if (n >= 1_000_000) return bagi(1_000_000, "jt");
    if (n >= 1_000) return bagi(1_000, "rb");
    return `${tanda}${Math.round(n)}`;
};

/** 3500 -> "Rp 3.500" */
export const rupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Number(value) || 0);

/** Angka ribuan biasa: 12000 -> "12.000" */
export const angka = (value) => new Intl.NumberFormat("id-ID").format(Number(value) || 0);

const BULAN_SINGKAT = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

/**
 * Format tanggal ala referensi: "10 Jun 2026 03:20 WIB".
 * Backend mengirim waktu dalam zona +07:00 (lihat config/database.js),
 * jadi label WIB memang tepat.
 */
export const tanggalWaktu = (input) => {
    if (!input) return "-";
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return "-";

    const bagian = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).formatToParts(d);

    const ambil = (type) => bagian.find((p) => p.type === type)?.value || "";
    const bulan = BULAN_SINGKAT[Number(ambil("month")) - 1] || "";

    return `${Number(ambil("day"))} ${bulan} ${ambil("year")} ${ambil("hour")}:${ambil("minute")} WIB`;
};

/** Hanya tanggal: "10 Jun 2026" */
export const tanggalSaja = (input) => tanggalWaktu(input).split(" ").slice(0, 3).join(" ");

/** Inisial untuk avatar: "Indomie Goreng" -> "IG" */
export const inisial = (teks = "", maks = 2) =>
    String(teks)
        .trim()
        .split(/\s+/)
        .slice(0, maks)
        .map((kata) => kata.charAt(0).toUpperCase())
        .join("") || "?";

/**
 * Warna avatar ditentukan dari nama supaya satu pelanggan selalu
 * mendapat warna yang sama tanpa perlu data tambahan.
 */
const PALET = [
    "from-slate-800 to-slate-600",
    "from-amber-500 to-orange-600",
    "from-sky-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-violet-500 to-purple-600",
    "from-rose-500 to-pink-600"
];

export const warnaAvatar = (teks = "") => {
    let hash = 0;
    for (let i = 0; i < teks.length; i += 1) {
        hash = (hash * 31 + teks.charCodeAt(i)) >>> 0;
    }
    return PALET[hash % PALET.length];
};

/**
 * Label & warna badge status produk.
 * Tone dibuat kalem (abu-abu terang) seperti badge di gambar referensi;
 * hanya status yang perlu perhatian yang diberi warna.
 */
export const metaStatusProduk = (status) => {
    switch (status) {
        case "tersedia":
            return { label: "Tersedia", tone: "netral" };
        case "menipis":
            return { label: "Stok Menipis", tone: "peringatan" };
        case "habis":
            return { label: "Stok Habis", tone: "bahaya" };
        case "nonaktif":
            return { label: "Nonaktif", tone: "redup" };
        default:
            return { label: status || "-", tone: "netral" };
    }
};

/** Label & warna badge status pembayaran transaksi. */
export const metaStatusTransaksi = (status) => {
    switch (status) {
        case "PAID":
            return { label: "Lunas", tone: "sukses" };
        case "PENDING":
            return { label: "Pending", tone: "peringatan" };
        case "CANCELLED":
            return { label: "Dibatalkan", tone: "bahaya" };
        default:
            return { label: status || "-", tone: "netral" };
    }
};
