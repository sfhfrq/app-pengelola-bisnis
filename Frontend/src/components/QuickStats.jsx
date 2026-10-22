import { useMemo } from "react";
import { IconAlert, IconClock, IconPackage, IconReceipt, IconUsers, IconClipboard, IconArrowUp } from "./Icons.jsx";
import { ringkasAngka } from "../lib/format.js";
import { Skeleton } from "./ui.jsx";

/**
 * Enam kartu "Quick Stats" + blok judul di sebelah kiri.
 *
 * Strip kartu sengaja bisa di-scroll horizontal: pada lebar layar sedang
 * kartu terakhir terpotong di tepi kanan, persis seperti gambar referensi.
 * Di layar lebar keenam kartu muat semua tanpa perlu scroll.
 */
const KARTU = [
    { kunci: "total_pengguna", label: "Total Pengguna", Ikon: IconUsers },
    { kunci: "total_produk", label: "Total Produk", Ikon: IconPackage },
    { kunci: "transaksi_bulan_ini", label: "Transaksi Bulan Ini", Ikon: IconReceipt, aktif: true },
    { kunci: "total_transaksi", label: "Total Transaksi", Ikon: IconClipboard },
    { kunci: "transaksi_pending", label: "Menunggu Bayar", Ikon: IconClock },
    { kunci: "stok_menipis", label: "Stok Menipis", Ikon: IconAlert }
];

function Kartu({ Ikon, label, nilai, aktif, indeks }) {
    return (
        <article
            className="anim-rise relative flex h-[120px] w-[116px] shrink-0 flex-col items-center justify-center gap-2 rounded-[22px] border border-line bg-white"
            style={{ animationDelay: `${indeks * 45}ms` }}
        >
            <span
                className={`grid size-8 place-items-center rounded-full ${
                    aktif ? "bg-ink text-white" : "bg-chip text-muted"
                }`}
            >
                <Ikon size={16} />
            </span>

            <p className="tabular text-[17px] leading-none font-extrabold tracking-[-0.02em] text-ink">
                {nilai}
            </p>

            <p className="px-2.5 text-center text-[10.5px] leading-tight font-medium text-muted">
                {label}
            </p>

            {/* Kartu unggulan punya tombol bulat kecil di tepi bawah. */}
            {aktif ? (
                <span className="absolute -bottom-[11px] left-1/2 grid size-[26px] -translate-x-1/2 place-items-center rounded-full border border-line bg-white text-ink shadow-[0_8px_16px_-8px_rgba(13,13,15,0.5)]">
                    <IconArrowUp size={13} />
                </span>
            ) : null}
        </article>
    );
}

export default function QuickStats({ statistik, memuat }) {
    const nilaiKartu = useMemo(
        () =>
            KARTU.map((k) => ({
                ...k,
                nilai: memuat ? null : ringkasAngka(statistik?.[k.kunci] ?? 0)
            })),
        [statistik, memuat]
    );

    return (
        <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-[118px] shrink-0 sm:w-[132px]">
                <h1 className="text-[18px] leading-tight font-extrabold tracking-[-0.02em] text-ink sm:text-[19px]">
                    Quick Stats
                </h1>
                <p className="mt-1.5 text-[11.5px] leading-snug text-muted">
                    Statistik bisnis Anda periode ini.
                </p>
            </div>

            <div className="no-scrollbar flex flex-1 items-center gap-3 overflow-x-auto px-1 py-4">
                {nilaiKartu.map((k, i) =>
                    k.nilai === null ? (
                        <Skeleton key={k.kunci} className="h-[120px] w-[116px] shrink-0 rounded-[22px]" />
                    ) : (
                        <Kartu
                            key={k.kunci}
                            Ikon={k.Ikon}
                            label={k.label}
                            nilai={k.nilai}
                            aktif={k.aktif}
                            indeks={i}
                        />
                    )
                )}
            </div>
        </div>
    );
}
