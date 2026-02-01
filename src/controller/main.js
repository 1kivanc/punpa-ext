import { UIManager } from '../ui/ui-manager.js';
import { StorageService } from '../services/storage-service.js';
import { OCRService } from '../services/ocr-service.js';
import { LLMService } from '../services/llm-service.js';

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

    async function processWithLLM(text) {
        let settings = await storage.getLLMSettings();

        if (!settings) {
            settings = {
                provider: 'custom',
                apiUrl: process.env.OLLAMA_API_URL,
                model: process.env.OLLAMA_MODEL,
                apiKey: 'ollama'
            };
        }

        const isCustom = settings.provider === 'custom';
        const hasValidKey = settings.apiKey && settings.apiKey.length > 5;

        if (!isCustom && !hasValidKey) {
            ui.log("LLM Ayarlı değil. Regex fallback...", true);
            ui.updateStatus("LLM Yok -> Regex");
            fallbackRegex(text);
            return;
        }

        ui.log("Yapay Zeka (LLM) ile analiz ediliyor...");
        ui.updateStatus("Yapay Zeka Analizi...");

        try {
            const llm = new LLMService(settings);
            const data = await llm.parse(text, null);
            
            ui.log("LLM Yanıtı Başarılı!");
            ui.fillForm(data, text);
            ui.showResults();
            ui.updateStatus("Tamamlandı!");

        } catch (llmErr) {
            ui.log(`LLM Hatası: ${llmErr.message}`, true);
            ui.updateStatus("LLM Hatası -> Regex");
            fallbackRegex(text);
        }
    }

    function fallbackRegex(text) {
        const dateRegex = /(\d{1,2}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{2,4})|(\d{1,2}\s*(?:Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık))/i;
        const timeRegex = /(\d{1,2}\s*[:.]\s*\d{2})/;
        
        const dateMatch = text.match(dateRegex);
        const timeMatch = text.match(timeRegex);

        const fallbackData = {
            tarih: dateMatch ? dateMatch[0] : '',
            saat: timeMatch ? timeMatch[0] : '',
            mekan: '',
            konum: '',
            sanatci: '',
            etkinlik: ''
        };
        
        ui.fillForm(fallbackData, text);
        ui.showResults();
    }
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

                await processWithLLM(rawText);

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
