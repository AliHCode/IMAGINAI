import { openDB, DBSchema } from 'idb';

interface GeneratedImage {
  url: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  timestamp: number;
}

interface ImaginAIDB extends DBSchema {
  images: {
    key: number;
    value: GeneratedImage;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'imaginai-db';
const STORE_NAME = 'images';

export const initDB = async () => {
  return openDB<ImaginAIDB>(DB_NAME, 1, {
    upgrade(db) {
      const store = db.createObjectStore(STORE_NAME, {
        keyPath: 'timestamp',
      });
      store.createIndex('by-timestamp', 'timestamp');
    },
  });
};

export const saveImage = async (image: GeneratedImage) => {
  const db = await initDB();
  await db.put(STORE_NAME, image);
};

export const getAllImages = async () => {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'by-timestamp');
};

export const deleteImage = async (timestamp: number) => {
  const db = await initDB();
  await db.delete(STORE_NAME, timestamp);
};

export const clearAllImages = async () => {
  const db = await initDB();
  await db.clear(STORE_NAME);
};
