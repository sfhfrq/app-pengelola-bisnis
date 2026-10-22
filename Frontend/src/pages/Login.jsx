import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import Logo from "../components/Logo.jsx";
import { Button } from "../components/ui.jsx";
import { IconAlert, IconInfo } from "../components/Icons.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

/**
 * Halaman masuk.
 *
 * Backend melindungi /api/produk, /api/transaksi, /api/dashboard, dan
 * /api/users dengan JWT, jadi frontend memang harus login dulu.
 * Token disimpan di localStorage dan dikirim sebagai header
 * "Authorization: Bearer <token>" oleh klien API.
 */
export default function Login() {
    const { masuk, masukSudah, sedangMasuk, pesanSesi, bersihkanPesanSesi } = useAuth();
    const navigate = useNavigate();

    const [nama, setNama] = useState("admin");
    const [password, setPassword] = useState("admin123");
    const [galat, setGalat] = useState("");

    useEffect(() => {
        bersihkanPesanSesi();
        // sengaja hanya saat mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (masukSudah) return <Navigate to="/" replace />;

    const kirim = async (e) => {
        e.preventDefault();
        setGalat("");

        if (!nama.trim() || !password) {
            setGalat("Nama dan password wajib diisi.");
            return;
        }

        try {
            await masuk(nama.trim(), password);
            navigate("/", { replace: true });
        } catch (error) {
            setGalat(error.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-frame p-4 sm:p-6">
            <div className="anim-rise w-full max-w-[400px] rounded-[26px] border border-line bg-white p-7 shadow-[0_28px_70px_-32px_rgba(13,13,15,0.35)] sm:p-8">
                <div className="flex items-center gap-2.5">
                    <Logo size={30} className="text-ink" />
                    <span className="text-[16px] leading-none font-extrabold tracking-[-0.02em] text-ink">
                        Pengelola Bisnis
                    </span>
                </div>

                <h1 className="mt-7 text-[21px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
                    Masuk ke dashboard
                </h1>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                    Gunakan akun yang terdaftar di database untuk mengakses data penjualan.
                </p>

                {pesanSesi ? (
                    <p className="anim-drop mt-5 flex items-start gap-2 rounded-xl bg-[#fdf6e6] px-3.5 py-2.5 text-[12px] leading-snug text-[#8a6206]">
                        <IconInfo size={14} className="mt-0.5 shrink-0" />
                        {pesanSesi}
                    </p>
                ) : null}

                <form onSubmit={kirim} className="mt-6 flex flex-col gap-4">
                    <div>
                        <label
                            htmlFor="nama"
                            className="mb-1.5 block text-[12px] font-semibold text-subtle"
                        >
                            Nama pengguna
                        </label>
                        <input
                            id="nama"
                            value={nama}
                            autoComplete="username"
                            onChange={(e) => setNama(e.target.value)}
                            className="h-11 w-full rounded-xl border border-line bg-white px-4 text-[13px] text-ink outline-none transition-colors focus:border-[#c9ccd1]"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1.5 block text-[12px] font-semibold text-subtle"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            autoComplete="current-password"
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 w-full rounded-xl border border-line bg-white px-4 text-[13px] text-ink outline-none transition-colors focus:border-[#c9ccd1]"
                        />
                    </div>

                    {galat ? (
                        <p className="flex items-start gap-2 rounded-xl bg-[#fdecea] px-3.5 py-2.5 text-[12.5px] leading-snug font-medium text-[#b3231a]">
                            <IconAlert size={14} className="mt-0.5 shrink-0" />
                            {galat}
                        </p>
                    ) : null}

                    <Button type="submit" ukuran="lg" disabled={sedangMasuk} className="mt-1 w-full">
                        {sedangMasuk ? "Memeriksa…" : "Masuk"}
                    </Button>
                </form>

                <div className="mt-6 rounded-2xl bg-canvas px-4 py-3.5">
                    <p className="text-[11px] font-bold tracking-wide text-subtle uppercase">
                        Akun demo
                    </p>
                    <ul className="mt-2 flex flex-col gap-1 text-[12px] text-subtle">
                        <li className="flex justify-between gap-4">
                            <span className="font-semibold text-ink">admin / admin123</span>
                            <span className="text-muted">Administrator</span>
                        </li>
                        <li className="flex justify-between gap-4">
                            <span className="font-semibold text-ink">budi / budi123</span>
                            <span className="text-muted">Kasir</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
