import { useCallback, useEffect, useMemo, useState } from "react";

import Modal from "./Modal.jsx";
import { useToast } from "./Toast.jsx";
import { api } from "../api/client.js";
import {
    IconAlert,
    IconMinus,
    IconPackage,
    IconPlus,
    IconSearch,
    IconX
} from "./Icons.jsx";
import { Button, Galat, Kosong, Skeleton } from "./ui.jsx";
import { inisial, rupiah, warnaAvatar } from "../lib/format.js";

/**
 * Layar kasir: memasukkan penjualan.
 *
 * Alur yang terjadi saat "Simpan Transaksi" ditekan:
 *   1. POST /api/transaksi  { nama_pembeli, metode_pembayaran, produk[] }
 *   2. Backend membuat 1 baris di `transaksi` (dapat id + kode_transaksi)
 *   3. Backend menulis semua item ke `detail_transaksi` dengan transaksi_id itu
 *   4. Backend mengurangi stok produk — semuanya dalam satu transaksi database,
 *      jadi kalau satu langkah gagal, tidak ada yang tersimpan separuh.
 *
 * Frontend sengaja TIDAK menghitung harga sendiri: total yang ditampilkan hanya
 * untuk dilihat kasir. Angka yang benar-benar disimpan selalu dihitung ulang
 * oleh backend dari harga di database.
 */

const METODE = [
    { nilai: "CASH", label: "Tunai", catatan: "Langsung lunas" },
    { nilai: "TRANSFER", label: "Transfer", catatan: "Langsung lunas" },
    { nilai: "QRIS", label: "QRIS", catatan: "Menunggu pembayaran" }
];

export default function TransaksiBaru({ terbuka, onTutup, onSukses }) {
    const toast = useToast();

    const [daftarProduk, setDaftarProduk] = useState([]);
    const [memuatProduk, setMemuatProduk] = useState(false);
    const [galatProduk, setGalatProduk] = useState("");

    const [cari, setCari] = useState("");
    const [keranjang, setKeranjang] = useState([]);
    const [pembeli, setPembeli] = useState("");
    const [metode, setMetode] = useState("CASH");

    const [menyimpan, setMenyimpan] = useState(false);
    const [galat, setGalat] = useState("");

    const muatProduk = useCallback(async (signal) => {
        setMemuatProduk(true);
        setGalatProduk("");
        try {
            // Batas 100 adalah batas maksimum yang diizinkan backend.
            const hasil = await api.daftarProduk({ limit: 100, offset: 0, signal });
            setDaftarProduk(hasil.data || []);
        } catch (error) {
            if (error.name === "AbortError") return;
            setGalatProduk(error.message);
            setDaftarProduk([]);
        } finally {
            setMemuatProduk(false);
        }
    }, []);

    // Setiap kali modal dibuka: mulai dari keranjang kosong dan produk terbaru.
    // Produk dimuat ulang supaya stoknya mencerminkan penjualan sebelumnya.
    useEffect(() => {
        if (!terbuka) return undefined;

        setCari("");
        setKeranjang([]);
        setPembeli("");
        setMetode("CASH");
        setGalat("");

        const controller = new AbortController();
        muatProduk(controller.signal);
        return () => controller.abort();
    }, [terbuka, muatProduk]);

    const produkTampil = useMemo(() => {
        const kata = cari.trim().toLowerCase();
        if (!kata) return daftarProduk;
        return daftarProduk.filter((p) =>
            (p.nama_produk || "").toLowerCase().includes(kata)
        );
    }, [daftarProduk, cari]);

    const total = useMemo(
        () => keranjang.reduce((acc, it) => acc + it.harga * it.jumlah, 0),
        [keranjang]
    );

    const jumlahItem = useMemo(
        () => keranjang.reduce((acc, it) => acc + it.jumlah, 0),
        [keranjang]
    );

    const tambah = (produk) => {
        if (produk.stok <= 0) return;

        setGalat("");
        setKeranjang((prev) => {
            const ada = prev.find((it) => it.produk_id === produk.id);

            if (!ada) {
                return [
                    ...prev,
                    {
                        produk_id: produk.id,
                        nama_produk: produk.nama_produk,
                        harga: Number(produk.harga),
                        stok: produk.stok,
                        jumlah: 1
                    }
                ];
            }

            // Jangan biarkan melebihi stok yang tersedia.
            return prev.map((it) =>
                it.produk_id === produk.id
                    ? { ...it, jumlah: Math.min(it.jumlah + 1, it.stok) }
                    : it
            );
        });
    };

    const ubahJumlah = (produkId, delta) => {
        setKeranjang((prev) =>
            prev.map((it) => {
                if (it.produk_id !== produkId) return it;
                const berikut = Math.min(Math.max(1, it.jumlah + delta), it.stok);
                return { ...it, jumlah: berikut };
            })
        );
    };

    const hapus = (produkId) => {
        setKeranjang((prev) => prev.filter((it) => it.produk_id !== produkId));
    };

    const bisaSimpan = pembeli.trim() !== "" && keranjang.length > 0 && !menyimpan;

    const simpan = async () => {
        if (!bisaSimpan) return;

        setMenyimpan(true);
        setGalat("");
        try {
            const hasil = await api.tambahTransaksi({
                nama_pembeli: pembeli.trim(),
                metode_pembayaran: metode,
                // produk_id & jumlah WAJIB bilangan bulat — backend memakai
                // Number.isInteger() dan tidak melakukan konversi.
                produk: keranjang.map((it) => ({
                    produk_id: Number(it.produk_id),
                    jumlah: Number(it.jumlah)
                }))
            });

            toast.sukses(
                `Transaksi ${hasil.data.kode_transaksi} tersimpan (${jumlahItem} item).`,
                { judul: "Penjualan berhasil" }
            );

            // Beri tahu halaman induk: segarkan daftar, lalu tampilkan rincian
            // transaksi yang baru dibuat supaya item di detail_transaksi terlihat.
            onSukses?.(hasil.data);
        } catch (error) {
            // Pesan asli dari backend, mis. "Stok Indomie Goreng tidak mencukupi".
            setGalat(error.message);
        } finally {
            setMenyimpan(false);
        }
    };

    return (
        <Modal
            terbuka={terbuka}
            onTutup={() => (menyimpan ? null : onTutup?.())}
            judul="Transaksi Baru"
            deskripsi="Masukkan penjualan. Item otomatis tersimpan ke detail transaksi."
            lebar="max-w-4xl"
            kelasBody="max-h-[68vh] overflow-y-auto px-6 py-5"
            footer={
                <>
                    <div className="mr-auto text-left">
                        <p className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                            Total
                        </p>
                        <p className="tabular text-[15px] leading-tight font-extrabold text-ink">
                            {rupiah(total)}
                            {jumlahItem > 0 ? (
                                <span className="ml-1.5 text-[11px] font-medium text-muted">
                                    ({jumlahItem} item)
                                </span>
                            ) : null}
                        </p>
                    </div>
                    <Button
                        variasi="terang"
                        onClick={onTutup}
                        disabled={menyimpan}
                    >
                        Batal
                    </Button>
                    <Button onClick={simpan} disabled={!bisaSimpan}>
                        {menyimpan ? "Menyimpan…" : "Simpan Transaksi"}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-5">
                {/* Pembeli + metode pembayaran */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="nama_pembeli"
                            className="mb-1.5 block text-[12px] font-semibold text-subtle"
                        >
                            Nama Pembeli
                        </label>
                        <input
                            id="nama_pembeli"
                            value={pembeli}
                            onChange={(e) => setPembeli(e.target.value)}
                            placeholder="Contoh: Andi Wijaya"
                            autoFocus
                            className="h-11 w-full rounded-xl border border-line bg-white px-4 text-[13px] text-ink outline-none transition-colors placeholder:text-muted focus:border-[#c9ccd1]"
                        />
                    </div>

                    <div>
                        <span className="mb-1.5 block text-[12px] font-semibold text-subtle">
                            Metode Pembayaran
                        </span>
                        <div className="flex gap-1.5 rounded-full border border-line bg-white p-1">
                            {METODE.map((m) => (
                                <button
                                    key={m.nilai}
                                    type="button"
                                    onClick={() => setMetode(m.nilai)}
                                    title={m.catatan}
                                    className={`h-9 flex-1 rounded-full text-[12.5px] font-semibold transition-colors duration-200 ${
                                        metode === m.nilai
                                            ? "bg-ink text-white"
                                            : "text-subtle hover:bg-canvas hover:text-ink"
                                    }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>
                        <p className="mt-1.5 text-[11px] text-muted">
                            {METODE.find((m) => m.nilai === metode)?.catatan} ·{" "}
                            {metode === "QRIS"
                                ? "status transaksi jadi PENDING"
                                : "status transaksi jadi PAID"}
                        </p>
                    </div>
                </div>

                {/* Pemilih produk + keranjang */}
                <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
                    {/* Kolom kiri: daftar produk */}
                    <div>
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-[12px] font-semibold text-subtle">Pilih Produk</p>
                            <span className="text-[11px] text-muted">
                                {produkTampil.length} produk
                            </span>
                        </div>

                        <div className="relative mt-2">
                            <IconSearch
                                size={15}
                                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
                            />
                            <input
                                value={cari}
                                onChange={(e) => setCari(e.target.value)}
                                placeholder="Cari produk…"
                                className="h-10 w-full rounded-full border border-line bg-white pr-4 pl-9 text-[12.5px] text-ink outline-none transition-colors placeholder:text-muted focus:border-[#d5d8dc]"
                            />
                        </div>

                        <div className="mt-2.5 flex max-h-[286px] flex-col gap-2 overflow-y-auto pr-1">
                            {galatProduk ? (
                                <Galat pesan={galatProduk} onCobaLagi={() => muatProduk()} />
                            ) : memuatProduk ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-[58px] w-full rounded-2xl" />
                                ))
                            ) : produkTampil.length === 0 ? (
                                <Kosong
                                    ikon={IconPackage}
                                    judul="Produk tidak ditemukan"
                                    keterangan={
                                        cari
                                            ? `Tidak ada produk yang cocok dengan "${cari}".`
                                            : "Belum ada produk aktif di database."
                                    }
                                />
                            ) : (
                                produkTampil.map((p) => {
                                    const habis = p.stok <= 0;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => tambah(p)}
                                            disabled={habis}
                                            className="flex w-full items-center gap-3 rounded-2xl border border-line px-3 py-2.5 text-left transition-colors duration-200 hover:border-[#d5d8dc] hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-line disabled:hover:bg-white"
                                        >
                                            <span
                                                className={`grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-[11px] font-bold text-white ${warnaAvatar(
                                                    p.nama_produk || ""
                                                )}`}
                                            >
                                                {inisial(p.nama_produk || "?", 1)}
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-[13px] font-semibold text-ink">
                                                    {p.nama_produk}
                                                </span>
                                                <span
                                                    className={`block text-[11px] ${
                                                        habis
                                                            ? "font-semibold text-[#b3231a]"
                                                            : "text-muted"
                                                    }`}
                                                >
                                                    {habis ? "Stok habis" : `Stok ${p.stok}`}
                                                </span>
                                            </span>
                                            <span className="tabular shrink-0 text-[12.5px] font-semibold text-subtle">
                                                {rupiah(p.harga)}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Kolom kanan: keranjang */}
                    <div>
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-[12px] font-semibold text-subtle">
                                Item Dibeli
                            </p>
                            {keranjang.length > 0 ? (
                                <button
                                    type="button"
                                    onClick={() => setKeranjang([])}
                                    className="text-[11.5px] font-semibold text-muted transition-colors hover:text-ink"
                                >
                                    Kosongkan
                                </button>
                            ) : null}
                        </div>

                        <div className="mt-2.5 flex max-h-[322px] flex-col gap-2 overflow-y-auto pr-1">
                            {keranjang.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center">
                                    <p className="text-[12.5px] font-semibold text-subtle">
                                        Belum ada item
                                    </p>
                                    <p className="mx-auto mt-1 max-w-[220px] text-[11.5px] leading-relaxed text-muted">
                                        Klik produk di sebelah kiri untuk menambahkannya
                                        ke transaksi ini.
                                    </p>
                                </div>
                            ) : (
                                keranjang.map((it) => (
                                    <div key={it.produk_id} className="rounded-2xl bg-canvas px-3 py-2.5">
                                        <div className="flex items-start gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[12.5px] font-semibold text-ink">
                                                    {it.nama_produk}
                                                </p>
                                                <p className="tabular text-[11px] text-muted">
                                                    {rupiah(it.harga)} · stok {it.stok}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => hapus(it.produk_id)}
                                                aria-label={`Hapus ${it.nama_produk}`}
                                                className="grid size-6 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-white hover:text-[#b3231a]"
                                            >
                                                <IconX size={13} />
                                            </button>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => ubahJumlah(it.produk_id, -1)}
                                                    disabled={it.jumlah <= 1}
                                                    aria-label="Kurangi jumlah"
                                                    className="grid size-7 place-items-center rounded-full border border-line bg-white text-subtle transition-colors hover:bg-chip hover:text-ink disabled:opacity-40"
                                                >
                                                    <IconMinus size={13} />
                                                </button>
                                                <span className="tabular w-7 text-center text-[13px] font-bold text-ink">
                                                    {it.jumlah}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => ubahJumlah(it.produk_id, 1)}
                                                    disabled={it.jumlah >= it.stok}
                                                    title={
                                                        it.jumlah >= it.stok
                                                            ? `Stok hanya ${it.stok}`
                                                            : "Tambah jumlah"
                                                    }
                                                    aria-label="Tambah jumlah"
                                                    className="grid size-7 place-items-center rounded-full border border-line bg-white text-subtle transition-colors hover:bg-chip hover:text-ink disabled:opacity-40"
                                                >
                                                    <IconPlus size={13} />
                                                </button>
                                            </div>

                                            <span className="tabular text-[13px] font-bold text-ink">
                                                {rupiah(it.harga * it.jumlah)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {galat ? (
                    <p className="flex items-start gap-2 rounded-xl bg-[#fdecea] px-4 py-2.5 text-[12.5px] leading-snug font-medium text-[#b3231a]">
                        <IconAlert size={14} className="mt-0.5 shrink-0" />
                        {galat}
                    </p>
                ) : null}

                {!bisaSimpan && !menyimpan ? (
                    <p className="text-[11.5px] text-muted">
                        {!pembeli.trim() && keranjang.length === 0
                            ? "Isi nama pembeli dan pilih minimal satu produk."
                            : !pembeli.trim()
                              ? "Isi nama pembeli dulu."
                              : "Pilih minimal satu produk."}
                    </p>
                ) : null}
            </div>
        </Modal>
    );
}
