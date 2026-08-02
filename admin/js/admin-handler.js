// ==========================================
// 1. LOGIKA LOGIN ADMIN
// ==========================================
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const btnLogin = document.getElementById('btnLogin');
const adminPinInput = document.getElementById('adminPin');
const loginError = document.getElementById('loginError');

// Tentukan PIN sementara di sini
const PIN_RAHASIA = "123456"; 

btnLogin.addEventListener('click', function() {
    const pinDimasukkan = adminPinInput.value;

    if (pinDimasukkan === PIN_RAHASIA) {
        // Jika PIN Benar: Sembunyikan login, tampilkan dashboard
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'flex'; // Pakai flex agar letak sidebar & konten sejajar
        loginError.style.display = 'none';
    } else {
        // Jika PIN Salah: Munculkan teks error
        loginError.style.display = 'block';
    }
});

// ==========================================
// 2. LOGIKA NAVIGASI MENU DASHBOARD (SPA)
// ==========================================
const navLinks = document.querySelectorAll('.nav-menu a');
const contentSections = document.querySelectorAll('.content-section');

navLinks.forEach(link => {
    link.addEventListener('click', function() {
        // Jika yang diklik adalah tombol Logout
        if (this.id === 'nav-logout') {
            dashboardSection.style.display = 'none';
            loginSection.style.display = 'block';
            adminPinInput.value = ''; // Kosongkan input PIN
            return;
        }

        // Hapus status 'active' dari semua tombol menu dan konten
        navLinks.forEach(n => n.classList.remove('active'));
        contentSections.forEach(c => c.classList.remove('active'));

        // Tambahkan status 'active' ke tombol yang diklik
        this.classList.add('active');

        // Munculkan konten yang sesuai dengan tombol yang diklik
        const targetId = this.id.replace('nav-', 'sec-');
        document.getElementById(targetId).classList.add('active');

        // 👇 TAMBAHKAN INI 👇
        if (targetId === 'sec-siswa') {
            loadDataSiswa();
        } else if (targetId === 'sec-absensi') { 
            loadDataPresensi();
        }

    });
});

// ==========================================
// LOGIKA TOGGLE SIDEBAR
// ==========================================
const btnToggleSidebar = document.getElementById('btnToggleSidebar');
const sidebar = document.querySelector('.sidebar');

if(btnToggleSidebar && sidebar) {
    btnToggleSidebar.addEventListener('click', function() {
        // Menambah atau menghapus class 'collapsed' pada sidebar
        sidebar.classList.toggle('collapsed');
    });
}

// ==========================================
// 3. LOGIKA TARIK DATA VIA API GOOGLE SHEETS
// ==========================================

// Masukkan URL Web App Apps Script kamu di sini!
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzLIJ81Csfnj5P28LMCvVYDrP3VgVGzkhUZAFvqsidD0ki7c3ibOG3sNpU97OiM4JsAww/exec";

// Fungsi menarik dan merender tabel Siswa
async function loadDataSiswa() {
  const tbody = document.getElementById('tbody-siswa');
  if(!tbody) return; 
  
  tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Memuat data dari database... ⏳</td></tr>';
  
  try {
    // Memanggil API Apps Script dengan parameter action=getSiswa
    const response = await fetch(GOOGLE_SCRIPT_URL + "?action=getSiswa");
    const dataArray = await response.json();
    
    let htmlString = "";
    dataArray.forEach(row => {
      htmlString += "<tr>";
      htmlString += `<td>${row[0]}</td>`; // ID
      htmlString += `<td>${row[1]}</td>`; // Nama Lengkap
      htmlString += `<td>${row[2]}</td>`; // Panggilan
      htmlString += `<td>${row[3]}</td>`; // TTL
      htmlString += `<td>${row[4]}</td>`; // JK
      htmlString += `<td>${row[5]}</td>`; // Asal Sekolah
      htmlString += `<td>${row[6]}</td>`; // Jenjang
      htmlString += `<td>${row[7]}</td>`; // Ortu
      htmlString += `<td>${row[8]}</td>`; // WA
      htmlString += "<td><button class='btn-edit'>Edit</button></td>";
      htmlString += "</tr>";
    });
    tbody.innerHTML = htmlString;
    
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:red;">Gagal memuat data. Periksa koneksi atau URL.</td></tr>';
    console.error("Error Fetch Data Siswa:", error);
  }
}

// Fungsi menarik dan merender tabel Presensi
async function loadDataPresensi() {
  const tbody = document.getElementById('tbody-presensi');
  if(!tbody) return;

  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Memuat data presensi... ⏳</td></tr>';
  
  try {
    // Memanggil API Apps Script dengan parameter action=getPresensi
    const response = await fetch(GOOGLE_SCRIPT_URL + "?action=getPresensi");
    const dataArray = await response.json();
    
    let htmlString = "";
    dataArray.forEach(row => {
      const badgeClass = row[6].toLowerCase() === 'hadir' ? 'badge hadir' : 'badge';
      
      htmlString += "<tr>";
      htmlString += `<td>${row[0]}</td>`; 
      htmlString += `<td>${row[1]}</td>`; 
      htmlString += `<td>${row[2]}</td>`; 
      htmlString += `<td>${row[3]}</td>`; 
      htmlString += `<td>${row[4]}</td>`; 
      htmlString += `<td>${row[5]}</td>`; 
      htmlString += `<td><span class="${badgeClass}">${row[6]}</span></td>`; 
      htmlString += `<td>${row[7]}</td>`; 
      htmlString += "<td><button class='btn-edit'>Detail</button></td>";
      htmlString += "</tr>";
    });
    tbody.innerHTML = htmlString;

  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:red;">Gagal memuat data. Periksa koneksi atau URL.</td></tr>';
    console.error("Error Fetch Data Presensi:", error);
  }
}