import { Link } from "react-router-dom";

import Badge from "./Badge.jsx";
import { IconClock, IconWallet } from "./Icons.jsx";
import { Galat, Kosong, Skeleton } from "./ui.jsx";
import { inisial, rupiah, tanggalWaktu, warnaAvatar } from "../lib/format.js";

/**
 * Panel kanan "Menunggu Pembayaran".
 *
 * Padanan dari panel "Pending Approvals" di referensi: baris berisi avatar,
 * nama, waktu, dan badge status. Datanya transaksi dengan
 * status_pembayaran = 'PENDING' (QRIS otomatis PENDING saat dibuat).
 */
export default function PendingList({ daftar = [], memuat, galat, onCobaLagi }) {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16.5px] font-bold tracking-[-0.01em] text-ink">
                    Menunggu Pembayaran
                </h2>
                <span className="grid size-8 place-items-center rounded-full bg-chip text-muted">
                    <IconClock size={16} />
                </span>
            </div>

            <div className="mt-3 flex-1">
                {memuat ? (
                    <div className="flex flex-col gap-1">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 py-2.5">
                                <Skeleton className="size-9 shrink-0 rounded-xl" />
                                <div className="flex-1">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="mt-2 h-2.5 w-32" />
                                </div>
                                <Skeleton className="h-6 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : galat ? (
                    <Galat pesan={galat} onCobaLagi={onCobaLagi} />
                ) : daftar.length === 0 ? (
                    <Kosong
                        ikon={IconWallet}
                        judul="Semua transaksi sudah lunas"
                        keterangan="Tidak ada transaksi yang menunggu pembayaran saat ini."
                    />
                ) : (
                    <ul className="flex flex-col">
                        {daftar.map((t, i) => (
                            <li
                                key={t.id}
                                className="anim-rise flex items-center gap-3 border-b border-line-soft py-2.5 last:border-b-0"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <span
                                    className={`grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-[12px] font-bold text-white ${warnaAvatar(
                                        t.nama_pembeli || ""
                                    )}`}
                                >
                                    {inisial(t.nama_pembeli || "?")}
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[12.5px] font-bold text-ink">
                                        {t.nama_pembeli}
                                    </p>
                                    <p className="truncate text-[10.5px] text-muted">
                                        {tanggalWaktu(t.tanggal_transaksi)}
                                    </p>
                                </div>

                                <div className="flex shrink-0 flex-col items-end gap-1">
                                    <Badge tone="peringatan">Pending</Badge>
                                    <span className="tabular text-[11px] font-semibold text-subtle">
                                        {rupiah(t.total_harga)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {!memuat && !galat && daftar.length > 0 ? (
                <Link
                    to="/transaksi"
                    className="mt-3 block border-t border-line-soft pt-3 text-center text-[11.5px] font-semibold text-subtle transition-colors hover:text-ink"
                >
                    Lihat semua transaksi
                </Link>
            ) : null}
        </div>
    );
}
