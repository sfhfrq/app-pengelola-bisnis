import { IconAlert, IconRefresh } from "./Icons.jsx";

/** Kartu putih dengan tepi tipis — bentuk dasar semua panel dashboard. */
export function Card({ children, className = "", ...rest }) {
    return (
        <section
            className={`rounded-[22px] border border-line bg-white ${className}`}
            {...rest}
        >
            {children}
        </section>
    );
}

const VARIASI = {
    gelap: "bg-ink text-white hover:bg-[#242427] disabled:hover:bg-ink",
    terang:
        "bg-white text-ink border border-line hover:bg-[#fafafa] disabled:hover:bg-white",
    hantu: "bg-transparent text-subtle hover:bg-chip hover:text-ink",
    // Dipakai untuk aksi merusak (mis. membatalkan transaksi).
    bahaya: "bg-[#b3231a] text-white hover:bg-[#981d15] disabled:hover:bg-[#b3231a]"
};

const UKURAN = {
    sm: "h-9 px-3.5 text-[12.5px]",
    md: "h-10 px-4 text-[13px]",
    lg: "h-11 px-5 text-[13.5px]"
};

export function Button({
    children,
    variasi = "gelap",
    ukuran = "md",
    ikon: Ikon,
    className = "",
    ...rest
}) {
    return (
        <button
            type="button"
            className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-55 ${
                VARIASI[variasi] || VARIASI.gelap
            } ${UKURAN[ukuran] || UKURAN.md} ${className}`}
            {...rest}
        >
            {Ikon ? <Ikon size={15} /> : null}
            {children}
        </button>
    );
}

export function IconButton({ ikon: Ikon, label, className = "", ...rest }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={`grid size-8 shrink-0 place-items-center rounded-full text-subtle transition-colors duration-200 hover:bg-chip hover:text-ink ${className}`}
            {...rest}
        >
            <Ikon size={16} />
        </button>
    );
}

/** Kerangka abu-abu saat data sedang dimuat. */
export function Skeleton({ className = "", style }) {
    return (
        <div
            className={`animate-pulse rounded-lg bg-[#eef0f2] ${className}`}
            style={style}
        />
    );
}

/** Tampilan saat daftar kosong (bukan error). */
export function Kosong({ ikon: Ikon, judul, keterangan, aksi }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            {Ikon ? (
                <span className="grid size-12 place-items-center rounded-full bg-chip text-muted">
                    <Ikon size={22} />
                </span>
            ) : null}
            <div>
                <p className="text-[13.5px] font-bold text-ink">{judul}</p>
                {keterangan ? (
                    <p className="mx-auto mt-1 max-w-[320px] text-[12.5px] leading-relaxed text-muted">
                        {keterangan}
                    </p>
                ) : null}
            </div>
            {aksi}
        </div>
    );
}

/** Tampilan saat pemuatan gagal, lengkap dengan tombol coba lagi. */
export function Galat({ pesan, onCobaLagi }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-[#fdecea] text-[#b3231a]">
                <IconAlert size={22} />
            </span>
            <div>
                <p className="text-[13.5px] font-bold text-ink">Gagal memuat data</p>
                <p className="mx-auto mt-1 max-w-[360px] text-[12.5px] leading-relaxed text-muted">
                    {pesan}
                </p>
            </div>
            {onCobaLagi ? (
                <Button variasi="terang" ukuran="sm" ikon={IconRefresh} onClick={onCobaLagi}>
                    Coba lagi
                </Button>
            ) : null}
        </div>
    );
}

/** Judul panel dengan aksi opsional di sisi kanan. */
export function JudulPanel({ children, aksi }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[16.5px] font-bold tracking-[-0.01em] text-ink">
                {children}
            </h2>
            {aksi}
        </div>
    );
}
