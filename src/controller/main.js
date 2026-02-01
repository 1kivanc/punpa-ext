import { UIManager } from '../ui/ui-manager.js';
import { StorageService } from '../services/storage-service.js';
import { OCRService } from '../services/ocr-service.js';
import { ExtractionService } from '../services/extraction-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    if (typeof process === 'undefined') {
        window.process = { env: {} };
    }
    
    if (!process.env.OCR_SERVER_URL) {
       console.log("♻️ Running from Source: Fetching env from backend...");
       try {
           const response = await fetch('http://127.0.0.1:5000/config');
           if (response.ok) {
               const remoteConfig = await response.json();
               Object.assign(process.env, remoteConfig);
               console.log('✅ Env loaded runtime:', process.env);
           }
       } catch (e) {
           console.warn('Config fetch failed, using defaults.', e);
           process.env.OCR_SERVER_URL = 'http://127.0.0.1:5000';
           process.env.OLLAMA_API_URL = 'http://localhost:11434/v1/chat/completions';
           process.env.OLLAMA_MODEL = 'qwen2.5:3b-instruct';
       }
    } else {
        console.log('✅ Env loaded from build:', process.env);
    }

    const ui = new UIManager();
    const storage = new StorageService();
    const ocrService = new OCRService(process.env.OCR_SERVER_URL);
    const extractionService = new ExtractionService();

    if (ui.scanBtn) {
        ui.scanBtn.addEventListener('click', async () => {
            ui.resetForScan();

            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (!tab) throw new Error("Aktif sekme bulunamadı.");

                const imageBase64 = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 80 });
                if (!imageBase64) throw new Error("Ekran görüntüsü alınamadı.");

                ui.updateStatus("OCR ile metin okunuyor...");
                const rawText = await ocrService.recognize(imageBase64);
                
                ui.log(`OCR Ham Sonuç:\n${rawText.substring(0, 100)}...`);

                ui.updateStatus("Veri ayıklanıyor...");
                const settings = await storage.getLLMSettings();
                
                const { data, source } = await extractionService.extract(rawText, settings, process.env);
                
                ui.log(`${source} ile başarıyla ayıklandı.`);
                ui.fillForm(data, rawText);
                ui.showResults();
                ui.updateStatus("Tamamlandı!");
                // --------------------------------

            } catch (error) {
                ui.log(`Hata: ${error.message}`, true);
                ui.updateStatus("Başarısız.");
                console.error(error);
                ui.scanBtn.disabled = false;
            }
        });
    }
    storage.getHistory().then(history => ui.renderHistory(history));

    if (ui.saveBtn) {
        ui.saveBtn.addEventListener('click', async () => {
            const data = ui.getFormData();
            await storage.addToHistory(data);
            ui.showSaveSuccess();
            const history = await storage.getHistory();
            ui.renderHistory(history);
        });
    } 

    if (ui.exportBtn) {
        ui.exportBtn.addEventListener('click', () => storage.exportHistoryAsJson());
    }

});
