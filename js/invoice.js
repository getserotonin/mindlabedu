const urlParams = new URLSearchParams(window.location.search);
const invoiceId = urlParams.get('id');
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxhhM3K0en9YlWcuG79KBG8eahtGEvBUUEC7HFH2ZjSdeRHJOAujb9jOWg5fiFdgvAZjA/exec';

async function fetchInvoiceData() {
    if (!invoiceId) return;

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = invoiceId;

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getInvoiceDetail&id=${invoiceId}`);
        const result = await response.json();

       if (result.status === 'success') {
            const data = result.data;
            
            // Fallback aman agar tidak tampil 'undefined'
            document.getElementById('inv-number').innerText = data.idInvoice || '-';
            document.getElementById('inv-date').innerText = data.tanggalTerbit || '-';
            document.getElementById('inv-period').innerText = data.periode || '-';
            document.getElementById('table-period').innerText = data.periode || '-';
            document.getElementById('student-name').innerText = data.namaSiswa || '-';
            
            const classTypeEl = document.getElementById('class-type');
            if(classTypeEl) classTypeEl.innerText = data.kelas || 'Privat / Group';

            document.getElementById('total-sessions').innerText = data.jumlahPertemuan || '0';
            
            // Keamanan konversi teks status
            const statusText = String(data.statusBayar || 'Menunggu');
            const statusElement = document.getElementById('inv-status');
            
            statusElement.innerText = statusText;
            statusElement.className = 'status-badge'; 
            
            if (statusText.toLowerCase().includes('lunas')) {
                statusElement.classList.add('lunas');     
            } else {
                statusElement.classList.add('menunggu');  
            }

            document.getElementById('fee-per-session').innerText = data.biayaPerSesi || 'Rp 0';            
            document.getElementById('subtotal-amount').innerText = data.totalBiaya || 'Rp 0';
            document.getElementById('grand-total').innerText = data.totalBiaya || 'Rp 0';
            
            const paymentContainer = document.getElementById('payment-methods-container');
            if (statusText.toLowerCase().includes('lunas')) {
                paymentContainer.style.display = 'none'; 
            } else {
                paymentContainer.style.display = 'block'; 
            }
        } else {
            alert('Data invoice tidak ditemukan di database.');
        }
    } catch (error) {
        console.error('Gagal mengambil data:', error);
        alert('Terjadi kesalahan koneksi ke server.');
    }
}

window.onload = fetchInvoiceData;

function searchInvoice() {
    const inputVal = document.getElementById('searchInput').value.trim();
    if (inputVal) {
        window.location.href = 'inv.html?id=' + encodeURIComponent(inputVal);
    } else {
        alert('Mohon ketik nomor invoice terlebih dahulu!');
    }
}