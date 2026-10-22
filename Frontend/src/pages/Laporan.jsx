import { useCallback, useEffect, useMemo, useState } from "react";

import StatisticsChart from "../components/StatisticsChart.jsx";
import { Card, Galat, Skeleton } from "../components/ui.jsx";
import { api } from "../api/client.js";
import { angka, rupiah } from "../lib/format.js";

/**
 * Halaman Laporan — merangkum angka yang sama dengan dashboard, tetapi
 * disusun sebagai laporan: ringkasan angka, grafik, lalu tabel per bulan.
 */
export default function Laporan() {
    const [data, setData] = useState(null);
    const [memuat, setMemuat] = useState(true);
    const [galat, setGalat] = useState("");

    const muat = useCallback(async (signal) => {
        setMemuat(true);
        setGalat("");
        try {
            const hasil = await api.ringkasan({ signal });
            setData(hasil.data);
        } catch (error) {
            if (error.name === "AbortError") return;
            setGalat(error.message);
        } finally {
            setMemuat(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        muat(controller.signal);
        return () => controller.abort();
    }, [muat]);

    const barisBulan = useMemo(() => {
        const g = data?.grafik;
        if (!g) return [];
        return g.label_bulan.map((nama, i) => ({
            nama,
            transaksi: g.transaksi?.[i] ?? 0,
            unit: g.produk_terjual?.[i] ?? 0
        }));
    }, [data]);

    const jumlahTahun = useMemo(
        () =>
            barisBulan.reduce(
                (acc, b) => ({
                    transaksi: acc.transaksi + b.transaksi,
                    unit: acc.unit + b.unit
                }),
                { transaksi: 0, unit: 0 }
            ),
        [barisBulan]
    );

    const maksTransaksi = Math.max(1, ...barisBulan.map((b) => b.transaksi));

    if (galat) {
        return (
            <Card className="p-5">
                <Galat pesan={galat} onCobaLagi={() => muat()} />
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <header>
                <h1 className="text-[20px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
                    Laporan
                </h1>
                <p className="mt-1 text-[12.5px] text-muted">
                    Rekap penjualan tahun {data?.grafik?.tahun ?? new Date().getFullYear()}.
                </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        label: "Pendapatan Lunas",
                        nilai: rupiah(data?.statistik?.total_pendapatan),
                        catatan: "Transaksi berstatus PAID"
                    },
                    {
                        label: "Nilai Transaksi Tahun Ini",
                        nilai: rupiah(data?.grafik?.total_pendapatan),
                        catatan: "Semua status pembayaran"
                    },
                    {
                        label: "Transaksi Tahun Ini",
                        nilai: angka(jumlahTahun.transaksi),
                        catatan: `${angka(data?.statistik?.total_transaksi)} sepanjang waktu`
                    },
                    {
                        label: "Unit Terjual Tahun Ini",
                        nilai: angka(jumlahTahun.unit),
                        catatan: "Dari detail transaksi"
                    }
                ].map((k, i) => (
                    <Card
                        key={k.label}
                        className="anim-rise p-5"
                        style={{ animationDelay: `${i * 55}ms` }}
                    >
                        <p className="text-[11.5px] font-medium text-muted">{k.label}</p>
                        <p className="tabular mt-2 text-[19px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
                            {memuat ? "—" : k.nilai}
                        </p>
                        <p className="mt-1.5 text-[11px] text-muted">{k.catatan}</p>
                    </Card>
                ))}
            </div>

            <Card className="p-5">
                <StatisticsChart
                    grafik={data?.grafik}
                    memuat={memuat}
                    judul="Transaksi & Unit Terjual per Bulan"
                />
            </Card>

            <Card className="p-5">
                <h2 className="text-[16.5px] font-bold tracking-[-0.01em] text-ink">
                    Rincian per Bulan
                </h2>

                <div className="mt-4 overflow-x-auto">
                    {memuat ? (
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-8 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <table className="w-full min-w-[520px] border-separate border-spacing-0">
                            <thead>
                                <tr>
                                    {["Bulan", "Transaksi", "Unit Terjual", "Proporsi"].map((h) => (
                                        <th
                                            key={h}
                                            className="pb-3 text-left text-[12px] font-medium text-muted"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {barisBulan.map((b, i) => (
                                    <tr key={b.nama}>
                                        <td className="border-b border-line-soft py-2.5 pr-4 text-[12.5px] font-semibold text-ink">
                                            {b.nama}
                                        </td>
                                        <td className="tabular border-b border-line-soft py-2.5 pr-4 text-[12.5px] text-subtle">
                                            {angka(b.transaksi)}
                                        </td>
                                        <td className="tabular border-b border-line-soft py-2.5 pr-4 text-[12.5px] text-subtle">
                                            {angka(b.unit)}
                                        </td>
                                        <td className="border-b border-line-soft py-2.5 pr-4">
                                            <span className="block h-[7px] w-full max-w-[220px] overflow-hidden rounded-full bg-canvas">
                                                <span
                                                    className="bar-x block h-full rounded-full bg-ink"
                                                    style={{
                                                        width: `${(b.transaksi / maksTransaksi) * 100}%`,
                                                        animationDelay: `${i * 30}ms`
                                                    }}
                                                />
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>
        </div>
    );
}
