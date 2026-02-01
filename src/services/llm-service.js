export class LLMService {
    constructor(settings) {
        this.settings = settings || {};
        this.apiUrl = this.settings.apiUrl || process.env.OLLAMA_API_URL;
        this.model = 'qwen2.5:3b-instruct'; 
    }

    /**
     * @param {string} text 
     * @returns {Promise<Object>} 
     */
    async parse(text) {
        const systemPrompt = `GÖREVİN:
Bu metinden SADECE aşağıdaki alanları çıkar ve SADECE geçerli bir JSON döndür.

Alanlar: (mekan, konum, tarih, saat, etkinlik, sanatci)

KURALLAR:
- Türkçe yaz
- Emin olmadığın alanı null yap, tahmin etme
- Açıklama yazma, sadece JSON döndür

MEKAN BULMA STRATEJİSİ (ÖNEMLİ):
1. 'mekan': SADECE işletme adını yaz (Örn: "Geyik Pub", "Jolly Joker"). Şehir adı buraya YAZILMAZ.
2. 'konum': SADECE şehir veya semt adını yaz (Örn: "Fethiye", "Muğla", "Hisarönü").
3. Instagram kullanıcı adı ipucunu kullan (örn: "geyikfethiye" -> mekan: "Geyik Pub", konum: "Fethiye").
4. OCR hatalarını düzelt ("KGEYIK" -> "Geyik").

Metin:
"${text}"
    
İSTENEN ÇIKTI (SADECE JSON):
{
    "mekan": "Sadece İşletme Adı",
    "konum": "Sadece Şehir/Semt",
    "tarih": "GG Ay (Örn: 31 Ocak)",
    "saat": "SS:DK",
    "etkinlik": "Etkinlik Türü",
    "sanatci": "Sanatçı Adı"
}`;

        const payload = {
            model: this.model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Analiz et ve JSON dön." }
            ],
            temperature: 0.1, 
            max_tokens: 500,
            top_p: 0.9,
            stream: false
        };

        return this._sendRequest(payload);
    }

    async _sendRequest(payload) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); 

        try {
            const response = await fetch(this.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(this.settings.apiKey ? { "Authorization": `Bearer ${this.settings.apiKey}` } : {})
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const err = await response.text();
                if (response.status === 404) {
                    throw new Error(`Model Bulunamadı (${this.model}). Lütfen 'ollama pull ${this.model}' komutunu çalıştırın.`);
                }
                throw new Error(`Ollama API Hatası: ${response.status} - ${err}`);
            }

            const data = await response.json();
            const resultText = data.choices[0].message.content;
            return this._cleanAndParseJSON(resultText);

        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                 throw new Error("Ollama yanıt vermedi (Zaman Aşımı). Model yükleniyor olabilir.");
            }
            if (error.message.includes('Failed to fetch')) {
                throw new Error("Ollama servisine ulaşılamıyor. 'ollama serve' çalışıyor mu?");
            }
            throw error;
        }
    }

    _cleanAndParseJSON(text) {
        console.log("LLM Raw Output:", text);
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
           text = jsonMatch[0];
        }

        let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            return JSON.parse(clean);
        } catch (e) {
            console.error("JSON Parse Error. Raw:", text);
            throw new Error(`LLM geçerli bir JSON üretmedi. Hatalı çıktı: ${text.substring(0, 50)}...`);
        }
    }
}
