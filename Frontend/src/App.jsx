import { Navigate, Route, Routes, useNavigate } from "react-router-dom";

import AppShell from "./components/AppShell.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { Button, Card } from "./components/ui.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Produk from "./pages/Produk.jsx";
import Transaksi from "./pages/Transaksi.jsx";
import Pelanggan from "./pages/Pelanggan.jsx";
import Pengguna from "./pages/Pengguna.jsx";
import Laporan from "./pages/Laporan.jsx";
import Pengaturan from "./pages/Pengaturan.jsx";

/** Semua halaman selain /masuk wajib punya token. */
function RuteTerlindungi() {
    const { masukSudah } = useAuth();
    if (!masukSudah) return <Navigate to="/masuk" replace />;
    return <AppShell />;
}

function TidakDitemukan() {
    const navigate = useNavigate();
    return (
        <Card className="anim-rise p-8">
            <p className="text-[40px] leading-none font-extrabold tracking-[-0.04em] text-ink">404</p>
            <h1 className="mt-3 text-[17px] font-bold text-ink">Halaman tidak ditemukan</h1>
            <p className="mt-1.5 max-w-[420px] text-[12.5px] leading-relaxed text-muted">
                Alamat yang Anda buka tidak ada di aplikasi ini.
            </p>
            <Button className="mt-5" onClick={() => navigate("/")}>
                Kembali ke dashboard
            </Button>
        </Card>
    );
}

export default function App() {
    return (
        <ToastProvider>
            <Routes>
                <Route path="/masuk" element={<Login />} />

                <Route element={<RuteTerlindungi />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/produk" element={<Produk />} />
                    <Route path="/transaksi" element={<Transaksi />} />
                    <Route path="/pelanggan" element={<Pelanggan />} />
                    <Route path="/pengguna" element={<Pengguna />} />
                    <Route path="/laporan" element={<Laporan />} />
                    <Route path="/pengaturan" element={<Pengaturan />} />
                    <Route path="*" element={<TidakDitemukan />} />
                </Route>
            </Routes>
        </ToastProvider>
    );
}
