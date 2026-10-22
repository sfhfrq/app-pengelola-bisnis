import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState
} from "react";

import { api, setAuthBridge } from "../api/client.js";

const STORAGE_KEY = "pb.sesi.v1";

const AuthContext = createContext(null);

/**
 * Jembatan ke klien API dipasang di level modul (bukan di dalam useEffect).
 *
 * Alasannya: useEffect berjalan dari anak ke induk. Kalau jembatan dipasang
 * di useEffect milik AuthProvider, halaman anak yang langsung fetch saat
 * mount akan berjalan lebih dulu dan tokennya belum terpasang.
 */
const sesiRef = { current: null };
const keluarRef = { current: () => {} };

setAuthBridge({
    getToken: () => sesiRef.current?.token ?? null,
    onUnauthorized: () => keluarRef.current?.("Sesi Anda sudah berakhir. Silakan masuk lagi.")
});

const bacaSimpanan = () => {
    try {
        const mentah = localStorage.getItem(STORAGE_KEY);
        if (!mentah) return null;
        const parsed = JSON.parse(mentah);
        if (!parsed?.token) return null;
        return parsed;
    } catch {
        // localStorage bisa diblokir atau isinya rusak — anggap belum login.
        return null;
    }
};

export function AuthProvider({ children }) {
    const [sesi, setSesi] = useState(() => bacaSimpanan());
    const [sedangMasuk, setSedangMasuk] = useState(false);
    const [pesanSesi, setPesanSesi] = useState("");
    const simpanRef = useRef(true);

    const simpan = useCallback((berikut) => {
        setSesi(berikut);
        try {
            if (berikut) localStorage.setItem(STORAGE_KEY, JSON.stringify(berikut));
            else localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Mode privat / storage penuh: sesi tetap jalan untuk tab ini.
        }
    }, []);

    const keluar = useCallback(
        (alasan = "") => {
            simpan(null);
            setPesanSesi(alasan);
        },
        [simpan]
    );

    // Sinkronkan ref saat render supaya anak yang mount lebih dulu
    // tetap melihat token & handler logout yang benar.
    sesiRef.current = sesi;
    keluarRef.current = keluar;

    const masuk = useCallback(
        async (nama, password) => {
            setSedangMasuk(true);
            setPesanSesi("");
            try {
                const hasil = await api.login(nama, password);
                simpan({ token: hasil.token, user: hasil.user });
                return hasil.user;
            } finally {
                setSedangMasuk(false);
            }
        },
        [simpan]
    );

    const nilai = useMemo(
        () => ({
            token: sesi?.token ?? null,
            user: sesi?.user ?? null,
            masukSudah: Boolean(sesi?.token),
            admin: sesi?.user?.role === "admin",
            sedangMasuk,
            pesanSesi,
            bersihkanPesanSesi: () => setPesanSesi(""),
            masuk,
            keluar
        }),
        [sesi, sedangMasuk, pesanSesi, masuk, keluar]
    );

    return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
    return ctx;
}
