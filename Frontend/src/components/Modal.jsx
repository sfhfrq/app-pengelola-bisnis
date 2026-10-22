import { useEffect, useRef } from "react";
import { IconX } from "./Icons.jsx";

/**
 * Modal sederhana: backdrop gelap + panel membulat.
 * Animasi minimal — fade pada backdrop, pop kecil pada panel.
 */
export default function Modal({
    terbuka,
    onTutup,
    judul,
    deskripsi,
    children,
    footer,
    lebar = "max-w-lg",
    kelasBody
}) {
    const panelRef = useRef(null);

    // Simpan callback terbaru di ref. Ini memutus rantai:
    // arrow function baru → effect re-run → fokus dirampas.
    const onTutupRef = useRef(onTutup);
    useEffect(() => {
        onTutupRef.current = onTutup;
    }, [onTutup]);

    useEffect(() => {
        if (!terbuka) return undefined;

        const onKey = (e) => {
            if (e.key === "Escape") onTutupRef.current?.();
        };
        document.addEventListener("keydown", onKey);

        const overflowAsli = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        // Jangan rebut fokus kalau sudah ada elemen di dalam modal yang
        // memegang fokus (mis. input dengan autoFocus). Ini yang bikin
        // kursor lompat dari kolom "Nama Pembeli".
        const panel = panelRef.current;
        if (panel && !panel.contains(document.activeElement)) {
            panel.focus();
        }

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = overflowAsli;
        };
        // SENGAJA hanya [terbuka]: onTutup diakses via ref supaya effect
        // tidak re-run tiap render. Kalau ditambah onTutup di sini,
        // bug fokus hilang akan kembali.
    }, [terbuka]);

    if (!terbuka) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
            <div
                className="anim-fade absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
                onClick={onTutup}
                aria-hidden="true"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={judul}
                tabIndex={-1}
                className={`anim-pop relative w-full ${lebar} rounded-t-[24px] bg-white shadow-[0_24px_60px_-20px_rgba(13,13,15,0.35)] outline-none sm:rounded-[24px]`}
            >
                <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
                    <div>
                        <h3 className="text-[16px] font-bold text-ink">{judul}</h3>
                        {deskripsi ? (
                            <p className="mt-1 text-[12.5px] text-muted">{deskripsi}</p>
                        ) : null}
                    </div>
                    <button
                        type="button"
                        onClick={onTutup}
                        aria-label="Tutup"
                        className="grid size-8 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-ink"
                    >
                        <IconX size={16} />
                    </button>
                </div>

                <div className={kelasBody || "max-h-[65vh] overflow-y-auto px-6 py-5"}>
                    {children}
                </div>

                {footer ? (
                    <div className="flex items-center justify-end gap-2.5 border-t border-line px-6 py-4">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>
    );
}