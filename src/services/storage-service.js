
export class StorageService {
    constructor() {
        this.HISTORY_KEY = 'history';
        this.SETTINGS_KEY = 'llmSettings';
    }

    /**
     * @param {Object} item 
     * @returns {Promise<void>}
     */
    async addToHistory(item) {
        return new Promise((resolve) => {
            chrome.storage.local.get([this.HISTORY_KEY], (result) => {
                const history = result[this.HISTORY_KEY] || [];
                history.unshift(item);
                if (history.length > 50) history.pop();
                
                chrome.storage.local.set({ [this.HISTORY_KEY]: history }, () => {
                    resolve();
                });
            });
        });
    }

    /**
     * @returns {Promise<Array>}
     */
    async getHistory() {
        return new Promise((resolve) => {
            chrome.storage.local.get([this.HISTORY_KEY], (result) => {
                resolve(result[this.HISTORY_KEY] || []);
            });
        });
    }

    /**
     * @returns {Promise<Object|null>}
     */
    async getLLMSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get([this.SETTINGS_KEY], (result) => {
                resolve(result[this.SETTINGS_KEY] || null);
            });
        });
    }

    async exportHistoryAsJson() {
        const history = await this.getHistory();
        const blob = new Blob([JSON.stringify(history, null, 2)], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `punpa-scan-${new Date().toISOString().slice(0,10)}.json`;
        a.click();
    }
}
