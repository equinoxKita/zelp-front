# Zelp Store - Client Dashboard

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Zelp Store Client Dashboard** adalah aplikasi frontend modern yang dirancang untuk memberikan pengalaman manajemen server yang intuitif, cepat, dan premium. Dibangun menggunakan teknologi terbaru untuk memastikan performa tinggi dan keamanan maksimal.

## ✨ Fitur Utama

-   **Dashboard Analytics**: Visualisasi statistik penggunaan resource server (CPU, RAM, Disk) menggunakan Recharts.
-   **Service Management**: Kontrol penuh atas server Pterodactyl (Start, Stop, Restart, Reinstall).
-   **Advanced Egg Manager**: Fitur ganti Egg/Software server dengan UI berbasis kartu yang modern dan validasi RAM otomatis.
-   **Billing & Invoices**: Pantau tagihan, riwayat transaksi, dan status layanan secara real-time.
-   **Announcement System**: Notifikasi dan pengumuman penting langsung di dashboard pengguna.
-   **Responsive & Premium UI**: Desain gelap (*dark mode*) yang elegan, responsif di semua perangkat, menggunakan Tailwind CSS dan Headless UI.

## 🚀 Tech Stack

-   **Framework**: [React 19](https://react.dev/)
-   **Build Tool**: [Vite 6](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Components**: [Headless UI](https://headlessui.com/)
-   **Charts**: [Recharts](https://recharts.org/)
-   **Alerts**: [SweetAlert2](https://sweetalert2.github.io/)
-   **API Client**: [Axios](https://axios-http.com/)

## 🛠️ Instalasi

Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/) (versi 18 ke atas disarankan).

1.  **Clone repositori:**
    ```bash
    git clone https://github.com/equinoxKita/zelp-front.git
    cd zelp-front
    ```

2.  **Instal dependensi:**
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment:**
    Buat file `.env` di root folder dan sesuaikan URL API backend Anda:
    ```env
    VITE_API_URL=http://localhost:3000/api
    ```

4.  **Jalankan aplikasi (Development):**
    ```bash
    npm run dev
    ```

5.  **Build untuk Produksi:**
    ```bash
    npm run build
    ```

## 📂 Struktur Proyek

```text
src/
├── components/   # Komponen UI yang dapat digunakan kembali
├── pages/        # Halaman utama (Dashboard, ServiceDetail, dll.)
├── assets/       # Gambar, font, dan style global
├── utils/        # Fungsi helper dan konfigurasi axios
└── App.jsx       # Routing dan entry point utama
```

## 🤝 Kontribusi

Kontribusi selalu terbuka! Jika Anda ingin meningkatkan UI atau menambahkan fitur baru:
1. Fork repositori ini.
2. Buat branch fitur baru (`git checkout -b fitur/NamaFitur`).
3. Commit perubahan Anda (`git commit -m 'Menambah fitur X'`).
4. Push ke branch (`git push origin fitur/NamaFitur`).
5. Buat Pull Request.

## 📄 Lisensi

Proyek ini dilisensikan di bawah [Lisensi MIT](LICENSE).

---
*Developed with ❤️ by Equinox Team*
