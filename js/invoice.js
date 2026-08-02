// Mengambil parameter 'id' dari URL (contoh: halaman.html?id=INV-202607-001)
const urlParams = new URLSearchParams(window.location.search);
const invoiceId = urlParams.get('id');

// URL Web App dari Google Apps Script 
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxKikzA4IHmfdVVTD1m4af5SDYM2mHCCJwbiS8szqVdkRDK7VP0k0wu6uxEMtajkljJeA/exec';

async function fetchInvoiceData() {
    if (!invoiceId) {
        alert('ID Invoice tidak ditemukan pada URL!');
        return;
    }

    try {
        // Melakukan request AJAX (Fetch) ke backend Google Apps Script
        const response = await fetch(`${SCRIPT_URL}?action=getInvoiceDetail&id=${invoiceId}`);
        const result = await response.json();

       if (result.status === 'success') {
            const data = result.data;
            
            // Masukkan data dari spreadsheet ke elemen HTML
            document.getElementById('inv-number').innerText = data.idInvoice;
            document.getElementById('inv-date').innerText = data.tanggalTerbit;
            document.getElementById('inv-period').innerText = data.periode;
            document.getElementById('table-period').innerText = data.periode;
            document.getElementById('student-name').innerText = data.namaSiswa;
            document.getElementById('class-type').innerText = data.kelas;
            document.getElementById('total-sessions').innerText = data.jumlahPertemuan;
            
            // Data baru: Status & Biaya Per Sesi
            document.getElementById('inv-status').innerText = data.statusBayar;
            document.getElementById('fee-per-session').innerText = data.biayaPerSesi;
            
            // Karena kita menggunakan getDisplayValues(), totalBiaya sudah berwujud "Rp 105.000"
            document.getElementById('subtotal-amount').innerText = data.totalBiaya;
            document.getElementById('grand-total').innerText = data.totalBiaya;
            
            // 👇 TAMBAHKAN LOGIKA INI DI SINI 👇
            const paymentContainer = document.getElementById('payment-methods-container');
            
            // Jika status bayar mengandung kata "Lunas" (mengabaikan huruf besar/kecil)
            if (data.statusBayar.toLowerCase().includes('lunas')) {
                paymentContainer.style.display = 'none'; // Sembunyikan kotak bank
            } else {
                paymentContainer.style.display = 'block'; // Tampilkan kotak bank
            }
            // 👆 BATAS PENAMBAHAN 👆

        } else {
            alert('Data invoice tidak ditemukan di database.');
        }
    } catch (error) {
        console.error('Gagal mengambil data:', error);
        alert('Terjadi kesalahan saat menghubungkan ke database.');
    }
}

// Jalankan fungsi saat halaman selesai dimuat
window.onload = fetchInvoiceData;


// Fungsi untuk tombol "Cari"
function searchInvoice() {
    const inputVal = document.getElementById('searchInput').value.trim();
    if (inputVal) {
        // Mengarahkan ulang halaman ke URL dengan parameter id baru
        window.location.href = 'inv.html?id=' + encodeURIComponent(inputVal);
    } else {
        alert('Mohon ketik nomor invoice terlebih dahulu!');
    }
}

// Menangkap parameter URL otomatis saat halaman dibuka
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceId = urlParams.get('id');
    
    if (invoiceId) {
        document.getElementById('searchInput').value = invoiceId;
        // Panggil fungsi utama untuk mengambil data dari Google Apps Script di sini
        // Contoh: fetchInvoiceData(invoiceId);
    }
});