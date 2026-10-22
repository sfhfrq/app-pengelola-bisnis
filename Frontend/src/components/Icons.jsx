/**
 * Kumpulan ikon garis (outline) yang digambar sendiri sebagai SVG.
 *
 * Alasan tidak memakai paket ikon: ikon di gambar referensi semuanya
 * bergaya garis tipis dengan sudut membulat, dan dengan menulisnya
 * langsung kita bisa menyamakan ketebalan garis (1.6) serta ukurannya
 * tanpa perlu menimpa style bawaan pustaka.
 */

const Svg = ({ children, size = 20, strokeWidth = 1.6, className = "", ...rest }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        focusable="false"
        {...rest}
    >
        {children}
    </svg>
);

export const IconDashboard = (p) => (
    <Svg {...p}>
        <rect width="7" height="7" x="3" y="3" rx="1.6" />
        <rect width="7" height="7" x="14" y="3" rx="1.6" />
        <rect width="7" height="7" x="14" y="14" rx="1.6" />
        <rect width="7" height="7" x="3" y="14" rx="1.6" />
    </Svg>
);

export const IconPackage = (p) => (
    <Svg {...p}>
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
    </Svg>
);

export const IconReceipt = (p) => (
    <Svg {...p}>
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <path d="M12 17.5v-11" />
    </Svg>
);

export const IconUsers = (p) => (
    <Svg {...p}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
);

export const IconUser = (p) => (
    <Svg {...p}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </Svg>
);

export const IconChart = (p) => (
    <Svg {...p}>
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="M18 17V9" />
        <path d="M13 17V5" />
        <path d="M8 17v-3" />
    </Svg>
);

export const IconSettings = (p) => (
    <Svg {...p}>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </Svg>
);

export const IconClock = (p) => (
    <Svg {...p}>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 7v5.2l3.2 1.9" />
    </Svg>
);

export const IconAlert = (p) => (
    <Svg {...p}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
    </Svg>
);

/** Ikon larangan — dipakai untuk aksi membatalkan transaksi. */
export const IconBan = (p) => (
    <Svg {...p}>
        <circle cx="12" cy="12" r="9.5" />
        <path d="m5.6 5.6 12.8 12.8" />
    </Svg>
);

export const IconClipboard = (p) => (
    <Svg {...p}>
        <rect width="8" height="4" x="8" y="2" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M12 11h4" />
        <path d="M12 16h4" />
        <path d="M8 11h.01" />
        <path d="M8 16h.01" />
    </Svg>
);

export const IconWallet = (p) => (
    <Svg {...p}>
        <path d="M19 7V5a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14a1 1 0 0 1 1 1v3h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-1" />
        <path d="M3 6v13a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3" />
    </Svg>
);

export const IconTrending = (p) => (
    <Svg {...p}>
        <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
        <path d="M16 7h6v6" />
    </Svg>
);

export const IconChevronDown = (p) => (
    <Svg {...p}>
        <path d="m6 9 6 6 6-6" />
    </Svg>
);

export const IconSearch = (p) => (
    <Svg {...p}>
        <circle cx="11" cy="11" r="7.5" />
        <path d="m20.5 20.5-4-4" />
    </Svg>
);

export const IconPlus = (p) => (
    <Svg {...p}>
        <path d="M5 12h14" />
        <path d="M12 5v14" />
    </Svg>
);

export const IconMinus = (p) => (
    <Svg {...p}>
        <path d="M5 12h14" />
    </Svg>
);

export const IconPencil = (p) => (
    <Svg {...p}>
        <path d="M21.2 6.8a2.4 2.4 0 0 0-3.4-3.4L3.9 17.3a2 2 0 0 0-.5.9l-1.3 4.3a.5.5 0 0 0 .6.6l4.3-1.3a2 2 0 0 0 .9-.5Z" />
        <path d="m15 5 4 4" />
    </Svg>
);

export const IconTrash = (p) => (
    <Svg {...p}>
        <path d="M3 6h18" />
        <path d="M19 6v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
    </Svg>
);

export const IconX = (p) => (
    <Svg {...p}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </Svg>
);

export const IconArrowUp = (p) => (
    <Svg {...p}>
        <path d="m5 12 7-7 7 7" />
        <path d="M12 19V5" />
    </Svg>
);

export const IconLogout = (p) => (
    <Svg {...p}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
    </Svg>
);

export const IconRefresh = (p) => (
    <Svg {...p}>
        <path d="M3 12a9 9 0 0 1 9-9 9.7 9.7 0 0 1 6.7 2.7L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.7 9.7 0 0 1-6.7-2.7L3 16" />
        <path d="M8 16H3v5" />
    </Svg>
);

export const IconDownload = (p) => (
    <Svg {...p}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5" />
        <path d="M12 15V3" />
    </Svg>
);

export const IconDots = (p) => (
    <Svg {...p}>
        <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </Svg>
);

export const IconCheck = (p) => (
    <Svg {...p}>
        <path d="M20 6 9 17l-5-5" />
    </Svg>
);

export const IconBell = (p) => (
    <Svg {...p}>
        <path d="M10.3 21a2 2 0 0 0 3.4 0" />
        <path d="M3.3 15.3A1 1 0 0 0 4 17h16a1 1 0 0 0 .7-1.7C19.4 14 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.4 6-2.7 7.3" />
    </Svg>
);

export const IconInfo = (p) => (
    <Svg {...p}>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
    </Svg>
);

export const IconShield = (p) => (
    <Svg {...p}>
        <path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
    </Svg>
);

export const IconMail = (p) => (
    <Svg {...p}>
        <rect width="20" height="16" x="2" y="4" rx="2.5" />
        <path d="m2.5 7 9 5.7a1.9 1.9 0 0 0 2 0l9-5.7" />
    </Svg>
);

export const IconBox = (p) => (
    <Svg {...p}>
        <path d="M3 8.5 12 3l9 5.5v7L12 21l-9-5.5z" />
        <path d="M3 8.5 12 14l9-5.5" />
        <path d="M12 14v7" />
    </Svg>
);
