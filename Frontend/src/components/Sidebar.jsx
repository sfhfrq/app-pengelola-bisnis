import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import Logo from "./Logo.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { api } from "../api/client.js";
import {
    IconChart,
    IconDashboard,
    IconLogout,
    IconPackage,
    IconReceipt,
    IconSettings,
    IconUser,
    IconUsers
} from "./Icons.jsx";
import { inisial } from "../lib/format.js";

/**
 * Daftar menu sidebar.
 * Istilah disesuaikan dengan domain backend (produk, transaksi, pengguna)
 * sementara susunan & gayanya tetap sama seperti gambar referensi.
 */
export const MENU = [
    { ke: "/", label: "Dashboard", Ikon: IconDashboard, tepat: true },
    { ke: "/produk", label: "Produk", Ikon: IconPackage },
    { ke: "/transaksi", label: "Transaksi", Ikon: IconReceipt },
    { ke: "/pelanggan", label: "Pelanggan", Ikon: IconUsers },
    { ke: "/pengguna", label: "Pengguna", Ikon: IconUser, khususAdmin: true },
    { ke: "/laporan", label: "Laporan", Ikon: IconChart },
    { ke: "/pengaturan", label: "Pengaturan", Ikon: IconSettings }
];

const NAMA_ROLE = { admin: "Administrator", kasir: "Kasir" };

function ItemMenu({ item, onKlik }) {
    const { ke, label, Ikon, tepat } = item;
    return (
        <NavLink
            to={ke}
            end={tepat}
            onClick={onKlik}
            className={({ isActive }) =>
                [
                    "group flex h-11 items-center gap-3 rounded-full px-4 text-[13.5px] font-semibold transition-colors duration-200",
                    isActive
                        ? "bg-ink text-white shadow-[0_10px_22px_-12px_rgba(13,13,15,0.85)]"
                        : "text-subtle hover:bg-[#f6f7f8] hover:text-ink"
                ].join(" ")
            }
        >
            {({ isActive }) => (
                <>
                    <span
                        className={
                            isActive
                                ? "text-white"
                                : "text-[#a2a7ae] transition-colors duration-200 group-hover:text-ink"
                        }
                    >
                        <Ikon size={18} />
                    </span>
                    <span className="truncate">{label}</span>
                </>
            )}
        </NavLink>
    );
}

export default function Sidebar({ onNavigasi, className = "" }) {
    const { user, keluar, admin } = useAuth();
    const [tertunda, setTertunda] = useState(0);

    const namaTampil = user?.nama || "Pengguna";
    const roleTampil = NAMA_ROLE[user?.role] || user?.role || "-";

    // Menu khusus admin disembunyikan, bukan sekadar dinonaktifkan —
    // backend juga menolak aksesnya dengan 403.
    const menuTampil = MENU.filter((item) => !item.khususAdmin || admin);

    // Angka di lencana avatar = jumlah transaksi yang menunggu pembayaran.
    // Query-nya sengaja seringan mungkin (limit 1) karena yang dipakai
    // hanyalah nilai `meta.total`.
    useEffect(() => {
        const controller = new AbortController();
        api.daftarTransaksi({ status: "PENDING", limit: 1, signal: controller.signal })
            .then((hasil) => setTertunda(Number(hasil?.meta?.total) || 0))
            .catch(() => setTertunda(0));
        return () => controller.abort();
    }, []);

    return (
        <aside
            className={`w-[236px] shrink-0 flex-col justify-between border-r border-line bg-white ${className}`}
        >
            <div>
                <div className="flex items-center gap-2.5 px-6 pt-7">
                    <Logo size={28} className="text-ink" />
                    <span className="text-[15.5px] leading-none font-extrabold tracking-[-0.02em] text-ink">
                        Pengelola Bisnis
                    </span>
                </div>

                <nav className="mt-9 flex flex-col gap-1 px-3.5">
                    {menuTampil.map((item) => (
                        <ItemMenu key={item.ke} item={item} onKlik={onNavigasi} />
                    ))}
                </nav>
            </div>

            <div className="px-5 pt-6 pb-6">
                <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                        <div className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-[13px] font-bold text-white ring-2 ring-white">
                            {inisial(namaTampil, 1)}
                        </div>
                        {/* Lencana notifikasi: transaksi yang belum lunas.
                            Disembunyikan kalau tidak ada. */}
                        {tertunda > 0 ? (
                            <span
                                title={`${tertunda} transaksi menunggu pembayaran`}
                                className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[9.5px] font-bold text-white ring-2 ring-white"
                            >
                                {tertunda > 99 ? "99+" : tertunda}
                            </span>
                        ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-ink">{namaTampil}</p>
                        <p className="truncate text-[11px] text-muted">{roleTampil}</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => keluar()}
                        title="Keluar"
                        aria-label="Keluar dari akun"
                        className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-chip hover:text-ink"
                    >
                        <IconLogout size={15} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
