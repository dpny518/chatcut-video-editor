// src/services/fileStorage.js
const DB_NAME = 'VideoEditorDB';
const STORE_NAME = 'files';
const VERSION = 1;

export const fileStorage = {
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'name' });
        }
      };
    });
  },

  async saveFile(file) {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.put({
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        data: file
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },

  async getFile(fileName) {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fileName);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const fileData = request.result;
        if (fileData) {
          // Convert back to File object
          const file = new File([fileData.data], fileData.name, {
            type: fileData.type,
            lastModified: fileData.lastModified
          });
          resolve(file);
        } else {
          resolve(null);
        }
      };
    });
  },

  async getAllFiles() {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const files = request.result.map(fileData => 
          new File([fileData.data], fileData.name, {
            type: fileData.type,
            lastModified: fileData.lastModified
          })
        );
        resolve(files);
      };
    });
  }
};