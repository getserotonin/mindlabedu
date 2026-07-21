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
                mode: 'no-cors', 
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
        // Tidak lagi menggunakan getElementById untuk hari, melainkan dicari via querySelector nanti
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
        
        // Disable/enable semua checkbox hari
        const dayCheckboxes = document.querySelectorAll('input[name="pilihanHari[]"]');
        dayCheckboxes.forEach(cb => cb.disabled = isLoading);
        
        // Cek apakah ada minimal 1 hari yang dicentang
        const isAnyChecked = Array.from(dayCheckboxes).some(cb => cb.checked);
        this.sessionSelect.disabled = isLoading || !isAnyChecked;
    }

    toggleSubmitLoading(isLoading) {
        this.loadingSubmit.style.display = isLoading ? 'block' : 'none';
        this.submitBtn.disabled = isLoading;
        this.submitBtn.innerText = isLoading ? "Sedang Mengirim..." : "Kirim Data Pendaftaran";
    }

    // Render pilihan jam sesi secara dinamis berdasarkan HARI-HARI yang dicentang
    renderSessionOptions(selectedDays, fullSessionsList) {
        this.sessionSelect.innerHTML = '';
        
        // Jika tidak ada hari yang dicentang
        if (!selectedDays || selectedDays.length === 0) {
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
            // Sesi hanya bisa dipilih jika KOSONG DI SEMUA HARI yang dipilih
            const isAvailableOnAllSelectedDays = selectedDays.every(day => {
                const identifier = `${day}-${sesi}`;
                return !fullSessionsList.includes(identifier);
            });
            
            if (isAvailableOnAllSelectedDays) {
                const option = document.createElement('option');
                option.value = sesi;
                option.innerText = sesi;
                this.sessionSelect.appendChild(option);
                availableSlotsCount++;
            }
        });

        if (availableSlotsCount === 0) {
            this.sessionSelect.innerHTML = '<option value="">❌ Maaf, seluruh sesi di hari pilihan Anda telah penuh</option>';
            this.sessionSelect.disabled = true;
        } else {
            this.sessionSelect.disabled = false;
        }
    }

    getFormData() {
        const formDataObj = new FormData(this.form);
        const data = {};
        
        for (let [key, value] of formDataObj.entries()) {
            if (data[key]) {
                // Jika key sudah ada (berarti data multiple seperti checkbox), ubah jadi array
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }

        // FORMATTING UNTUK GOOGLE SHEETS: Gabungkan array pilihanHari[] menjadi string
        if (data['pilihanHari[]']) {
            data['pilihanHari'] = Array.isArray(data['pilihanHari[]']) 
                ? data['pilihanHari[]'].join(', ') 
                : data['pilihanHari[]'];
            delete data['pilihanHari[]']; // Hapus key lama agar rapi
        }

        return data;
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
        this.fullSessionsCache = []; 
    }

    init() {
        // Daftarkan event listener untuk SETIAP checkbox hari
        const dayCheckboxes = document.querySelectorAll('input[name="pilihanHari[]"]');
        dayCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => this.handleDayChange());
        });

        this.ui.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        this.preloadQuotaData();
    }

    async preloadQuotaData() {
        this.ui.toggleSessionLoading(true);
        this.fullSessionsCache = await this.api.getFullSessions();
        this.ui.toggleSessionLoading(false);
    }

    handleDayChange() {
        // Ambil semua value dari checkbox yang sedang dicentang
        const checkedBoxes = document.querySelectorAll('input[name="pilihanHari[]"]:checked');
        const selectedDays = Array.from(checkedBoxes).map(cb => cb.value); // Contoh output: ["Senin", "Rabu"]
        
        this.ui.renderSessionOptions(selectedDays, this.fullSessionsCache);
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
            this.preloadQuotaData();
        } else {
            alert("Terjadi kendala teknis saat mengirim data. Mohon coba beberapa saat lagi atau langsung hubungi Kak Andin.");
        }
    }
}

// --- INSTANSIASI DAN EKSEKUSI SISTEM ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyQCfI6qFuT9_XI7ir5jS5eR8UqsM6vufZu9uDzZA8qioYmsuVwc8SGneqfw-Y94615VQ/exec";

const apiInstance = new MindLabAPI(GOOGLE_SCRIPT_URL);
const uiInstance = new FormUI();
const app = new FormController(apiInstance, uiInstance);

// Jalankan sistem saat dokumen HTML siap
document.addEventListener('DOMContentLoaded', () => app.init());