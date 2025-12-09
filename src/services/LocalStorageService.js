const DB_NAME = 'spda-reports-db';
const DB_VERSION = 1;
const STORES = {
    REPORTS: 'reports',
    IMAGES: 'images',
    SETTINGS: 'settings'
};

export const LocalStorageService = {
    db: null,

    async openDB() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORES.REPORTS)) {
                    db.createObjectStore(STORES.REPORTS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.IMAGES)) {
                    db.createObjectStore(STORES.IMAGES, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('[LocalStorageService] FATAL: Error opening database.', event.target.error);
                reject('Error opening database: ' + event.target.error);
            };
        });
    },

    async saveReport(reportData) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.REPORTS], 'readwrite');
            const store = transaction.objectStore(STORES.REPORTS);

            // Ensure ID exists
            if (!reportData.id) {
                reportData.id = crypto.randomUUID();
            }

            reportData.updatedAt = new Date().toISOString();
            if (!reportData.createdAt) {
                reportData.createdAt = new Date().toISOString();
            }

            const request = store.put(reportData);

            request.onsuccess = () => resolve(reportData.id);
            request.onerror = () => reject(request.error);
        });
    },

    async getReport(id) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.REPORTS], 'readonly');
            const store = transaction.objectStore(STORES.REPORTS);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getUserReports(userId) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.REPORTS], 'readonly');
            const store = transaction.objectStore(STORES.REPORTS);
            const request = store.getAll();

            request.onsuccess = () => {
                const allReports = request.result;
                // Filter by userId if needed, though in local mode usually all reports are "yours"
                // But to keep consistency with the schema:
                const userReports = allReports.filter(r => r.userId === userId);
                resolve(userReports);
            };
            request.onerror = () => reject(request.error);
        });
    },

    async deleteReport(id) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.REPORTS], 'readwrite');
            const store = transaction.objectStore(STORES.REPORTS);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async saveImage(file) {
        console.log('[LocalStorageService] saveImage called for file:', file.name);
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.IMAGES], 'readwrite');
            const store = transaction.objectStore(STORES.IMAGES);

            const id = crypto.randomUUID();
            const imageRecord = {
                id: id,
                name: file.name,
                type: file.type,
                blob: file,
                createdAt: new Date().toISOString()
            };
            
            console.log('[LocalStorageService] Preparing to save image record to IndexedDB:', imageRecord);

            const request = store.put(imageRecord);

            request.onsuccess = () => {
                const result = {
                    name: file.name,
                    url: `local-image://${id}`,
                    path: `local/${id}`,
                    type: file.type,
                    size: file.size,
                    uploadedAt: imageRecord.createdAt
                };
                console.log('[LocalStorageService] Successfully saved image to IndexedDB. Returning:', result);
                resolve(result);
            };
            request.onerror = () => {
                console.error('[LocalStorageService] CRITICAL: Error saving image to IndexedDB.', request.error);
                reject(request.error);
            };
        });
    },

    async getImage(id) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([STORES.IMAGES], 'readonly');
            const store = transaction.objectStore(STORES.IMAGES);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    // Helper to convert local-image:// URL to Blob URL
    async resolveImageUrl(url) {
        console.log(`[LocalStorageService] resolveImageUrl called with URL: ${url}`);
        if (!url || !url.startsWith('local-image://')) {
            console.warn('[LocalStorageService] URL is invalid or not a local-image scheme.');
            return url;
        }
        const id = url.split('local-image://')[1];
        console.log(`[LocalStorageService] Attempting to get image with ID: ${id}`);
        const record = await this.getImage(id);
        if (record && record.blob) {
            console.log(`[LocalStorageService] Found image record for ID ${id}. Creating blob URL.`);
            const blobUrl = URL.createObjectURL(record.blob);
            console.log(`[LocalStorageService] Created blob URL: ${blobUrl}`);
            return blobUrl;
        }
        console.error(`[LocalStorageService] CRITICAL: No image record or blob found for ID ${id}.`);
        return null;
    }
};
