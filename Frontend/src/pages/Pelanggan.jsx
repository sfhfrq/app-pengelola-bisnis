import { useCallback, useEffect, useMemo, useState } from "react";

import { Card, Galat, Kosong, Skeleton } from "../components/ui.jsx";
import { IconUsers } from "../components/Icons.jsx";
import { api } from "../api/client.js";
import { angka, inisial, rupiah, tanggalWaktu, warnaAvatar } from "../lib/format.js";

/**
 * Halaman Pelanggan.
 *
 * Tabel `transaksi` menyimpan nama pembeli sebagai teks (bukan tabel
 * pelanggan terpisah), jadi daftar pelanggan disusun di sisi klien dengan
 * mengelompokkan transaksi berdasarkan nama. Tidak ada endpoint baru yang
 * perlu ditambahkan di backend.
 */
export default function Pelanggan() {
    const [rows, setRows] = useState([]);
    const [memuat, setMemuat] = useState(true);
    const [galat, setGalat] = useState("");

    const muat = useCallback(async (signal) => {
        setMemuat(true);
        setGalat("");
        try {
            const hasil = await api.daftarTransaksi({ limit: 100, offset: 0, signal });
            setRows(hasil.data || []);
        } catch (error) {
            if (error.name === "AbortError") return;
            setGalat(error.message);
            setRows([]);
        } finally {
            setMemuat(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        muat(controller.signal);
        return () => controller.abort();
    }, [muat]);

    const pelanggan = useMemo(() => {
        const peta = new Map();

        for (const t of rows) {
            const nama = (t.nama_pembeli || "").trim() || "(tanpa nama)";
            const sekarang = peta.get(nama) || {
                nama,
                transaksi: 0,
                unit: 0,
                belanja: 0,
                terakhir: t.tanggal_transaksi
            };

            sekarang.transaksi += 1;
            sekarang.unit += Number(t.total_item) || 0;
            sekarang.belanja += Number(t.total_harga) || 0;

            if (new Date(t.tanggal_transaksi) > new Date(sekarang.terakhir)) {
                sekarang.terakhir = t.tanggal_transaksi;
            }

            peta.set(nama, sekarang);
        }

        return [...peta.values()].sort((a, b) => b.belanja - a.belanja);
    }, [rows]);

    const ringkas = useMemo(() => {
        const totalBelanja = pelanggan.reduce((acc, p) => acc + p.belanja, 0);
        return {
            jumlah: pelanggan.length,
            totalBelanja,
            rata: pelanggan.length ? totalBelanja / pelanggan.length : 0,
            sumber: rows.length
        };
    }, [pelanggan, rows.length]);

    return (
        <div className="flex flex-col gap-5">
            <header>
                <h1 className="text-[20px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
                    Pelanggan
                </h1>
                <p className="mt-1 text-[12.5px] text-muted">
                    Diringkas dari {angka(ringkas.sumber)} transaksi terakhir di database.
                </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    { label: "Jumlah Pelanggan", nilai: angka(ringkas.jumlah) },
                    { label: "Total Belanja", nilai: rupiah(ringkas.totalBelanja) },
                    { label: "Rata-rata / Pelanggan", nilai: rupiah(Math.round(ringkas.rata)) }
                ].map((k, i) => (
                    <Card
                        key={k.label}
                        className="anim-rise p-5"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        <p className="text-[11.5px] font-medium text-muted">{k.label}</p>
                        <p className="tabular mt-2 text-[19px] font-extrabold tracking-[-0.02em] text-ink">
                            {memuat ? "—" : k.nilai}
                        </p>
                    </Card>
                ))}
            </div>

            <Card className="p-5">
                <h2 className="text-[16.5px] font-bold tracking-[-0.01em] text-ink">
                    Daftar Pelanggan
                </h2>

                <div className="mt-4">
                    {galat ? (
                        <Galat pesan={galat} onCobaLagi={() => muat()} />
                    ) : memuat ? (
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 py-2">
                                    <Skeleton className="size-9 rounded-full" />
                                    <Skeleton className="h-3 w-32" />
                                    <Skeleton className="ml-auto h-3 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : pelanggan.length === 0 ? (
                        <Kosong
                            ikon={IconUsers}
                            judul="Belum ada pelanggan"
                            keterangan="Nama pembeli akan muncul di sini setelah ada transaksi tercatat."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[620px] border-separate border-spacing-0">
                                <thead>
                                    <tr>
                                        {["Pelanggan", "Transaksi", "Unit", "Total Belanja", "Terakhir"].map(
                                            (h) => (
                                                <th
                                                    key={h}
                                                    className="pb-3 text-left text-[12px] font-medium text-muted"
                                                >
                                                    {h}
                                                </th>
                                            )
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pelanggan.map((p, i) => (
                                        <tr
                                            key={p.nama}
                                            className="anim-fade"
                                            style={{ animationDelay: `${i * 35}ms` }}
                                        >
                                            <td className="border-b border-line-soft py-3.5 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white ${warnaAvatar(
                                                            p.nama
                                                        )}`}
                                                    >
                                                        {inisial(p.nama, 1)}
                                                    </span>
                                                    <span className="text-[13px] font-semibold text-ink">
                                                        {p.nama}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="tabular border-b border-line-soft py-3.5 pr-4 text-[12.5px] text-subtle">
                                                {angka(p.transaksi)}
                                            </td>
                                            <td className="tabular border-b border-line-soft py-3.5 pr-4 text-[12.5px] text-subtle">
                                                {angka(p.unit)}
                                            </td>
                                            <td className="tabular border-b border-line-soft py-3.5 pr-4 text-[13px] font-semibold text-ink">
                                                {rupiah(p.belanja)}
                                            </td>
                                            <td className="border-b border-line-soft py-3.5 pr-4 text-[12.5px] whitespace-nowrap text-muted">
                                                {tanggalWaktu(p.terakhir)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
