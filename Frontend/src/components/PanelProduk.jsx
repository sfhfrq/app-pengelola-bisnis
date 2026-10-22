import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Badge from "./Badge.jsx";
import Modal from "./Modal.jsx";
import { useToast } from "./Toast.jsx";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import {
    IconBox,
    IconCheck,
    IconChevronDown,
    IconDots,
    IconDownload,
    IconPackage,
    IconPencil,
    IconPlus,
    IconSearch,
    IconTrash,
    IconX
} from "./Icons.jsx";
import { Button, Galat, Kosong, Skeleton } from "./ui.jsx";
import { metaStatusProduk, rupiah, tanggalSaja, warnaAvatar, inisial } from "../lib/format.js";

/** Kotak centang bergaya referensi: kotak membulat, terisi hitam saat aktif. */
function Check({ checked, onChange, label }) {
    return (
        <label className="relative grid cursor-pointer place-items-center" title={label}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                aria-label={label}
                className="peer size-[16px] cursor-pointer appearance-none rounded-[5px] border border-[#d9dbdf] bg-white transition-colors duration-200 checked:border-ink checked:bg-ink"
            />
            <IconCheck
                size={11}
                strokeWidth={2.4}
                className="pointer-events-none absolute text-white opacity-0 transition-opacity duration-200 peer-checked:opacity-100"
            />
        </label>
    );
}

const PILIHAN_STATUS = [
    { nilai: "", label: "Semua Status" },
    { nilai: "tersedia", label: "Tersedia" },
    { nilai: "menipis", label: "Stok Menipis" },
    { nilai: "habis", label: "Stok Habis" },
    { nilai: "nonaktif", label: "Nonaktif" }
];

const FORM_KOSONG = { nama_produk: "", harga: "", stok: "" };

const keCsv = (rows) => {
    const header = ["ID", "Nama Produk", "Harga", "Stok", "Status", "Ditambahkan"];
    const isi = rows.map((r) => [
        r.id,
        r.nama_produk,
        r.harga,
        r.stok,
        metaStatusProduk(r.status).label,
        tanggalSaja(r.created_at)
    ]);

    return [header, ...isi]
        .map((baris) =>
            baris
                .map((sel) => {
                    const teks = String(sel ?? "");
                    // Kutip bila mengandung pemisah, kutip, atau baris baru.
                    return /[";\n]/.test(teks) ? `"${teks.replace(/"/g, '""')}"` : teks;
                })
                .join(";")
        )
        .join("\r\n");
};

export default function PanelProduk({
    judul = "Kelola Produk",
    tampilCari = false,
    ukuranHalaman = 5,
    className = ""
}) {
    const toast = useToast();
    const { admin } = useAuth();

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [memuat, setMemuat] = useState(true);
    const [galat, setGalat] = useState("");

    const [cari, setCari] = useState("");
    const [cariTertunda, setCariTertunda] = useState("");
    const [status, setStatus] = useState("");
    const [halaman, setHalaman] = useState(0);

    const [terpilih, setTerpilih] = useState(() => new Set());
    const [menuId, setMenuId] = useState(null);

    const [form, setForm] = useState(null); // { mode: 'tambah'|'ubah', id?, data }
    const [menyimpan, setMenyimpan] = useState(false);
    const [galatForm, setGalatForm] = useState("");

    const [hapusTarget, setHapusTarget] = useState(null);
    const [menghapus, setMenghapus] = useState(false);

    const [sedangEkspor, setSedangEkspor] = useState(false);
    const menuRef = useRef(null);

    const offset = halaman * ukuranHalaman;

    const muat = useCallback(
        async (signal) => {
            setMemuat(true);
            setGalat("");
            try {
                const hasil = await api.daftarProduk({
                    cari: cari || undefined,
                    status: status || undefined,
                    limit: ukuranHalaman,
                    offset,
                    signal
                });
                setRows(hasil.data || []);
                setTotal(hasil.meta?.total ?? hasil.data?.length ?? 0);
            } catch (error) {
                if (error.name === "AbortError") return;
                setGalat(error.message);
                setRows([]);
                setTotal(0);
            } finally {
                setMemuat(false);
            }
        },
        [cari, status, ukuranHalaman, offset]
    );

    useEffect(() => {
        const controller = new AbortController();
        muat(controller.signal);
        return () => controller.abort();
    }, [muat]);

    // Pencarian ditunda 350 ms supaya tidak menembak API tiap ketikan.
    useEffect(() => {
        const t = window.setTimeout(() => {
            setCari(cariTertunda.trim());
            setHalaman(0);
        }, 350);
        return () => window.clearTimeout(t);
    }, [cariTertunda]);

    // Tutup menu "..." saat klik di luar.
    useEffect(() => {
        if (menuId === null) return undefined;
        const onKlik = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null);
        };
        document.addEventListener("mousedown", onKlik);
        return () => document.removeEventListener("mousedown", onKlik);
    }, [menuId]);

    const semuaTerpilih = rows.length > 0 && rows.every((r) => terpilih.has(r.id));

    const alihkanSemua = () => {
        setTerpilih((prev) => {
            const berikut = new Set(prev);
            if (semuaTerpilih) rows.forEach((r) => berikut.delete(r.id));
            else rows.forEach((r) => berikut.add(r.id));
            return berikut;
        });
    };

    const alihkanSatu = (id) => {
        setTerpilih((prev) => {
            const berikut = new Set(prev);
            if (berikut.has(id)) berikut.delete(id);
            else berikut.add(id);
            return berikut;
        });
    };

    const jumlahHalaman = Math.max(1, Math.ceil(total / ukuranHalaman));

    const unduh = async () => {
        setSedangEkspor(true);
        try {
            // Ambil ulang sampai 100 baris dengan filter yang sama supaya
            // file yang diunduh tidak terpotong oleh paginasi layar.
            const hasil = await api.daftarProduk({
                cari: cari || undefined,
                status: status || undefined,
                limit: 100,
                offset: 0
            });
            const sumber = hasil.data || [];
            const baris = terpilih.size
                ? sumber.filter((r) => terpilih.has(r.id))
                : sumber;

            if (baris.length === 0) {
                toast.info("Tidak ada data untuk diekspor.");
                return;
            }

            // BOM + pemisah ";" supaya Excel versi Indonesia langsung rapi.
            const blob = new Blob([`\uFEFF${keCsv(baris)}`], {
                type: "text/csv;charset=utf-8;"
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `produk-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            toast.sukses(`${baris.length} baris diekspor ke CSV.`);
        } catch (error) {
            toast.galat(error.message);
        } finally {
            setSedangEkspor(false);
        }
    };

    const bukaTambah = () => {
        setGalatForm("");
        setForm({ mode: "tambah", data: { ...FORM_KOSONG } });
    };

    const bukaUbah = (row) => {
        setMenuId(null);
        setGalatForm("");
        setForm({
            mode: "ubah",
            id: row.id,
            data: {
                nama_produk: row.nama_produk,
                harga: String(row.harga),
                stok: String(row.stok)
            }
        });
    };

    const simpan = async (e) => {
        e.preventDefault();
        if (!form) return;

        const nama = form.data.nama_produk.trim();
        const harga = Number(form.data.harga);
        const stok = Number(form.data.stok);

        // Validasi sisi klien — dicek lagi di backend, bukan pengganti.
        if (!nama) return setGalatForm("Nama produk wajib diisi.");
        if (!Number.isFinite(harga) || harga < 0)
            return setGalatForm("Harga harus berupa angka 0 atau lebih.");
        if (!Number.isInteger(stok) || stok < 0)
            return setGalatForm("Stok harus berupa bilangan bulat 0 atau lebih.");

        setMenyimpan(true);
        setGalatForm("");
        try {
            if (form.mode === "tambah") {
                await api.tambahProduk({ nama_produk: nama, harga, stok });
                toast.sukses(`Produk "${nama}" berhasil ditambahkan.`);
            } else {
                await api.ubahProduk(form.id, { nama_produk: nama, harga, stok });
                toast.sukses(`Produk "${nama}" berhasil diperbarui.`);
            }
            setForm(null);
            setHalaman(0);
            await muat();
        } catch (error) {
            setGalatForm(error.message);
        } finally {
            setMenyimpan(false);
        }
    };

    const konfirmasiHapus = async () => {
        if (!hapusTarget) return;
        setMenghapus(true);
        try {
            await api.hapusProduk(hapusTarget.id);
            toast.sukses(`Produk "${hapusTarget.nama_produk}" dihapus.`);
            setHapusTarget(null);
            setTerpilih((prev) => {
                const berikut = new Set(prev);
                berikut.delete(hapusTarget.id);
                return berikut;
            });
            await muat();
        } catch (error) {
            toast.galat(error.message);
        } finally {
            setMenghapus(false);
        }
    };

    const infoHalaman = useMemo(() => {
        if (total === 0) return "Tidak ada data";
        const mulai = offset + 1;
        const akhir = Math.min(offset + rows.length, total);
        return `Menampilkan ${mulai}–${akhir} dari ${total}`;
    }, [offset, rows.length, total]);

    return (
        <section className={`flex flex-col rounded-[22px] border border-line bg-white p-5 ${className}`}>
            {/* Kepala panel: judul + alat kontrol */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[16.5px] font-bold tracking-[-0.01em] text-ink">{judul}</h2>

                <div className="flex flex-wrap items-center gap-2.5">
                    {tampilCari ? (
                        <div className="relative">
                            <IconSearch
                                size={15}
                                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
                            />
                            <input
                                value={cariTertunda}
                                onChange={(e) => setCariTertunda(e.target.value)}
                                placeholder="Cari produk…"
                                className="h-10 w-[190px] rounded-full border border-line bg-white pr-4 pl-9 text-[12.5px] text-ink outline-none transition-colors placeholder:text-muted focus:border-[#d5d8dc]"
                            />
                        </div>
                    ) : null}

                    <div className="relative">
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setHalaman(0);
                            }}
                            aria-label="Filter status produk"
                            className="h-10 cursor-pointer appearance-none rounded-full border border-line bg-white pr-9 pl-4 text-[12.5px] font-semibold text-ink outline-none transition-colors hover:bg-[#fafafa] focus:border-[#d5d8dc]"
                        >
                            {PILIHAN_STATUS.map((p) => (
                                <option key={p.nilai} value={p.nilai}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                        <IconChevronDown
                            size={15}
                            className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted"
                        />
                    </div>

                    <Button
                        variasi="gelap"
                        ikon={IconDownload}
                        onClick={unduh}
                        disabled={sedangEkspor || memuat}
                    >
                        {sedangEkspor ? "Menyiapkan…" : "Export"}
                    </Button>

                    {admin ? (
                        <Button ikon={IconPlus} variasi="terang" onClick={bukaTambah}>
                            Tambah
                        </Button>
                    ) : null}
                </div>
            </div>

            {terpilih.size > 0 ? (
                <div className="anim-drop mt-3 flex items-center justify-between gap-3 rounded-2xl bg-canvas px-4 py-2.5">
                    <span className="text-[12px] font-semibold text-subtle">
                        {terpilih.size} produk dipilih
                    </span>
                    <button
                        type="button"
                        onClick={() => setTerpilih(new Set())}
                        className="flex items-center gap-1.5 text-[12px] font-semibold text-subtle transition-colors hover:text-ink"
                    >
                        <IconX size={13} />
                        Bersihkan pilihan
                    </button>
                </div>
            ) : null}

            {/* Isi tabel */}
            <div className="mt-4 flex-1">
                {galat ? (
                    <Galat pesan={galat} onCobaLagi={() => muat()} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] border-separate border-spacing-0">
                            <thead>
                                <tr>
                                    <th className="w-10 pb-3 text-left font-medium">
                                        <Check
                                            checked={semuaTerpilih}
                                            onChange={alihkanSemua}
                                            label="Pilih semua produk di halaman ini"
                                        />
                                    </th>
                                    <th className="pb-3 text-left text-[12px] font-medium text-muted">
                                        Produk
                                    </th>
                                    <th className="pb-3 text-left text-[12px] font-medium text-muted">
                                        Harga
                                    </th>
                                    <th className="pb-3 text-left text-[12px] font-medium text-muted">
                                        Stok
                                    </th>
                                    <th className="pb-3 text-left text-[12px] font-medium text-muted">
                                        Status
                                    </th>
                                    <th className="pb-3 text-left text-[12px] font-medium text-muted">
                                        Ditambahkan
                                    </th>
                                    <th className="w-10 pb-3" />
                                </tr>
                            </thead>

                            <tbody>
                                {memuat
                                    ? Array.from({ length: ukuranHalaman }).map((_, i) => (
                                          <tr key={`sk-${i}`}>
                                              <td className="py-3.5">
                                                  <Skeleton className="size-4 rounded-[5px]" />
                                              </td>
                                              <td className="py-3.5">
                                                  <div className="flex items-center gap-3">
                                                      <Skeleton className="size-8 rounded-xl" />
                                                      <Skeleton className="h-3 w-32" />
                                                  </div>
                                              </td>
                                              {[0, 1, 2, 3].map((k) => (
                                                  <td key={k} className="py-3.5">
                                                      <Skeleton className="h-3 w-16" />
                                                  </td>
                                              ))}
                                              <td className="py-3.5" />
                                          </tr>
                                      ))
                                    : rows.map((row, i) => {
                                          const meta = metaStatusProduk(row.status);
                                          return (
                                              <tr
                                                  key={row.id}
                                                  className="anim-fade group border-b border-line-soft"
                                                  style={{ animationDelay: `${i * 35}ms` }}
                                              >
                                                  <td className="border-b border-line-soft py-3.5">
                                                      <Check
                                                          checked={terpilih.has(row.id)}
                                                          onChange={() => alihkanSatu(row.id)}
                                                          label={`Pilih ${row.nama_produk}`}
                                                      />
                                                  </td>

                                                  <td className="border-b border-line-soft py-3.5 pr-4">
                                                      <div className="flex items-center gap-3">
                                                          <span
                                                              className={`grid size-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-[11px] font-bold text-white ${warnaAvatar(
                                                                  row.nama_produk || ""
                                                              )}`}
                                                          >
                                                              {inisial(row.nama_produk || "?", 1)}
                                                          </span>
                                                          <span className="text-[13px] font-semibold text-ink">
                                                              {row.nama_produk}
                                                          </span>
                                                      </div>
                                                  </td>

                                                  <td className="tabular border-b border-line-soft py-3.5 pr-4 text-[13px] font-medium text-subtle">
                                                      {rupiah(row.harga)}
                                                  </td>

                                                  <td className="tabular border-b border-line-soft py-3.5 pr-4 text-[13px] font-medium text-subtle">
                                                      {row.stok}
                                                  </td>

                                                  <td className="border-b border-line-soft py-3.5 pr-4">
                                                      <Badge tone={meta.tone}>{meta.label}</Badge>
                                                  </td>

                                                  <td className="border-b border-line-soft py-3.5 pr-4 text-[12.5px] whitespace-nowrap text-muted">
                                                      {tanggalSaja(row.created_at)}
                                                  </td>

                                                  <td className="relative border-b border-line-soft py-3.5">
                                                      {admin ? (
                                                          <button
                                                              type="button"
                                                              aria-label={`Menu untuk ${row.nama_produk}`}
                                                              onClick={() =>
                                                                  setMenuId(menuId === row.id ? null : row.id)
                                                              }
                                                              className="grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-ink"
                                                          >
                                                              <IconDots size={16} />
                                                          </button>
                                                      ) : null}

                                                      {menuId === row.id ? (
                                                          <div
                                                              ref={menuRef}
                                                              className="anim-pop absolute top-9 right-2 z-20 w-[168px] overflow-hidden rounded-2xl border border-line bg-white py-1.5 shadow-[0_16px_36px_-16px_rgba(13,13,15,0.35)]"
                                                          >
                                                              <button
                                                                  type="button"
                                                                  onClick={() => bukaUbah(row)}
                                                                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[12.5px] font-semibold text-subtle transition-colors hover:bg-canvas hover:text-ink"
                                                              >
                                                                  <IconPencil size={14} />
                                                                  Ubah produk
                                                              </button>
                                                              <button
                                                                  type="button"
                                                                  onClick={() => {
                                                                      setMenuId(null);
                                                                      setHapusTarget(row);
                                                                  }}
                                                                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[12.5px] font-semibold text-[#b3231a] transition-colors hover:bg-[#fdecea]"
                                                              >
                                                                  <IconTrash size={14} />
                                                                  Hapus produk
                                                              </button>
                                                          </div>
                                                      ) : null}
                                                  </td>
                                              </tr>
                                          );
                                      })}
                            </tbody>
                        </table>

                        {!memuat && rows.length === 0 ? (
                            <Kosong
                                ikon={IconBox}
                                judul="Belum ada produk"
                                keterangan={
                                    cari || status
                                        ? "Tidak ada produk yang cocok dengan filter saat ini."
                                        : "Tambahkan produk pertama Anda untuk mulai berjualan."
                                }
                                aksi={
                                    admin && !cari && !status ? (
                                        <Button ikon={IconPlus} ukuran="sm" onClick={bukaTambah}>
                                            Tambah Produk
                                        </Button>
                                    ) : null
                                }
                            />
                        ) : null}
                    </div>
                )}
            </div>

            {/* Kaki panel: info jumlah + navigasi halaman */}
            {!galat && jumlahHalaman > 1 ? (
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line-soft pt-3.5">
                    <span className="text-[11.5px] font-medium text-muted">{infoHalaman}</span>
                    <div className="flex items-center gap-2">
                        <Button
                            variasi="terang"
                            ukuran="sm"
                            onClick={() => setHalaman((h) => Math.max(0, h - 1))}
                            disabled={halaman === 0 || memuat}
                        >
                            Sebelumnya
                        </Button>
                        <span className="tabular text-[11.5px] font-semibold text-subtle">
                            {halaman + 1} / {jumlahHalaman}
                        </span>
                        <Button
                            variasi="terang"
                            ukuran="sm"
                            onClick={() => setHalaman((h) => Math.min(jumlahHalaman - 1, h + 1))}
                            disabled={halaman >= jumlahHalaman - 1 || memuat}
                        >
                            Berikutnya
                        </Button>
                    </div>
                </div>
            ) : null}

            {/* Modal tambah / ubah */}
            <Modal
                terbuka={Boolean(form)}
                onTutup={() => (menyimpan ? null : setForm(null))}
                judul={form?.mode === "tambah" ? "Tambah Produk" : "Ubah Produk"}
                deskripsi="Perubahan langsung tersimpan ke database melalui API backend."
                footer={
                    <>
                        <Button variasi="terang" onClick={() => setForm(null)} disabled={menyimpan}>
                            Batal
                        </Button>
                        <Button type="submit" form="form-produk" disabled={menyimpan}>
                            {menyimpan ? "Menyimpan…" : "Simpan"}
                        </Button>
                    </>
                }
            >
                <form id="form-produk" onSubmit={simpan} className="flex flex-col gap-4">
                    <div>
                        <label
                            htmlFor="nama_produk"
                            className="mb-1.5 block text-[12px] font-semibold text-subtle"
                        >
                            Nama Produk
                        </label>
                        <input
                            id="nama_produk"
                            value={form?.data.nama_produk ?? ""}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    data: { ...f.data, nama_produk: e.target.value }
                                }))
                            }
                            placeholder="Contoh: Indomie Goreng"
                            autoFocus
                            className="h-11 w-full rounded-xl border border-line bg-white px-4 text-[13px] text-ink outline-none transition-colors placeholder:text-muted focus:border-[#c9ccd1]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="harga"
                                className="mb-1.5 block text-[12px] font-semibold text-subtle"
                            >
                                Harga (Rp)
                            </label>
                            <input
                                id="harga"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form?.data.harga ?? ""}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, data: { ...f.data, harga: e.target.value } }))
                                }
                                placeholder="3500"
                                className="tabular h-11 w-full rounded-xl border border-line bg-white px-4 text-[13px] text-ink outline-none transition-colors placeholder:text-muted focus:border-[#c9ccd1]"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="stok"
                                className="mb-1.5 block text-[12px] font-semibold text-subtle"
                            >
                                Stok
                            </label>
                            <input
                                id="stok"
                                type="number"
                                min="0"
                                step="1"
                                value={form?.data.stok ?? ""}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, data: { ...f.data, stok: e.target.value } }))
                                }
                                placeholder="20"
                                className="tabular h-11 w-full rounded-xl border border-line bg-white px-4 text-[13px] text-ink outline-none transition-colors placeholder:text-muted focus:border-[#c9ccd1]"
                            />
                        </div>
                    </div>

                    {galatForm ? (
                        <p className="rounded-xl bg-[#fdecea] px-4 py-2.5 text-[12.5px] font-medium text-[#b3231a]">
                            {galatForm}
                        </p>
                    ) : null}
                </form>
            </Modal>

            {/* Konfirmasi hapus */}
            <Modal
                terbuka={Boolean(hapusTarget)}
                onTutup={() => (menghapus ? null : setHapusTarget(null))}
                judul="Hapus produk?"
                lebar="max-w-md"
                footer={
                    <>
                        <Button
                            variasi="terang"
                            onClick={() => setHapusTarget(null)}
                            disabled={menghapus}
                        >
                            Batal
                        </Button>
                        <Button onClick={konfirmasiHapus} disabled={menghapus}>
                            {menghapus ? "Menghapus…" : "Hapus"}
                        </Button>
                    </>
                }
            >
                <p className="text-[13px] leading-relaxed text-subtle">
                    Produk{" "}
                    <span className="font-bold text-ink">{hapusTarget?.nama_produk}</span> akan
                    dinonaktifkan. Data transaksi lama yang memakai produk ini tetap utuh —
                    backend memakai <span className="font-semibold">soft delete</span> (
                    <code className="rounded bg-canvas px-1.5 py-0.5 text-[11.5px]">is_active = 0</code>
                    ).
                </p>
            </Modal>
        </section>
    );
}
