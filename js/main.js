    // js/main.js

document.addEventListener("DOMContentLoaded", function () {
    // 1. SKRIP TOGGLE MENU BURGER MOBILE
    const mobileMenu = document.getElementById("mobile-menu");
    const navLinks = document.querySelector(".nav-links");

    if (mobileMenu && navLinks) {
        mobileMenu.addEventListener("click", function () {
            navLinks.classList.toggle("active-nav");
            const icon = mobileMenu.querySelector("i");
            if (navLinks.classList.contains("active-nav")) {
                icon.classList.remove("fa-bars");
                icon.classList.add("fa-xmark"); // Berubah jadi ikon silang (X)
            } else {
                icon.classList.remove("fa-xmark");
                icon.classList.add("fa-bars");
            }
        });
    }

    // 2. SKRIP FETCH JADWAL DARI APPS SCRIPT
    const BACKEND_URL = "https://script.google.com/macros/s/AKfycbxO_DFsqF70TyHBDQYxNF8iCNlNzEh5-KGfLlp_5ulb6izx0ReFGi2wzzer-9yrmzEApA/exec"; 
    const tableBody = document.getElementById("schedule-data-rows");

    if (tableBody) {
        fetch(BACKEND_URL)
            .then(response => response.json())
            .then(data => {
                if (!data || data.length === 0 || data.error) {
                    tableBody.innerHTML = `<tr><td colspan="3" class="loading-text" style="color: #EF4444;">❌ Gagal memuat jadwal. Hubungi Admin.</td></tr>`;
                    return; 
                }

                tableBody.innerHTML = "";
                data.forEach(row => {
                    const tr = document.createElement("tr");
                    const statusText = row[1] || "Tersedia"; 
                    const isFull = statusText.toLowerCase() === "penuh";
                    const statusColor = isFull ? "#EF4444" : "#10B981"; 
                    const statusIcon = isFull ? "fa-ban" : "fa-check-circle";
                    
                    tr.innerHTML = `
                        <td><i class="fas fa-calendar-day me-2" style="color: #3B82F6; font-size: 1.1em;"></i> ${row[2]}</td>
                        <td><i class="fas fa-clock me-2" style="color: #F59E0B; font-size: 1.1em;"></i> ${row[3]}</td>
                        <td style="text-align: center;">
                            <span class="status-badge" style="color: ${statusColor}; font-weight: 600;">
                                <i class="fas ${statusIcon} me-1"></i> ${statusText}
                            </span>
                        </td>
                    `;
                    tableBody.appendChild(tr);
                });
            })
            .catch(error => {
                console.error("Error fetching sheet data:", error);
                tableBody.innerHTML = `<tr><td colspan="3" class="loading-text" style="color: #EF4444;">❌ Koneksi terputus. Coba refresh halaman.</td></tr>`;
            });
    }
});