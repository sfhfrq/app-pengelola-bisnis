import { useCallback, useEffect, useState } from "react";

import Badge from "../components/Badge.jsx";
import { Card, Galat, Kosong, Skeleton } from "../components/ui.jsx";
import { IconShield, IconUser } from "../components/Icons.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { angka, inisial, tanggalSaja, warnaAvatar } from "../lib/format.js";

const NAMA_ROLE = { admin: "Administrator", kasir: "Kasir" };

/**
 * Halaman Pengguna — daftar akun dari tabel `users`.
 * Endpoint ini khusus admin; kalau bukan admin, backend membalas 403
 * dan pesannya ditampilkan apa adanya.
 */
export default function Pengguna() {
    const { admin } = useAuth();

    const [rows, setRows] = useState([]);
    const [memuat, setMemuat] = useState(true);
    const [galat, setGalat] = useState("");
    const [statusGalat, setStatusGalat] = useState(0);

    const muat = useCallback(async (signal) => {
        setMemuat(true);
        setGalat("");
        setStatusGalat(0);
        try {
            const hasil = await api.daftarPengguna({ signal });
            setRows(hasil.data || []);
        } catch (error) {
            if (error.name === "AbortError") return;
            setGalat(error.message);
            setStatusGalat(error.status || 0);
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

    const ditolak = statusGalat === 403;

    return (
        <div className="flex flex-col gap-5">
            <header>
                <h1 className="text-[20px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
                    Pengguna
                </h1>
                <p className="mt-1 text-[12.5px] text-muted">
                    Akun yang bisa mengakses aplikasi beserta perannya.
                </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2">
                {[
                    { label: "Total Akun", nilai: angka(rows.length) },
                    {
                        label: "Administrator",
                        nilai: angka(rows.filter((r) => r.role === "admin").length)
                    }
                ].map((k) => (
                    <Card key={k.label} className="p-5">
                        <p className="text-[11.5px] font-medium text-muted">{k.label}</p>
                        <p className="tabular mt-2 text-[19px] font-extrabold tracking-[-0.02em] text-ink">
                            {memuat ? "—" : k.nilai}
                        </p>
                    </Card>
                ))}
            </div>

            <Card className="p-5">
                <h2 className="text-[16.5px] font-bold tracking-[-0.01em] text-ink">
                    Daftar Pengguna
                </h2>

                <div className="mt-4">
                    {galat ? (
                        ditolak ? (
                            <Kosong
                                ikon={IconShield}
                                judul="Akses terbatas untuk admin"
                                keterangan="Endpoint GET /api/users hanya bisa dibuka oleh peran admin. Masuk sebagai admin untuk melihat daftar ini."
                            />
                        ) : (
                            <Galat pesan={galat} onCobaLagi={() => muat()} />
                        )
                    ) : memuat ? (
                        <div className="flex flex-col gap-2">
                            {Array.from({ length: 2 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 py-2">
                                    <Skeleton className="size-9 rounded-full" />
                                    <Skeleton className="h-3 w-28" />
                                </div>
                            ))}
                        </div>
                    ) : rows.length === 0 ? (
                        <Kosong ikon={IconUser} judul="Belum ada pengguna" />
                    ) : (
                        <ul className="flex flex-col">
                            {rows.map((u, i) => (
                                <li
                                    key={u.id}
                                    className="anim-fade flex items-center gap-3 border-b border-line-soft py-3.5 last:border-b-0"
                                    style={{ animationDelay: `${i * 40}ms` }}
                                >
                                    <span
                                        className={`grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[12px] font-bold text-white ${warnaAvatar(
                                            u.nama
                                        )}`}
                                    >
                                        {inisial(u.nama, 1)}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-semibold text-ink">
                                            {u.nama}
                                        </p>
                                        <p className="truncate text-[11.5px] text-muted">
                                            Bergabung {tanggalSaja(u.created_at)}
                                        </p>
                                    </div>

                                    <span className="tabular hidden text-[12px] text-subtle sm:block">
                                        {angka(u.jumlah_transaksi)} transaksi
                                    </span>

                                    <Badge tone={u.role === "admin" ? "netral" : "redup"}>
                                        {NAMA_ROLE[u.role] || u.role}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </Card>
        </div>
    );
}
