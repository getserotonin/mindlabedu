/**
 * MindLab Form Handler - OOP Version
 * Mengelola integrasi formulir dinamis dengan Google Sheets API secara akuntabel.
 */

// 1. CLASS API
class MindLabAPI {
    constructor(endpointUrl) {
        this.endpointUrl = endpointUrl;
    }

    async getFullSessions() {
        try {
            const response = await fetch(`${this.endpointUrl}?action=checkSlots`);
            if (!response.ok) throw new Error("Respons jaringan bermasalah");
            return await response.json(); 
        } catch (error) {
            console.error("Gagal memuat kuota slot:", error);
            return []; 
        }
    }

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

// 2. CLASS UI
class FormUI {
    constructor() {
        this.form = document.getElementById('formMindLab');
        this.sessionSelect = document.getElementById('pilihanSesi');
        this.submitBtn = document.getElementById('btnSubmit');
        this.loadingSesi = document.getElementById('loadingSesi');
        this.loadingSubmit = document.getElementById('loadingSubmit');
        
        this.masterSessions = [
            "Siang (14.30 - 15.30)",
            "Sore (16.00 - 17.00)"
        ];
    }

    toggleSessionLoading(isLoading) {
        this.loadingSesi.style.display = isLoading ? 'block' : 'none';
        
        const dayCheckboxes = document.querySelectorAll('input[name="pilihanHari[]"]');
        dayCheckboxes.forEach(cb => cb.disabled = isLoading);
        
        const isAnyChecked = Array.from(dayCheckboxes).some(cb => cb.checked);
        this.sessionSelect.disabled = isLoading || !isAnyChecked;
    }

    toggleSubmitLoading(isLoading) {
        this.loadingSubmit.style.display = isLoading ? 'block' : 'none';
        this.submitBtn.disabled = isLoading;
        this.submitBtn.innerText = isLoading ? "Sedang Mengirim..." : "Kirim Data Pendaftaran";
    }

    renderSessionOptions(selectedDays, fullSessionsList) {
        this.sessionSelect.innerHTML = '';
        
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
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }

        if (data['pilihanHari[]']) {
            data['pilihanHari'] = Array.isArray(data['pilihanHari[]']) 
                ? data['pilihanHari[]'].join(', ') 
                : data['pilihanHari[]'];
            delete data['pilihanHari[]'];
        }

        return data;
    }

    resetForm() {
        this.form.reset();
        this.sessionSelect.innerHTML = '<option value="">Pilih Hari Terlebih Dahulu...</option>';
        this.sessionSelect.disabled = true;
    }
}

// 3. CLASS CONTROLLER
class FormController {
    constructor(apiInstance, uiInstance) {
        this.api = apiInstance;
        this.ui = uiInstance;
        this.fullSessionsCache = []; 
    }

    init() {
        const dayCheckboxes = document.querySelectorAll('input[name="pilihanHari[]"]');
        dayCheckboxes.forEach(cb => {
            // Kita kirimkan data event (e) saat diklik untuk keperluan validasi
            cb.addEventListener('change', (e) => this.handleDayChange(e));
        });

        this.ui.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        this.preloadQuotaData();
    }

    async preloadQuotaData() {
        this.ui.toggleSessionLoading(true);
        this.fullSessionsCache = await this.api.getFullSessions();
        this.ui.toggleSessionLoading(false);
    }

    handleDayChange(event) {
        const checkedBoxes = document.querySelectorAll('input[name="pilihanHari[]"]:checked');
        
        // LOGIKA PEMBATASAN MAKSIMAL 3 HARIi
        if (checkedBoxes.length > 3) {
            event.target.checked = false; // Batalkan centang yang baru saja di-klik
            alert("Maksimal Anda hanya bisa memilih 3 hari dalam sepekan.");
            return; // Hentikan proses, jangan lanjut ke render jam sesi
        }

        const selectedDays = Array.from(document.querySelectorAll('input[name="pilihanHari[]"]:checked')).map(cb => cb.value); 
        
        this.ui.renderSessionOptions(selectedDays, this.fullSessionsCache);
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        // Tambahan validasi keamanan sebelum di-submit
        const checkedBoxes = document.querySelectorAll('input[name="pilihanHari[]"]:checked');
        if (checkedBoxes.length === 0) {
            alert("Mohon pilih minimal 1 hari jadwal pembelajaran.");
            return;
        }
        if (checkedBoxes.length > 3) {
            alert("Maksimal hanya 3 hari jadwal pembelajaran.");
            return;
        }

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

// --- INSTANSIASI ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyQCfI6qFuT9_XI7ir5jS5eR8UqsM6vufZu9uDzZA8qioYmsuVwc8SGneqfw-Y94615VQ/exec";

const apiInstance = new MindLabAPI(GOOGLE_SCRIPT_URL);
const uiInstance = new FormUI();
const app = new FormController(apiInstance, uiInstance);

document.addEventListener('DOMContentLoaded', () => app.init());