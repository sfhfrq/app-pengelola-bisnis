import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { IconAlert, IconCheck, IconInfo, IconX } from "./Icons.jsx";

const ToastContext = createContext(null);

const GAYA = {
    sukses: { ikon: IconCheck, cincin: "bg-[#e8f5ee] text-[#0f6b3d]" },
    galat: { ikon: IconAlert, cincin: "bg-[#fdecea] text-[#b3231a]" },
    info: { ikon: IconInfo, cincin: "bg-chip text-subtle" }
};

export function ToastProvider({ children }) {
    const [daftar, setDaftar] = useState([]);
    const idRef = useRef(0);

    const tutup = useCallback((id) => {
        setDaftar((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const tampilkan = useCallback(
        (jenis, pesan, opsi = {}) => {
            const id = (idRef.current += 1);
            setDaftar((prev) => [...prev, { id, jenis, pesan, judul: opsi.judul }]);
            window.setTimeout(() => tutup(id), opsi.durasi ?? 4000);
            return id;
        },
        [tutup]
    );

    const nilai = useMemo(
        () => ({
            sukses: (pesan, opsi) => tampilkan("sukses", pesan, opsi),
            galat: (pesan, opsi) => tampilkan("galat", pesan, opsi),
            info: (pesan, opsi) => tampilkan("info", pesan, opsi)
        }),
        [tampilkan]
    );

    return (
        <ToastContext.Provider value={nilai}>
            {children}

            <div className="pointer-events-none fixed top-5 right-5 z-[60] flex w-[min(360px,calc(100vw-40px))] flex-col gap-2.5">
                {daftar.map((t) => {
                    const gaya = GAYA[t.jenis] || GAYA.info;
                    const Ikon = gaya.ikon;
                    return (
                        <div
                            key={t.id}
                            role="status"
                            className="anim-slide-left pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 shadow-[0_12px_32px_-12px_rgba(13,13,15,0.25)]"
                        >
                            <span className={`grid size-7 shrink-0 place-items-center rounded-full ${gaya.cincin}`}>
                                <Ikon size={15} />
                            </span>
                            <div className="min-w-0 flex-1">
                                {t.judul ? (
                                    <p className="text-[13px] font-bold text-ink">{t.judul}</p>
                                ) : null}
                                <p className="text-[12.5px] leading-snug text-subtle">{t.pesan}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => tutup(t.id)}
                                aria-label="Tutup notifikasi"
                                className="grid size-6 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-ink"
                            >
                                <IconX size={13} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast harus dipakai di dalam <ToastProvider>");
    return ctx;
}
