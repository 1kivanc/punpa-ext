export class UIManager {
    constructor() {
        this.scanBtn = document.getElementById('scan-btn');
        this.statusDiv = document.getElementById('status');
        this.statusText = document.getElementById('status-text');
        this.resultArea = document.getElementById('result-area');
        this.saveBtn = document.getElementById('save-btn');
        this.historyList = document.getElementById('history-list');
        this.exportBtn = document.getElementById('export-btn');
        this.debugLog = document.getElementById('debug-log');
        
        this.dateInput = document.getElementById('date-input');
        this.timeInput = document.getElementById('time-input');
        this.locationInput = document.getElementById('location-input');
        this.cityInput = document.getElementById('city-input');
        this.rawTextInput = document.getElementById('raw-text');
    }
    resetForScan() {
        this.scanBtn.disabled = true;
        this.resultArea.classList.add('hidden');
        this.statusDiv.classList.remove('hidden');
        this.statusText.textContent = "Hazırlanıyor...";
        this.debugLog.innerHTML = ''; 
    }

    /**
     * @param {string} text 
     */
    updateStatus(text) {
        this.statusText.textContent = text;
    }

    showResults() {
        this.statusDiv.classList.add('hidden');
        this.resultArea.classList.remove('hidden');
        this.scanBtn.disabled = false;
    }

    /**
     * @param {Object} data 
     * @param {string} rawText 
     */
    fillForm(data, rawText) {
        this.dateInput.value = '';
        this.timeInput.value = '';
        this.locationInput.value = '';
        this.cityInput.value = '';
        this.rawTextInput.value = '';

        if (data.tarih) this.dateInput.value = data.tarih;
        if (data.saat) this.timeInput.value = data.saat;
        
        if (data.mekan) this.locationInput.value = data.mekan;
        if (data.konum && this.cityInput) this.cityInput.value = data.konum;

        let metadata = '';
        if (data.sanatci) metadata += `Sanatçı: ${data.sanatci} | `;
        if (data.etkinlik) metadata += `Etkinlik: ${data.etkinlik}`;
        
        this.rawTextInput.value = metadata ? `${metadata}\n\n[Ham OCR]:\n${rawText}` : rawText;
    }

    /**
     * @param {string} msg 
     * @param {boolean} isError 
     */
    log(msg, isError = false) {
        const line = document.createElement('div');
        line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        line.style.color = isError ? '#ef4444' : '#94a3b8';
        this.debugLog.appendChild(line);
        console.log(msg); 
    }

    /**
     * Renders history list.
     * @param {Array} historyItems 
     */
    renderHistory(historyItems) {
        this.historyList.innerHTML = '';
        historyItems.slice(0, 5).forEach(item => {
            const li = document.createElement('li');
            const mekan = item.location || 'Mekan Yok';
            const date = item.date || '-';
            li.innerHTML = `<span>${mekan}</span> <span style="color:var(--text-muted)">${date}</span>`;
            this.historyList.appendChild(li);
        });
    }

    showSaveSuccess() {
        const originalText = this.saveBtn.textContent;
        this.saveBtn.textContent = 'Kaydedildi!';
        this.saveBtn.classList.add('success');
        setTimeout(() => {
            this.saveBtn.textContent = originalText;
            this.saveBtn.classList.remove('success');
        }, 2000);
    }

    getFormData() {
        return {
            id: Date.now(),
            date: this.dateInput.value,
            time: this.timeInput.value,
            location: this.locationInput.value,
            city: this.cityInput.value,
            rawText: this.rawTextInput.value,
            timestamp: new Date().toISOString()
        };
    }
}
