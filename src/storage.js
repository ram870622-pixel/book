const opened = new Promise((resolve, reject) => {
  const request = indexedDB.open('little-story-studio', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('books', { keyPath: 'id' });
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
export async function transact(mode, operation) {
  const db = await opened;
  return new Promise((resolve, reject) => {
    const tx = db.transaction('books', mode);
    const request = operation(tx.objectStore('books'));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export const loadBooks = () => transact('readonly', store => store.getAll());
export const saveBook = book => transact('readwrite', store => store.put(book));
export const deleteBook = id => transact('readwrite', store => store.delete(id));
