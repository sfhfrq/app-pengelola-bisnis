/**
 * Logo "Pengelola Bisnis" — dua chevron bertumpuk, mengikuti gaya
 * logo pada gambar referensi (bentuk geometris bersusun, satu warna).
 */
export default function Logo({ size = 30, className = "" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            <path d="M16 3.2 29.2 10.4 16 17.6 2.8 10.4z" fill="currentColor" />
            <path
                d="M16 14.9 29.2 22.1 16 29.3 2.8 22.1z"
                fill="currentColor"
                opacity="0.45"
            />
        </svg>
    );
}
