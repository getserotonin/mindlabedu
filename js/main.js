// js/main.js

document.addEventListener("DOMContentLoaded", function () {
    
    // ==========================================
    // 1. SKRIP TOGGLE MENU BURGER MOBILE
    // ==========================================
    const mobileMenu = document.getElementById("mobile-menu");
    // Karena kita tidak pakai class .nav-links lagi di HTML, kita targetkan tag <ul> di dalam <nav>
    const navMenu = document.querySelector("nav ul"); 

    if (mobileMenu && navMenu) {
        mobileMenu.addEventListener("click", function () {
            // Terapkan class Tailwind untuk mode mobile dropdown
            navMenu.classList.toggle("hidden");
            navMenu.classList.toggle("flex-col");
            navMenu.classList.toggle("absolute");
            navMenu.classList.toggle("top-20");
            navMenu.classList.toggle("left-0");
            navMenu.classList.toggle("w-full");
            navMenu.classList.toggle("bg-white/95");
            navMenu.classList.toggle("backdrop-blur-md");
            navMenu.classList.toggle("p-6");
            navMenu.classList.toggle("shadow-lg");
            navMenu.classList.toggle("space-y-4");
            navMenu.classList.toggle("space-x-8"); // Matikan jarak horizontal desktop
            
            const icon = mobileMenu.querySelector("i");
            if (navMenu.classList.contains("hidden")) {
                // Mode tertutup
                icon.classList.remove("fa-xmark");
                icon.classList.add("fa-bars");
            } else {
                // Mode terbuka
                icon.classList.remove("fa-bars");
                icon.classList.add("fa-xmark");
            }
        });
    }

    // ==========================================
    // 2. SKRIP FETCH JADWAL DARI APPS SCRIPT
    // ==========================================
    const BACKEND_URL = "https://script.google.com/macros/s/AKfycbxO_DFsqF70TyHBDQYxNF8iCNlNzEh5-KGfLlp_5ulb6izx0ReFGi2wzzer-9yrmzEApA/exec"; 
    const tableBody = document.getElementById("schedule-data-rows");

    if (tableBody) {
        fetch(BACKEND_URL)
            .then(response => response.json())
            .then(data => {
                if (!data || data.length === 0 || data.error) {
                    tableBody.innerHTML = `<tr><td colspan="3" class="px-8 py-10 text-center text-rose-500 font-semibold">❌ Gagal memuat jadwal. Hubungi Admin.</td></tr>`;
                    return; 
                }

                tableBody.innerHTML = ""; // Bersihkan status "loading..."
                
                data.forEach(row => {
                    const statusText = row[1] || "Tersedia"; 
                    const hari = row[2] || "-";
                    const sesi = row[3] || "-";
                    
                    const isFull = statusText.toLowerCase() === "penuh";
                    
                    // --- LOGIKA BADGE SESI (SIANG / SORE) ---
                    let badgeSesi = '';
                    if (sesi.toLowerCase().includes('siang')) {
                        badgeSesi = `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 shadow-sm">
                            <i class="fas fa-sun text-amber-500 text-sm"></i> ${sesi}
                        </span>`;
                    } else if (sesi.toLowerCase().includes('sore')) {
                        badgeSesi = `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-sm">
                            <i class="fas fa-cloud-sun text-indigo-500 text-sm"></i> ${sesi}
                        </span>`;
                    } else {
                        // Default jika ada sesi lain
                        badgeSesi = `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm">
                            <i class="far fa-clock text-slate-500 text-sm"></i> ${sesi}
                        </span>`;
                    }

                    // --- LOGIKA BADGE STATUS (TERSEDIA / PENUH) ---
                    let badgeStatus = !isFull
                        ? `<span class="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] uppercase font-extrabold border border-emerald-200 w-24"><i class="fas fa-check-circle"></i> ${statusText}</span>`
                        : `<span class="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] uppercase font-extrabold border border-rose-200 w-24"><i class="fas fa-lock"></i> ${statusText}</span>`;
                    
                    // --- CETAK BARIS TABEL ---
                    const tr = document.createElement("tr");
                    tr.className = "hover:bg-slate-50 transition-colors duration-200 group";
                    tr.innerHTML = `
                        <!-- Kolom Hari (Tebal & Interaktif) -->
                        <td class="px-8 py-5 font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors whitespace-nowrap">${hari}</td>
                        
                        <!-- Kolom Sesi -->
                        <td class="px-8 py-5 whitespace-nowrap">
                            ${badgeSesi}
                        </td>
                        
                        <!-- Kolom Status -->
                        <td class="px-8 py-5 text-center whitespace-nowrap">
                            ${badgeStatus}
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            })
            .catch(error => {
                console.error("Error fetching sheet data:", error);
                tableBody.innerHTML = `<tr><td colspan="3" class="px-8 py-10 text-center text-rose-500 font-semibold">❌ Koneksi terputus. Coba refresh halaman.</td></tr>`;
            });
    }
    //commit ulang
});