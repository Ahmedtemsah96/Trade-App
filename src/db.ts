// IndexedDB storage layer - all data stored locally in browser
const DB_NAME = 'ContainerLedger';
const DB_VERSION = 1;

const STORES = [
  'organizations',
  'containers',
  'cost_entries',
  'quality_events',
  'sales_entries',
  'vendors',
  'products',
  'shipments',
  'vendor_payments',
];

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      db = req.result;
      resolve(db);
    };

    req.onupgradeneeded = (e) => {
      const database = (e.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!database.objectStoreNames.contains('organizations')) {
        database.createObjectStore('organizations', { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains('containers')) {
        const store = database.createObjectStore('containers', { keyPath: 'id' });
        store.createIndex('organization_id', 'organization_id', { unique: false });
      }
      if (!database.objectStoreNames.contains('cost_entries')) {
        const store = database.createObjectStore('cost_entries', { keyPath: 'id' });
        store.createIndex('container_id', 'container_id', { unique: false });
        store.createIndex('organization_id', 'organization_id', { unique: false });
      }
      if (!database.objectStoreNames.contains('quality_events')) {
        const store = database.createObjectStore('quality_events', { keyPath: 'id' });
        store.createIndex('container_id', 'container_id', { unique: false });
        store.createIndex('organization_id', 'organization_id', { unique: false });
      }
      if (!database.objectStoreNames.contains('sales_entries')) {
        const store = database.createObjectStore('sales_entries', { keyPath: 'id' });
        store.createIndex('container_id', 'container_id', { unique: false });
        store.createIndex('organization_id', 'organization_id', { unique: false });
      }
      if (!database.objectStoreNames.contains('vendors')) {
        const store = database.createObjectStore('vendors', { keyPath: 'id' });
        store.createIndex('organization_id', 'organization_id', { unique: false });
      }
      if (!database.objectStoreNames.contains('products')) {
        const store = database.createObjectStore('products', { keyPath: 'id' });
        store.createIndex('organization_id', 'organization_id', { unique: false });
      }
      if (!database.objectStoreNames.contains('shipments')) {
        const store = database.createObjectStore('shipments', { keyPath: 'id' });
        store.createIndex('organization_id', 'organization_id', { unique: false });
      }
      if (!database.objectStoreNames.contains('vendor_payments')) {
        const store = database.createObjectStore('vendor_payments', { keyPath: 'id' });
        store.createIndex('vendor_id', 'vendor_id', { unique: false });
        store.createIndex('organization_id', 'organization_id', { unique: false });
      }
    };
  });
}

export async function getDB(): Promise<IDBDatabase> {
  if (!db) {
    db = await initDB();
  }
  return db;
}

export async function query<T>(store: string, index?: string, value?: any): Promise<T[]> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readonly');
    const req = index && value !== undefined ? tx.objectStore(store).index(index).getAll(value) : tx.objectStore(store).getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as T[]);
  });
}

export async function get<T>(store: string, id: string): Promise<T | undefined> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as T);
  });
}

export async function insert<T extends { id?: string }>(store: string, record: T): Promise<T> {
  const database = await getDB();
  if (!record.id) {
    record.id = crypto.randomUUID();
  }
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');
    const req = tx.objectStore(store).add(record);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(record);
  });
}

export async function update<T extends { id: string }>(store: string, record: T): Promise<T> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(record);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(record);
  });
}

export async function delete_(store: string, id: string): Promise<void> {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

export async function exportData() {
  const data: Record<string, any[]> = {};
  for (const store of STORES) {
    data[store] = await query(store);
  }
  return data;
}

export async function importData(data: Record<string, any[]>) {
  const database = await getDB();
  for (const [store, records] of Object.entries(data)) {
    const tx = database.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    for (const record of records) {
      tx.objectStore(store).add(record);
    }
  }
}
