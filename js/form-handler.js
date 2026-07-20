/**
 * MindLab Form Handler - OOP Version
 * Mengelola integrasi formulir dinamis dengan Google Sheets API secara akuntabel.
 */

// 1. CLASS API: Bertanggung jawab mutlak terhadap koneksi jaringan ke Google Apps Script
class MindLabAPI {
    constructor(endpointUrl) {
        this.endpointUrl = endpointUrl;
    }

    // Mengambil data sesi yang penuh dari Google Sheets
    async getFullSessions() {
        try {
            const response = await fetch(`${this.endpointUrl}?action=checkSlots`);
            if (!response.ok) throw new Error("Respons jaringan bermasalah");
            return await response.json(); 
            // Ekspektasi return: ["Senin-Sesi 1 (14.30)", "Rabu-Sesi 3 (17.30)"]
        } catch (error) {
            console.error("Gagal memuat kuota slot:", error);
            return []; // Kembalikan array kosong sebagai fallback keamanan
        }
    }

    // Mengirimkan semua data form ke Google Sheets
    async submitRegistration(formData) {
        try {
            const response = await fetch(this.endpointUrl, {
                method: 'POST',
                mode: 'no-cors', // Digunakan jika backend Apps Script tidak mengaktifkan CORS
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            return true;
        } catch (error) {
            console.error("Gagal mengirimkan data pendaftaran:", error);
            return false;
        }
    }
}

// 2. CLASS UI: Mengelola interaksi elemen DOM, validasi visual, dan state loading
class FormUI {
    constructor() {
        this.form = document.getElementById('formMindLab');
        this.daySelect = document.getElementById('pilihanHari');
        this.sessionSelect = document.getElementById('pilihanSesi');
        this.submitBtn = document.getElementById('btnSubmit');
        this.loadingSesi = document.getElementById('loadingSesi');
        this.loadingSubmit = document.getElementById('loadingSubmit');
        
        // Definisikan master data seluruh sesi yang ada di MindLab
        this.masterSessions = [
            "Siang (14.30 - 15.30)",
            "Sore (16.00 - 17.00)"
        ];
    }

    toggleSessionLoading(isLoading) {
        this.loadingSesi.style.display = isLoading ? 'block' : 'none';
        this.daySelect.disabled = isLoading;
        this.sessionSelect.disabled = isLoading || !this.daySelect.value;
    }

    toggleSubmitLoading(isLoading) {
        this.loadingSubmit.style.display = isLoading ? 'block' : 'none';
        this.submitBtn.disabled = isLoading;
        this.submitBtn.innerText = isLoading ? "Sedang Mengirim..." : "Kirim Data Pendaftaran";
    }

    // Render pilihan jam sesi secara dinamis dan hilangkan jika terdeteksi penuh
    renderSessionOptions(selectedDay, fullSessionsList) {
        this.sessionSelect.innerHTML = '';
        
        if (!selectedDay) {
            this.sessionSelect.innerHTML = '<option value="">Pilih Hari Terlebih Dahulu...</option>';
            this.sessionSelect.disabled = true;
            return;
        }

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.innerText = 'Pilih Jam Sesi...';
        this.sessionSelect.appendChild(defaultOption);

        let availableSlotsCount = 0;

        this.masterSessions.forEach(sesi => {
            // Gabungkan string untuk mencocokkan dengan data blacklist dari Google Sheets (Contoh: "Senin-Sesi 1 (14.30)")
            const identifier = `${selectedDay}-${sesi}`;
            
            if (!fullSessionsList.includes(identifier)) {
                const option = document.createElement('option');
                option.value = sesi;
                option.innerText = sesi;
                this.sessionSelect.appendChild(option);
                availableSlotsCount++;
            }
        });

        if (availableSlotsCount === 0) {
            this.sessionSelect.innerHTML = '<option value="">❌ Maaf, seluruh sesi di hari ini telah penuh</option>';
            this.sessionSelect.disabled = true;
        } else {
            this.sessionSelect.disabled = false;
        }
    }

    getFormData() {
        const formDataObj = new FormData(this.form);
        return Object.fromEntries(formDataObj.entries());
    }

    resetForm() {
        this.form.reset();
        this.sessionSelect.innerHTML = '<option value="">Pilih Hari Terlebih Dahulu...</option>';
        this.sessionSelect.disabled = true;
    }
}

// 3. CLASS CONTROLLER (ORCHESTRATOR): Menghubungkan logik bisnis API dengan antarmuka UI
class FormController {
    constructor(apiInstance, uiInstance) {
        this.api = apiInstance;
        this.ui = uiInstance;
        this.fullSessionsCache = []; // Menyimpan data kuota agar tidak boros hit API
    }

    init() {
        // Daftarkan event listener
        this.ui.daySelect.addEventListener('change', () => this.handleDayChange());
        this.ui.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Prapemuatan data kuota begitu halaman pertama kali dibuka (Asynchronous Prefetching)
        this.preloadQuotaData();
    }

    async preloadQuotaData() {
        this.ui.toggleSessionLoading(true);
        this.fullSessionsCache = await this.api.getFullSessions();
        this.ui.toggleSessionLoading(false);
    }

    handleDayChange() {
        const selectedDay = this.ui.daySelect.value;
        this.ui.renderSessionOptions(selectedDay, this.fullSessionsCache);
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        this.ui.toggleSubmitLoading(true);
        const payload = this.ui.getFormData();
        
        const isSuccess = await this.api.submitRegistration(payload);
        this.ui.toggleSubmitLoading(false);

        if (isSuccess) {
            alert("Selamat! Data Calon Siswa MindLab berhasil terkirim. Tim kami akan segera menghubungi Anda via WhatsApp.");
            this.ui.resetForm();
            // Refresh data kuota terbaru setelah ada pendaftaran masuk
            this.preloadQuotaData();
        } else {
            alert("Terjadi kendala teknis saat mengirim data. Mohon coba beberapa saat lagi atau langsung hubungi Kak Andin.");
        }
    }
}

// --- INSTANSIASI DAN EKSEKUSI SISTEM ---
// Ganti URL di bawah dengan tautan Web App dari Google Apps Script Anda nanti
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyQCfI6qFuT9_XI7ir5jS5eR8UqsM6vufZu9uDzZA8qioYmsuVwc8SGneqfw-Y94615VQ/exec";

const apiInstance = new MindLabAPI(GOOGLE_SCRIPT_URL);
const uiInstance = new FormUI();
const app = new FormController(apiInstance, uiInstance);

// Jalankan sistem saat dokumen HTML siap
document.addEventListener('DOMContentLoaded', () => app.init());