import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Logo from "./Logo.jsx";
import Sidebar from "./Sidebar.jsx";
import { IconX } from "./Icons.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

/**
 * Kerangka aplikasi: panel putih membulat berisi sidebar + area konten.
 * Di layar kecil sidebar berubah menjadi laci (drawer) yang bisa dibuka.
 */
export default function AppShell() {
    const [laci, setLaci] = useState(false);
    const { pesanSesi, bersihkanPesanSesi } = useAuth();
    const lokasi = useLocation();

    // Tutup laci setiap kali pindah halaman.
    useEffect(() => {
        setLaci(false);
    }, [lokasi.pathname]);

    return (
        <div className="min-h-screen bg-frame p-0 sm:p-4 lg:p-6">
            {/* overflow-clip (bukan overflow-hidden) supaya sudut membulat tetap
                memotong isi, TANPA membuat scroll container baru — dengan begitu
                sidebar bisa memakai position: sticky dan profil pengguna tetap
                terlihat saat halaman di-scroll. */}
            <div className="relative mx-auto flex min-h-screen w-full max-w-[1560px] overflow-clip bg-white shadow-[0_28px_80px_-36px_rgba(13,13,15,0.35)] sm:min-h-[calc(100vh-2rem)] sm:rounded-[28px] lg:min-h-[calc(100vh-3rem)]">
                {/* Sidebar tetap — hanya di layar besar. */}
                <Sidebar className="hidden lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-3rem)]" />

                {/* Laci sidebar untuk layar kecil. */}
                {laci ? (
                    <div className="fixed inset-0 z-40 lg:hidden">
                        <div
                            className="anim-fade absolute inset-0 bg-ink/40"
                            onClick={() => setLaci(false)}
                            aria-hidden="true"
                        />
                        <div className="anim-slide-left relative h-full">
                            <Sidebar
                                className="flex h-full"
                                onNavigasi={() => setLaci(false)}
                            />
                            <button
                                type="button"
                                onClick={() => setLaci(false)}
                                aria-label="Tutup menu"
                                className="absolute top-6 -right-11 grid size-8 place-items-center rounded-full bg-white text-ink shadow-md"
                            >
                                <IconX size={15} />
                            </button>
                        </div>
                    </div>
                ) : null}

                <main className="flex min-w-0 flex-1 flex-col bg-canvas">
                    {/* Bar atas khusus layar kecil. */}
                    <div className="flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
                        <button
                            type="button"
                            onClick={() => setLaci(true)}
                            aria-label="Buka menu"
                            className="grid size-9 place-items-center rounded-full text-subtle transition-colors hover:bg-chip hover:text-ink"
                        >
                            <span className="flex flex-col gap-[3px]">
                                <span className="block h-[1.6px] w-4 rounded bg-current" />
                                <span className="block h-[1.6px] w-4 rounded bg-current" />
                                <span className="block h-[1.6px] w-4 rounded bg-current" />
                            </span>
                        </button>
                        <Logo size={22} className="text-ink" />
                        <span className="text-[13.5px] font-extrabold tracking-[-0.02em] text-ink">
                            Pengelola Bisnis
                        </span>
                    </div>

                    {pesanSesi ? (
                        <div className="anim-drop flex items-center justify-between gap-3 border-b border-[#f6dfa8] bg-[#fdf6e6] px-5 py-2.5 text-[12.5px] text-[#8a6206] lg:px-7">
                            <span>{pesanSesi}</span>
                            <button
                                type="button"
                                onClick={bersihkanPesanSesi}
                                className="text-[12px] font-semibold underline"
                            >
                                Tutup
                            </button>
                        </div>
                    ) : null}

                    <div className="flex-1 p-4 sm:p-5 lg:p-7">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
