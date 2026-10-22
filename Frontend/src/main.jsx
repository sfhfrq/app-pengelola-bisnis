import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import "./index.css";

// HashRouter dipakai supaya build statis (dist/) bisa dibuka dari
// file:// atau hosting apa pun tanpa perlu konfigurasi rewrite server.
createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <HashRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </HashRouter>
    </React.StrictMode>
);
