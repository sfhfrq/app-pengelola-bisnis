import { useState } from "react";

import Badge from "../components/Badge.jsx";
import { Button, Card } from "../components/ui.jsx";
import { IconLogout, IconRefresh, IconShield } from "../components/Icons.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { useToast } from "../components/Toast.jsx";

const NAMA_ROLE = { admin: "Administrator", kasir: "Kasir" };

// Ditampilkan apa adanya ke pengguna, jadi harus mencerminkan konfigurasi
// build yang sedang berjalan — bukan nilai dev yang di-hardcode.
const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const CARA_AKSES = import.meta.env.VITE_API_BASE
    ? "Langsung ke backend cloud"
    : "Lewat proxy dev Vite (:3000)";

/**
 * Halaman Pengaturan — menampilkan sesi yang sedang aktif dan
 * memungkinkan pengujian koneksi ke backend secara langsung.
 */
export default function Pengaturan() {
    const { user, keluar } = useAuth();
    const toast = useToast();

    const [menguji, setMenguji] = useState(false);
    const [hasilUji, setHasilUji] = useState(null);

    const ujiKoneksi = async () => {
        setMenguji(true);
        setHasilUji(null);
        const mulai = performance.now();
        try {
            const hasil = await api.ringkasan({});
            const ms = Math.round(performance.now() - mulai);
            setHasilUji({
                ok: true,
                pesan: `Backend merespons dalam ${ms} ms`,
                detail: `${hasil.data.statistik.total_produk} produk, ${hasil.data.statistik.total_transaksi} transaksi`
            });
            toast.sukses("Koneksi ke backend berhasil.");
        } catch (error) {
            setHasilUji({ ok: false, pesan: error.message });
            toast.galat(error.message);
        } finally {
            setMenguji(false);
        }
    };

    const ENDPOINT = [
        { metode: "POST", path: "/api/auth/login", ket: "Masuk & menerbitkan token JWT" },
        { metode: "GET", path: "/api/dashboard/ringkasan", ket: "Statistik, grafik, transaksi pending" },
        { metode: "GET", path: "/api/produk", ket: "Daftar produk + filter status & paginasi" },
        { metode: "POST", path: "/api/produk", ket: "Tambah produk (admin)" },
        { metode: "PUT", path: "/api/produk/:id", ket: "Ubah produk (admin)" },
        { metode: "DELETE", path: "/api/produk/:id", ket: "Soft delete produk (admin)" },
        { metode: "GET", path: "/api/transaksi", ket: "Daftar transaksi + filter & paginasi" },
        { metode: "POST", path: "/api/transaksi", ket: "Buat transaksi baru" },
        { metode: "GET", path: "/api/transaksi/:id", ket: "Rincian item satu transaksi" },
        { metode: "GET", path: "/api/users", ket: "Daftar pengguna (admin)" }
    ];

    return (
        <div className="flex flex-col gap-5">
            <header>
                <h1 className="text-[20px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
                    Pengaturan
                </h1>
                <p className="mt-1 text-[12.5px] text-muted">
                    Informasi sesi dan status koneksi ke backend.
                </p>
            </header>

            <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
                <Card className="p-5">
                    <h2 className="text-[16.5px] font-bold tracking-[-0.01em] text-ink">
                        Akun Aktif
                    </h2>

                    <dl className="mt-4 flex flex-col gap-3.5">
                        {[
                            { label: "Nama", nilai: user?.nama },
                            { label: "Peran", nilai: NAMA_ROLE[user?.role] || user?.role },
                            { label: "ID Pengguna", nilai: user?.id }
                        ].map((f) => (
                            <div key={f.label} className="flex items-center justify-between gap-4">
                                <dt className="text-[12px] text-muted">{f.label}</dt>
                                <dd className="text-[13px] font-semibold text-ink">{f.nilai ?? "-"}</dd>
                            </div>
                        ))}
                    </dl>

                    <div className="mt-5 flex items-center gap-2 rounded-2xl bg-canvas px-4 py-3">
                        <IconShield size={16} className="shrink-0 text-subtle" />
                        <p className="text-[11.5px] leading-snug text-subtle">
                            Token JWT dikirim pada header{" "}
                            <code className="rounded bg-white px-1.5 py-0.5 text-[11px]">
                                Authorization
                            </code>{" "}
                            dan otomatis kedaluwarsa setelah 1 jam.
                        </p>
                    </div>

                    <Button
                        variasi="terang"
                        ikon={IconLogout}
                        className="mt-4 w-full"
                        onClick={() => keluar()}
                    >
                        Keluar dari akun
                    </Button>
                </Card>

                <Card className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-[16.5px] font-bold tracking-[-0.01em] text-ink">
                            Koneksi Backend
                        </h2>
                        <Button ikon={IconRefresh} ukuran="sm" onClick={ujiKoneksi} disabled={menguji}>
                            {menguji ? "Menguji…" : "Uji koneksi"}
                        </Button>
                    </div>

                    <dl className="mt-4 flex flex-col gap-3.5">
                        <div className="flex items-start justify-between gap-4">
                            <dt className="shrink-0 text-[12px] text-muted">Alamat API</dt>
                            <dd className="font-mono text-[12px] font-semibold break-all text-ink">
                                {API_BASE}
                            </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                            <dt className="shrink-0 text-[12px] text-muted">Cara akses</dt>
                            <dd className="text-right text-[12px] font-semibold text-ink">
                                {CARA_AKSES}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <dt className="text-[12px] text-muted">Status</dt>
                            <dd>
                                {hasilUji ? (
                                    <Badge tone={hasilUji.ok ? "sukses" : "bahaya"}>
                                        {hasilUji.ok ? "Terhubung" : "Gagal"}
                                    </Badge>
                                ) : (
                                    <Badge>Belum diuji</Badge>
                                )}
                            </dd>
                        </div>
                    </dl>

                    {hasilUji ? (
                        <div
                            className={`anim-drop mt-4 rounded-2xl px-4 py-3 text-[12px] leading-snug ${
                                hasilUji.ok
                                    ? "bg-[#e8f5ee] text-[#0f6b3d]"
                                    : "bg-[#fdecea] text-[#b3231a]"
                            }`}
                        >
                            <p className="font-semibold">{hasilUji.pesan}</p>
                            {hasilUji.detail ? <p className="mt-0.5">{hasilUji.detail}</p> : null}
                        </div>
                    ) : null}
                </Card>
            </div>

            <Card className="p-5">
                <h2 className="text-[16.5px] font-bold tracking-[-0.01em] text-ink">
                    Endpoint yang Dipakai
                </h2>
                <p className="mt-1 text-[12px] text-muted">
                    Semua permintaan di bawah ini dilayani oleh Express di port 3000.
                </p>

                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[560px] border-separate border-spacing-0">
                        <tbody>
                            {ENDPOINT.map((e) => (
                                <tr key={`${e.metode}-${e.path}`}>
                                    <td className="w-[92px] border-b border-line-soft py-2.5">
                                        <span className="rounded-md bg-canvas px-2 py-1 font-mono text-[10.5px] font-bold text-subtle">
                                            {e.metode}
                                        </span>
                                    </td>
                                    <td className="border-b border-line-soft py-2.5 pr-4 font-mono text-[11.5px] font-semibold text-ink">
                                        {e.path}
                                    </td>
                                    <td className="border-b border-line-soft py-2.5 text-[12px] text-muted">
                                        {e.ket}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
