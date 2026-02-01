import { LLMService } from './llm-service.js';

export class ExtractionService {
    constructor() {
    }

    /**
     * @param {string} text - 
     * @param {Object} settings - 
     * @param {Object} env - 
     * @returns {Promise<{data: Object, source: string}>} - 
     */
    async extract(text, settings, env) {
        const safeSettings = settings || {
            provider: 'custom',
            apiUrl: env.OLLAMA_API_URL,
            model: env.OLLAMA_MODEL,
            apiKey: 'ollama' 
        };

        const isCustom = safeSettings.provider === 'custom';
        const hasValidKey = safeSettings.apiKey && safeSettings.apiKey.length > 0;

        if (isCustom || hasValidKey) {
            try {
                console.log("🤖 ExtractionService: Attempting LLM extraction...");
                const llm = new LLMService(safeSettings);
                const data = await llm.parse(text);
                return { data, source: 'LLM' };

            } catch (error) {
                console.warn("⚠️ ExtractionService: LLM failed, falling back to Regex.", error);
            }
        } else {
            console.log("ℹ️ ExtractionService: LLM not configured, skipping to Regex.");
        }
        console.log("🧩 ExtractionService: Using Regex fallback.");
        const data = this._regexFallback(text);
        return { data, source: 'Regex' };
    }

    /**
     * @param {string} text 
     * @returns {Object}
     */
    _regexFallback(text) {
        const dateRegex = /(\d{1,2}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{2,4})|(\d{1,2}\s*(?:Ocak|Şubat|Mart|Nisan|Mayıs|Haziran|Temmuz|Ağustos|Eylül|Ekim|Kasım|Aralık))/i;
        const timeRegex = /(\d{1,2}\s*[:.]\s*\d{2})/;
        
        const dateMatch = text.match(dateRegex);
        const timeMatch = text.match(timeRegex);

        return {
            tarih: dateMatch ? dateMatch[0] : '',
            saat: timeMatch ? timeMatch[0] : '',
            mekan: '',
            konum: '',
            sanatci: '',
            etkinlik: ''
        };
    }
}
