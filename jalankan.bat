@echo off
REM =========================================================
REM  Klik dua kali berkas ini untuk menjalankan aplikasi
REM  (backend + frontend) di komputer sendiri.
REM
REM  Berkas ini hanya pembungkus. Logikanya ada di jalankan.ps1,
REM  dipanggil dengan ExecutionPolicy Bypass supaya tidak diblokir
REM  kebijakan skrip Windows.
REM =========================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0jalankan.ps1" %*
