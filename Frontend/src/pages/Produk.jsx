import PanelProduk from "../components/PanelProduk.jsx";

/**
 * Halaman Produk — halaman kerja untuk tabel yang sama dengan yang
 * tampil di dashboard, ditambah kotak pencarian dan ukuran halaman lebih besar.
 * Tambah / ubah / hapus dikirim ke API backend (khusus peran admin).
 */
export default function Produk() {
    return (
        <div className="flex flex-col gap-5">
            <header>
                <h1 className="text-[20px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
                    Produk
                </h1>
                <p className="mt-1 text-[12.5px] text-muted">
                    Kelola katalog produk: harga, stok, dan status ketersediaan.
                </p>
            </header>

            <PanelProduk judul="Daftar Produk" tampilCari ukuranHalaman={8} />
        </div>
    );
}
