/**
 * Badge status berbentuk pill.
 *
 * Tone "netral" (default) sengaja dibuat abu-abu terang persis seperti
 * badge "Pending"/"Active"/"Expired" di gambar referensi. Tone lain hanya
 * varian tipis dari keluarga warna yang sama supaya tampilan tetap kalem.
 */
const TONE = {
    netral: "bg-chip text-[#4b5057]",
    redup: "bg-[#f6f7f8] text-[#9aa0a6]",
    gelap: "bg-ink text-white",
    peringatan: "bg-[#fdf3e3] text-[#9a6207]",
    bahaya: "bg-[#fdecea] text-[#b3231a]",
    sukses: "bg-[#e8f5ee] text-[#0f6b3d]"
};

export default function Badge({ children, tone = "netral", className = "" }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-[5px] text-[11px] font-semibold whitespace-nowrap ${
                TONE[tone] || TONE.netral
            } ${className}`}
        >
            {children}
        </span>
    );
}
