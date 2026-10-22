import { useCallback, useEffect, useState } from "react";

import PendingList from "../components/PendingList.jsx";
import PanelProduk from "../components/PanelProduk.jsx";
import QuickStats from "../components/QuickStats.jsx";
import StatisticsChart from "../components/StatisticsChart.jsx";
import { Card, Galat } from "../components/ui.jsx";
import { api } from "../api/client.js";

/**
 * Halaman Dashboard — susunannya mengikuti gambar referensi:
 *   1. baris "Quick Stats" berisi enam kartu
 *   2. panel "Statistics" (grafik) + panel "Menunggu Pembayaran"
 *   3. panel tabel "Kelola Produk" selebar halaman
 *
 * Seluruh angkanya berasal dari satu endpoint: GET /api/dashboard/ringkasan.
 */
export default function Dashboard() {
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

    return (
        <div className="flex flex-col gap-5">
            <QuickStats statistik={data?.statistik} memuat={memuat} />

            <div className="grid gap-5 xl:grid-cols-[1.62fr_1fr]">
                <Card className="p-5">
                    {galat && !memuat ? (
                        <Galat pesan={galat} onCobaLagi={() => muat()} />
                    ) : (
                        <StatisticsChart grafik={data?.grafik} memuat={memuat} />
                    )}
                </Card>

                <Card className="p-5">
                    <PendingList
                        daftar={data?.menunggu_pembayaran}
                        memuat={memuat}
                        galat={galat}
                        onCobaLagi={() => muat()}
                    />
                </Card>
            </div>

            <PanelProduk judul="Kelola Produk" ukuranHalaman={5} />
        </div>
    );
}
