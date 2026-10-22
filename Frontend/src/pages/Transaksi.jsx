import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import TransaksiBaru from "../components/TransaksiBaru.jsx";
import { useToast } from "../components/Toast.jsx";
import { Button, Card, Galat, Kosong, Skeleton } from "../components/ui.jsx";
import {
    IconBan,
    IconChevronDown,
    IconPlus,
    IconReceipt,
    IconSearch
} from "../components/Icons.jsx";
import { api } from "../api/client.js";
import { angka, metaStatusTransaksi, rupiah, tanggalWaktu } from "../lib/format.js";

const PILIHAN_STATUS = [
    { nilai: "", label: "Semua Status" },
    { nilai: "PAID", label: "Lunas" },
    { nilai: "PENDING", label: "Pending" },
    { nilai: "CANCELLED", label: "Dibatalkan" }
];

const UKURAN_HALAMAN = 8;

/** Halaman Transaksi — daftar transaksi + modal rincian item. */
export default function Transaksi() {
    const toast = useToast();

    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [memuat, setMemuat] = useState(true);
    const [galat, setGalat] = useState("");

    const [cariTertunda, setCariTertunda] = useState("");
    const [cari, setCari] = useState("");
    const [status, setStatus] = useState("");
    const [halaman, setHalaman] = useState(0);

    const [detail, setDetail] = useState(null);
    const [memuatDetail, setMemuatDetail] = useState(false);
    const [galatDetail, setGalatDetail] = useState("");

    // Pembatalan transaksi (stok dikembalikan oleh backend).
    const [batalTarget, setBatalTarget] = useState(null);
    const [sedangBatal, setSedangBatal] = useState(false);

    // Layar kasir (input penjualan).
    const [formBaru, setFormBaru] = useState(false);

    // Layar kasir juga bisa dibuka langsung lewat tautan #/transaksi?baru=1 —
    // berguna untuk di-bookmark kasir supaya tidak perlu klik dua kali.
    const [searchParams, setSearchParams] = useSearchParams();

    const tutupForm = useCallback(() => {
        setFormBaru(false);
        if (searchParams.get("baru") === "1") {
            const berikut = new URLSearchParams(searchParams);
            berikut.delete("baru");
            setSearchParams(berikut, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    // Dinaikkan setiap penjualan tersimpan, untuk memaksa daftar dimuat ulang
    // walau filter dan halamannya tidak berubah.
    const [penyegar, setPenyegar] = useState(0);

    const offset = halaman * UKURAN_HALAMAN;

    const muat = useCallback(
        async (signal) => {
            setMemuat(true);
            setGalat("");
            try {
                const hasil = await api.daftarTransaksi({
                    cari: cari || undefined,
                    status: status || undefined,
                    limit: UKURAN_HALAMAN,
                    offset,
                    signal
                });
                setRows(hasil.data || []);
                setTotal(hasil.meta?.total ?? 0);
            } catch (error) {
                if (error.name === "AbortError") return;
                setGalat(error.message);
                setRows([]);
                setTotal(0);
            } finally {
                setMemuat(false);
            }
        },
        [cari, status, offset, penyegar]
    );

    useEffect(() => {
        const controller = new AbortController();
        muat(controller.signal);
        return () => controller.abort();
    }, [muat]);

    // Tunda pencarian supaya tidak memanggil API tiap ketikan.
    useEffect(() => {
        const t = window.setTimeout(() => {
            setCari(cariTertunda.trim());
            setHalaman(0);
        }, 350);
        return () => window.clearTimeout(t);
    }, [cariTertunda]);

    // Layar kasir terbuka otomatis kalau URL memuat ?baru=1
    useEffect(() => {
        if (searchParams.get("baru") === "1") setFormBaru(true);
    }, [searchParams]);

    const bukaDetail = async (row) => {
        setDetail({ ringkas: row });
        setMemuatDetail(true);
        setGalatDetail("");
        try {
            const hasil = await api.detailTransaksi(row.id);
            setDetail({ ringkas: row, lengkap: hasil.data });
        } catch (error) {
            setGalatDetail(error.message);
        } finally {
            setMemuatDetail(false);
        }
    };

    /**
     * Dipanggil setelah kasir menyimpan penjualan.
     *
     * Daftar disegarkan, lalu rincian transaksi yang baru dibuat langsung
     * dibuka — supaya item yang tersimpan di `detail_transaksi` bisa langsung
     * diperiksa bersama transaksi_id-nya.
     */
    const tanganiSukses = (data) => {
        tutupForm();
        setCariTertunda("");
        setCari("");
        setStatus("");
        setHalaman(0);
        setPenyegar((n) => n + 1);
        bukaDetail({ id: data.id, kode_transaksi: data.kode_transaksi });
    };

    /**
     * Membatalkan transaksi. Backend yang mengembalikan stok dan menandai
     * statusnya CANCELLED — frontend tidak menghitung apa pun.
     */
    const konfirmasiBatal = async () => {        if (!batalTarget) return;

        setSedangBatal(true);
        try {
            const hasil = await api.batalkanTransaksi(batalTarget.id);
            toast.sukses(hasil.pesan, { judul: "Transaksi dibatalkan" });
            setBatalTarget(null);
            setDetail(null);
            setPenyegar((n) => n + 1);
        } catch (error) {
            toast.galat(error.message);
        } finally {
            setSedangBatal(false);
        }
    };

    const jumlahHalaman = Math.max(1, Math.ceil(total / UKURAN_HALAMAN));

    const infoHalaman = useMemo(() => {
        if (total === 0) return "Tidak ada data";
        const mulai = offset + 1;
        const akhir = Math.min(offset + rows.length, total);
        return `Menampilkan ${mulai}–${akhir} dari ${total}`;
    }, [offset, rows.length, total]);

    const items = detail?.lengkap?.items || [];
    const totalItem = items.reduce((acc, it) => acc + (it.jumlah || 0), 0);

    return (
        <div className="flex flex-col gap-5">
            <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-[20px] leading-tight font-extrabold tracking-[-0.02em] text-ink">
                        Transaksi
                    </h1>
                    <p className="mt-1 text-[12.5px] text-muted">
                        Catat penjualan baru, lalu lihat riwayat beserta rincian itemnya.
                    </p>
                </div>

                <Button ikon={IconPlus} onClick={() => setFormBaru(true)}>
                    Transaksi Baru
                </Button>
            </header>

            <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-[16.5px] font-bold tracking-[-0.01em] text-ink">
                        Daftar Transaksi
                    </h2>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="relative">
                            <IconSearch
                                size={15}
                                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
                            />
                            <input
                                value={cariTertunda}
                                onChange={(e) => setCariTertunda(e.target.value)}
                                placeholder="Cari kode / pembeli…"
                                className="h-10 w-[200px] rounded-full border border-line bg-white pr-4 pl-9 text-[12.5px] text-ink outline-none transition-colors placeholder:text-muted focus:border-[#d5d8dc]"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    setHalaman(0);
                                }}
                                aria-label="Filter status pembayaran"
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
                    </div>
                </div>

                <div className="mt-4">
                    {galat ? (
                        <Galat pesan={galat} onCobaLagi={() => muat()} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] border-separate border-spacing-0">
                                <thead>
                                    <tr>
                                        {["Kode Transaksi", "Pembeli", "Kasir", "Item", "Total", "Status", "Tanggal"].map(
                                            (h) => (
                                                <th
                                                    key={h}
                                                    className="pb-3 text-left text-[12px] font-medium text-muted"
                                                >
                                                    {h}
                                                </th>
                                            )
                                        )}
                                        <th className="w-24 pb-3" />
                                    </tr>
                                </thead>

                                <tbody>
                                    {memuat
                                        ? Array.from({ length: 5 }).map((_, i) => (
                                              <tr key={`sk-${i}`}>
                                                  {Array.from({ length: 7 }).map((__, k) => (
                                                      <td
                                                          key={k}
                                                          className="border-b border-line-soft py-3.5 pr-4"
                                                      >
                                                          <Skeleton className="h-3 w-20" />
                                                      </td>
                                                  ))}
                                                  <td className="border-b border-line-soft py-3.5" />
                                              </tr>
                                          ))
                                        : rows.map((row, i) => {
                                              const meta = metaStatusTransaksi(row.status_pembayaran);
                                              return (
                                                  <tr
                                                      key={row.id}
                                                      className="anim-fade"
                                                      style={{ animationDelay: `${i * 35}ms` }}
                                                  >
                                                      <td className="border-b border-line-soft py-3.5 pr-4">
                                                          {/* Kode transaksi bisa sangat panjang
                                                              (TRX-<tanggal>-<epoch>-<hex>), jadi
                                                              lebarnya dibatasi dan dipotong. */}
                                                          <span
                                                              title={row.kode_transaksi}
                                                              className="block max-w-[210px] truncate font-mono text-[11.5px] font-semibold text-ink"
                                                          >
                                                              {row.kode_transaksi}
                                                          </span>
                                                      </td>
                                                      <td className="border-b border-line-soft py-3.5 pr-4 text-[13px] font-semibold text-ink">
                                                          {row.nama_pembeli}
                                                      </td>
                                                      <td className="border-b border-line-soft py-3.5 pr-4 text-[12.5px] text-subtle">
                                                          {row.kasir_nama}
                                                      </td>
                                                      <td className="tabular border-b border-line-soft py-3.5 pr-4 text-[12.5px] text-subtle">
                                                          {angka(row.total_item)}
                                                      </td>
                                                      <td className="tabular border-b border-line-soft py-3.5 pr-4 text-[13px] font-semibold text-ink">
                                                          {rupiah(row.total_harga)}
                                                      </td>
                                                      <td className="border-b border-line-soft py-3.5 pr-4">
                                                          <Badge tone={meta.tone}>{meta.label}</Badge>
                                                      </td>
                                                      <td className="border-b border-line-soft py-3.5 pr-4 text-[12.5px] whitespace-nowrap text-muted">
                                                          {tanggalWaktu(row.tanggal_transaksi)}
                                                      </td>
                                                      <td className="border-b border-line-soft py-3.5">
                                                          <Button
                                                              variasi="terang"
                                                              ukuran="sm"
                                                              onClick={() => bukaDetail(row)}
                                                          >
                                                              Rincian
                                                          </Button>
                                                      </td>
                                                  </tr>
                                              );
                                          })}
                                </tbody>
                            </table>

                            {!memuat && rows.length === 0 ? (
                                <Kosong
                                    ikon={IconReceipt}
                                    judul="Belum ada transaksi"
                                    keterangan={
                                        cari || status
                                            ? "Tidak ada transaksi yang cocok dengan filter saat ini."
                                            : "Transaksi yang dibuat lewat API akan muncul di sini."
                                    }
                                />
                            ) : null}
                        </div>
                    )}
                </div>

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
            </Card>

            <Modal
                terbuka={Boolean(detail)}
                onTutup={() => setDetail(null)}
                judul="Rincian Transaksi"
                deskripsi={detail?.ringkas?.kode_transaksi}
                lebar="max-w-2xl"
                footer={
                    <>
                        {/* Tombol batal disembunyikan kalau transaksinya sudah
                            dibatalkan — supaya tidak ada aksi yang pasti gagal. */}
                        {detail?.lengkap &&
                        detail.lengkap.status_pembayaran !== "CANCELLED" ? (
                            <Button
                                variasi="bahaya"
                                ikon={IconBan}
                                onClick={() => setBatalTarget(detail.lengkap)}
                            >
                                Batalkan Transaksi
                            </Button>
                        ) : null}
                        <Button variasi="terang" onClick={() => setDetail(null)}>
                            Tutup
                        </Button>
                    </>
                }
            >
                {memuatDetail ? (
                    <div className="flex flex-col gap-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-xl" />
                        ))}
                    </div>
                ) : galatDetail ? (
                    <Galat pesan={galatDetail} />
                ) : (
                    <div className="flex flex-col gap-5">
                        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {[
                                { label: "Pembeli", nilai: detail?.lengkap?.nama_pembeli },
                                { label: "Kasir", nilai: detail?.lengkap?.kasir?.nama },
                                { label: "Metode", nilai: detail?.lengkap?.metode_pembayaran },
                                {
                                    label: "Status",
                                    nilai: metaStatusTransaksi(detail?.lengkap?.status_pembayaran).label
                                }
                            ].map((f) => (
                                <div key={f.label}>
                                    <dt className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                                        {f.label}
                                    </dt>
                                    <dd className="mt-1 text-[13px] font-semibold text-ink">
                                        {f.nilai || "-"}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        <div>
                            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">
                                Waktu
                            </p>
                            <p className="mt-1 text-[13px] font-semibold text-ink">
                                {tanggalWaktu(detail?.lengkap?.tanggal_transaksi)}
                            </p>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-line">
                            <table className="w-full border-separate border-spacing-0">
                                <thead className="bg-canvas">
                                    <tr>
                                        {["Produk", "Jumlah", "Harga", "Subtotal"].map((h, idx) => (
                                            <th
                                                key={h}
                                                className={`px-4 py-2.5 text-[11.5px] font-semibold text-muted ${
                                                    idx === 0 ? "text-left" : "text-right"
                                                }`}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((it) => (
                                        <tr key={it.produk_id}>
                                            <td className="border-t border-line-soft px-4 py-2.5 text-[12.5px] font-medium text-ink">
                                                {it.nama_produk}
                                            </td>
                                            <td className="tabular border-t border-line-soft px-4 py-2.5 text-right text-[12.5px] text-subtle">
                                                {angka(it.jumlah)}
                                            </td>
                                            <td className="tabular border-t border-line-soft px-4 py-2.5 text-right text-[12.5px] text-subtle">
                                                {rupiah(it.harga)}
                                            </td>
                                            <td className="tabular border-t border-line-soft px-4 py-2.5 text-right text-[12.5px] font-semibold text-ink">
                                                {rupiah(it.subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="border-t border-line px-4 py-3 text-right text-[12.5px] font-semibold text-subtle"
                                        >
                                            Total ({angka(totalItem)} item)
                                        </td>
                                        <td className="tabular border-t border-line px-4 py-3 text-right text-[14px] font-extrabold text-ink">
                                            {rupiah(detail?.lengkap?.total_harga)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Layar kasir: input penjualan baru */}
            <TransaksiBaru
                terbuka={formBaru}
                onTutup={tutupForm}
                onSukses={tanganiSukses}
            />

            {/* Konfirmasi pembatalan transaksi */}
            <Modal
                terbuka={Boolean(batalTarget)}
                onTutup={() => (sedangBatal ? null : setBatalTarget(null))}
                judul="Batalkan transaksi?"
                lebar="max-w-md"
                footer={
                    <>
                        <Button
                            variasi="terang"
                            onClick={() => setBatalTarget(null)}
                            disabled={sedangBatal}
                        >
                            Tidak
                        </Button>
                        <Button
                            variasi="bahaya"
                            onClick={konfirmasiBatal}
                            disabled={sedangBatal}
                        >
                            {sedangBatal ? "Membatalkan…" : "Ya, batalkan"}
                        </Button>
                    </>
                }
            >
                <p className="text-[13px] leading-relaxed text-subtle">
                    Transaksi{" "}
                    <span className="font-mono text-[12px] font-bold break-all text-ink">
                        {batalTarget?.kode_transaksi}
                    </span>{" "}
                    akan ditandai <span className="font-semibold text-ink">Dibatalkan</span> dan
                    stok produk dikembalikan sebanyak yang terjual.
                </p>
                <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
                    Barisnya <span className="font-semibold text-subtle">tidak dihapus</span>,
                    jadi riwayat penjualan tetap utuh dan bisa ditelusuri.
                </p>
            </Modal>
        </div>
    );
}
