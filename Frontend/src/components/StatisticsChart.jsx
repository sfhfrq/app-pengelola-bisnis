import { useEffect, useMemo, useRef, useState } from "react";

import { Skeleton } from "./ui.jsx";
import { angka } from "../lib/format.js";

/**
 * Grafik batang dua deret: Transaksi (hitam) vs Unit Terjual (abu terang).
 *
 * Mengapa dua sumbu Y?
 * Jumlah transaksi per bulan berkisar 1–6, sedangkan unit terjual 10–31.
 * Kalau keduanya dipaksa ke satu sumbu, batang transaksi jadi nyaris tak
 * terlihat. Jadi tiap deret punya skala sendiri: sumbu kiri untuk transaksi
 * (label gelap) dan sumbu kanan untuk unit terjual (label abu). Warna label
 * sumbu dibuat sama dengan warna batangnya supaya pasangannya jelas, dan
 * nilai persisnya selalu bisa dilihat di tooltip.
 *
 * Digambar sendiri dengan SVG, tanpa pustaka grafik, supaya bentuknya bisa
 * disamakan persis dengan referensi: batang tipis membulat, label sumbu di
 * kiri, label bulan di bawah, dan tooltip gelap yang mengambang.
 *
 * Lebar grafik diukur dengan ResizeObserver sehingga koordinat SVG sama
 * dengan piksel container — ini yang membuat tooltip HTML bisa diposisikan
 * tepat di atas batang.
 */

// PAD.atas sengaja besar: memberi ruang bagi tooltip yang mengambang di atas
// batang tertinggi, supaya tooltip tidak pernah menutupi baris legenda.
const TINGGI = 280;
const PAD = { atas: 84, bawah: 28, kiri: 42, kanan: 42 };

const SERI = [
    {
        kunci: "transaksi",
        nama: "Transaksi",
        warna: "#0d0d0f",
        warnaLabel: "#8f949b",
        satuan: "transaksi",
        sisi: "kiri"
    },
    {
        kunci: "produk_terjual",
        nama: "Unit Terjual",
        warna: "#dadde1",
        warnaLabel: "#c2c6cb",
        satuan: "unit",
        sisi: "kanan"
    }
];

// Kandidat langkah sumbu Y — bilangan "bulat enak dibaca".
const LANGKAH = [
    1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500,
    1000, 2000, 2500, 5000, 10000, 25000, 50000
];

/** Menentukan langkah & puncak sumbu Y supaya labelnya bulat (3..5 garis). */
const hitungSumbuY = (maks) => {
    const aman = Math.max(1, Math.ceil(maks));

    let langkah = LANGKAH[LANGKAH.length - 1];
    for (const kandidat of LANGKAH) {
        if (aman / kandidat <= 5) {
            langkah = kandidat;
            break;
        }
    }

    const interval = Math.min(5, Math.max(3, Math.ceil(aman / langkah)));
    const puncak = langkah * interval;

    const ticks = [];
    for (let v = 0; v <= puncak + 1e-9; v += langkah) {
        ticks.push(Math.round(v * 1000) / 1000);
    }

    return { puncak, ticks, langkah };
};

/** Label sumbu: 8000 -> "8K", 20 -> "20". */
const labelSumbu = (v) => (v >= 1000 ? `${Number((v / 1000).toFixed(1))}K` : String(v));

function LegendaDot({ warna, children, catatan }) {
    return (
        <span className="flex items-center gap-2 text-[11.5px] font-semibold text-subtle">
            <span className="size-[9px] rounded-full" style={{ backgroundColor: warna }} />
            {children}
            {catatan ? (
                <span className="text-[9.5px] font-medium text-muted">{catatan}</span>
            ) : null}
        </span>
    );
}

export default function StatisticsChart({ grafik, memuat, judul = "Statistics" }) {
    const wrapRef = useRef(null);
    const [lebar, setLebar] = useState(0);
    const [hover, setHover] = useState(null);

    // Ukur lebar container; ukuran berubah saat jendela di-resize.
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return undefined;

        const terapkan = (w) => setLebar(Math.max(0, Math.round(w)));
        terapkan(el.getBoundingClientRect().width);

        const ro = new ResizeObserver((entries) => {
            terapkan(entries[0]?.contentRect?.width ?? 0);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const deret = useMemo(() => {
        if (!grafik) {
            return {
                label: [],
                nilai: { transaksi: [], produk_terjual: [] },
                totalPendapatan: 0,
                tahun: new Date().getFullYear()
            };
        }
        return {
            label: grafik.label_bulan || [],
            nilai: {
                transaksi: grafik.transaksi || [],
                produk_terjual: grafik.produk_terjual || []
            },
            totalPendapatan: grafik.total_pendapatan || 0,
            tahun: grafik.tahun
        };
    }, [grafik]);

    const jumlahTitik = deret.label.length || 12;

    // Satu sumbu per deret.
    const sumbu = useMemo(() => {
        const maks = (arr) => (arr.length ? Math.max(...arr) : 0);
        return {
            transaksi: hitungSumbuY(maks(deret.nilai.transaksi)),
            produk_terjual: hitungSumbuY(maks(deret.nilai.produk_terjual))
        };
    }, [deret]);

    // Saat tidak ada hover, tooltip ditampilkan pada bulan dengan transaksi
    // terbanyak — supaya grafik tidak pernah terlihat "kosong".
    const indeksPuncak = useMemo(() => {
        const arr = deret.nilai.transaksi;
        if (!arr.length) return 0;
        let idx = 0;
        for (let i = 1; i < arr.length; i += 1) if (arr[i] > arr[idx]) idx = i;
        return idx;
    }, [deret]);

    const aktif = hover ?? (memuat ? null : indeksPuncak);

    const plot = {
        lebar: Math.max(0, lebar - PAD.kiri - PAD.kanan),
        tinggi: TINGGI - PAD.atas - PAD.bawah
    };
    const slot = plot.lebar / jumlahTitik;
    const lebarBar = Math.max(4, Math.min(9, slot * 0.18));
    const jarakBar = Math.max(2, Math.min(4, slot * 0.07));

    const yDengan = (nilai, puncak) =>
        PAD.atas + plot.tinggi - (nilai / puncak) * plot.tinggi;

    const tinggiDengan = (nilai, puncak) => (nilai / puncak) * plot.tinggi;

    const cx = (i) => PAD.kiri + slot * (i + 0.5);

    const siap = !memuat && lebar > 0;

    // Titik teratas tooltip mengikuti batang tertinggi pada bulan aktif,
    // dihitung dari sumbu masing-masing deret.
    const titikTooltip = useMemo(() => {
        if (aktif === null || !siap) return null;
        const yT = yDengan(
            deret.nilai.transaksi[aktif] || 0,
            sumbu.transaksi.puncak
        );
        const yU = yDengan(
            deret.nilai.produk_terjual[aktif] || 0,
            sumbu.produk_terjual.puncak
        );
        return { x: cx(aktif), y: Math.min(yT, yU) };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aktif, siap, deret, sumbu, lebar]);

    return (
        <div className="flex h-full flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[16.5px] font-bold tracking-[-0.01em] text-ink">{judul}</h2>
                <div className="flex items-center gap-4">
                    {SERI.map((s) => (
                        <LegendaDot
                            key={s.kunci}
                            warna={s.warna}
                            catatan={s.sisi === "kiri" ? "(kiri)" : "(kanan)"}
                        >
                            {s.nama}
                        </LegendaDot>
                    ))}
                </div>
            </div>

            <div ref={wrapRef} className="relative mt-4 w-full flex-1">
                {memuat ? (
                    <div className="flex h-[280px] items-end gap-2 px-8 pb-8">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <Skeleton
                                key={i}
                                // Tinggi bervariasi supaya terlihat seperti grafik.
                                className="flex-1 rounded-full"
                                style={{ height: `${28 + ((i * 37) % 70)}%` }}
                            />
                        ))}
                    </div>
                ) : (
                    <>
                        <svg
                            width={lebar}
                            height={TINGGI}
                            role="img"
                            aria-label={`Grafik transaksi dan unit terjual tahun ${deret.tahun}`}
                            className="block overflow-visible"
                            onMouseLeave={() => setHover(null)}
                        >
                            {/* Garis dasar tipis */}
                            <line
                                x1={PAD.kiri}
                                x2={PAD.kiri + plot.lebar}
                                y1={PAD.atas + plot.tinggi}
                                y2={PAD.atas + plot.tinggi}
                                stroke="#ecedef"
                                strokeWidth="1"
                            />

                            {/* Label sumbu kiri (Transaksi) */}
                            {sumbu.transaksi.ticks.map((t) => (
                                <text
                                    key={`y-kiri-${t}`}
                                    x={PAD.kiri - 12}
                                    y={yDengan(t, sumbu.transaksi.puncak)}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                    fontSize="10.5"
                                    fontWeight="600"
                                    fill={SERI[0].warnaLabel}
                                >
                                    {labelSumbu(t)}
                                </text>
                            ))}

                            {/* Label sumbu kanan (Unit Terjual) */}
                            {sumbu.produk_terjual.ticks.map((t) => (
                                <text
                                    key={`y-kanan-${t}`}
                                    x={PAD.kiri + plot.lebar + 12}
                                    y={yDengan(t, sumbu.produk_terjual.puncak)}
                                    textAnchor="start"
                                    dominantBaseline="middle"
                                    fontSize="10.5"
                                    fontWeight="600"
                                    fill={SERI[1].warnaLabel}
                                >
                                    {labelSumbu(t)}
                                </text>
                            ))}

                            {/* Batang */}
                            {Array.from({ length: jumlahTitik }).map((_, i) => {
                                const redup = aktif !== null && aktif !== i;
                                return (
                                    <g
                                        key={`g-${i}`}
                                        opacity={redup ? 0.55 : 1}
                                        style={{ transition: "opacity 180ms ease-out" }}
                                    >
                                        {SERI.map((s, si) => {
                                            const nilai = deret.nilai[s.kunci]?.[i] ?? 0;
                                            const tinggi = tinggiDengan(
                                                nilai,
                                                sumbu[s.kunci].puncak
                                            );
                                            const x =
                                                cx(i) -
                                                (si === 0 ? jarakBar / 2 + lebarBar : -jarakBar / 2);
                                            return (
                                                <rect
                                                    key={s.kunci}
                                                    className="chart-bar"
                                                    x={x}
                                                    y={PAD.atas + plot.tinggi - tinggi}
                                                    width={lebarBar}
                                                    height={Math.max(0, tinggi)}
                                                    rx={lebarBar / 2}
                                                    fill={s.warna}
                                                    style={{
                                                        animationDelay: `${i * 32 + si * 40}ms`
                                                    }}
                                                />
                                            );
                                        })}
                                    </g>
                                );
                            })}

                            {/* Label bulan */}
                            {deret.label.map((nama, i) => (
                                <text
                                    key={`x-${nama}-${i}`}
                                    x={cx(i)}
                                    y={TINGGI - 8}
                                    textAnchor="middle"
                                    fontSize="10.5"
                                    fontWeight="600"
                                    fill={aktif === i ? "#0d0d0f" : "#b4b8be"}
                                    style={{ transition: "fill 180ms ease-out" }}
                                >
                                    {nama}
                                </text>
                            ))}

                            {/* Area tangkap hover per bulan */}
                            {Array.from({ length: jumlahTitik }).map((_, i) => (
                                <rect
                                    key={`hit-${i}`}
                                    x={PAD.kiri + slot * i}
                                    y={PAD.atas - 10}
                                    width={slot}
                                    height={plot.tinggi + 18}
                                    fill="transparent"
                                    onMouseEnter={() => setHover(i)}
                                />
                            ))}
                        </svg>

                        {/* Tooltip gelap mengambang */}
                        {titikTooltip ? (
                            <div
                                className="anim-pop pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
                                style={{
                                    left: titikTooltip.x,
                                    // Jaga-jaga: tooltip tidak boleh keluar dari area grafik.
                                    top: Math.max(4, titikTooltip.y - 12)
                                }}
                            >
                                <div className="rounded-[13px] bg-ink px-3 py-2 text-white shadow-[0_12px_26px_-10px_rgba(13,13,15,0.7)]">
                                    <p className="text-[9.5px] font-semibold tracking-wide text-white/55 uppercase">
                                        {deret.label[aktif]} {deret.tahun}
                                    </p>
                                    {SERI.map((s) => (
                                        <p
                                            key={s.kunci}
                                            className="tabular mt-0.5 text-[11.5px] font-bold whitespace-nowrap"
                                        >
                                            {angka(deret.nilai[s.kunci]?.[aktif] ?? 0)}{" "}
                                            <span className="font-medium text-white/70">
                                                {s.satuan}
                                            </span>
                                        </p>
                                    ))}
                                </div>
                                <span className="mx-auto block size-0 border-x-[6px] border-t-[7px] border-x-transparent border-t-ink" />
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
}
