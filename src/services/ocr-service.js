export class OCRService {
    constructor(serverUrl) {
        if (!serverUrl) throw new Error("OCR Service: serverUrl is required!");
        this.serverUrl = serverUrl;
    }

    /**
     * @param {string} imageBase64 
     * @returns {Promise<string>} 
     */
    async recognize(imageBase64) {
        if (!imageBase64) {
            throw new Error("Görsel verisi boş.");
        }

        try {
            const response = await fetch(`${this.serverUrl}/ocr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: imageBase64 })
            });

            if (!response.ok) {
                let errorMessage = `Sunucu Hatası (${response.status})`;
                try {
                    const errJson = await response.json();
                    if (errJson.error) {
                        errorMessage += `: ${errJson.error}`;
                    }
                } catch (e) {
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (!data.text) {
                throw new Error("Sunucudan boş metin döndü.");
            }

            return data.text;

        } catch (error) {
            console.error("OCR Service Error:", error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error("OCR Sunucusu (Python) çalışmıyor! Lütfen './backend/start.sh' komutunu çalıştırın.");
            }
            throw error;
        }
    }
}
