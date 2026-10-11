const DB_NAME = 'mood-calendar-pwa';
const DB_VERSION = 1;
const STATE_STORE = 'state';
const IMAGE_STORE = 'images';

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STATE_STORE)) database.createObjectStore(STATE_STORE);
      if (!database.objectStoreNames.contains(IMAGE_STORE)) database.createObjectStore(IMAGE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getState<T>(key: string, fallback: T): Promise<T> {
  const database = await openDatabase();
  const transaction = database.transaction(STATE_STORE, 'readonly');
  const value = await requestResult(transaction.objectStore(STATE_STORE).get(key));
  database.close();
  return value === undefined ? fallback : value as T;
}

export async function setState(key: string, value: unknown) {
  const database = await openDatabase();
  const transaction = database.transaction(STATE_STORE, 'readwrite');
  transaction.objectStore(STATE_STORE).put(value, key);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  database.close();
}

export async function saveImage(blob: Blob) {
  const id = `image-${Date.now()}-${crypto.randomUUID()}`;
  const database = await openDatabase();
  const transaction = database.transaction(IMAGE_STORE, 'readwrite');
  transaction.objectStore(IMAGE_STORE).put(blob, id);
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  return id;
}

export async function getImageUrl(id: string) {
  const database = await openDatabase();
  const transaction = database.transaction(IMAGE_STORE, 'readonly');
  const blob = await requestResult<Blob | undefined>(transaction.objectStore(IMAGE_STORE).get(id));
  database.close();
  return blob ? URL.createObjectURL(blob) : null;
}

export async function deleteImages(ids: string[]) {
  if (!ids.length) return;
  const database = await openDatabase();
  const transaction = database.transaction(IMAGE_STORE, 'readwrite');
  ids.forEach((id) => transaction.objectStore(IMAGE_STORE).delete(id));
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function dataUrlToBlob(value: string) {
  const response = await fetch(value);
  return response.blob();
}
