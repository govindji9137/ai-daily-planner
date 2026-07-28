/**
 * Storage Provider Abstraction
 * 
 * Defines the contract for all storage providers in the application.
 * This allows swapping out implementations (e.g., LocalStorage -> Supabase)
 * without modifying UI or business logic.
 */

export class StorageProvider {
  /**
   * Fetch a single record by ID.
   * @param {string} collection - The namespace/collection name.
   * @param {string} id - The record ID.
   * @returns {Promise<any>}
   */
  async get(collection, id) { throw new Error('Not implemented'); }

  /**
   * Fetch all records in a collection.
   * @param {string} collection - The namespace/collection name.
   * @returns {Promise<any[]>}
   */
  async list(collection) { throw new Error('Not implemented'); }

  /**
   * Save a new record.
   * @param {string} collection - The namespace/collection name.
   * @param {object} data - The data to save.
   * @returns {Promise<any>} The saved record with generated ID.
   */
  async save(collection, data) { throw new Error('Not implemented'); }

  /**
   * Update an existing record.
   * @param {string} collection - The namespace/collection name.
   * @param {string} id - The record ID.
   * @param {object} updates - The data to update.
   * @returns {Promise<any>} The updated record.
   */
  async update(collection, id, updates) { throw new Error('Not implemented'); }

  /**
   * Delete a record by ID.
   * @param {string} collection - The namespace/collection name.
   * @param {string} id - The record ID.
   * @returns {Promise<void>}
   */
  async delete(collection, id) { throw new Error('Not implemented'); }
}

/**
 * LocalStorage Implementation of the Storage Provider.
 */
export class LocalStorageProvider extends StorageProvider {
  _getCollection(collection) {
    const data = localStorage.getItem(`geoplaner_${collection}`);
    return data ? JSON.parse(data) : [];
  }

  _setCollection(collection, data) {
    localStorage.setItem(`geoplaner_${collection}`, JSON.stringify(data));
  }

  async get(collection, id) {
    const items = this._getCollection(collection);
    return items.find(item => item.id === id) || null;
  }

  async list(collection) {
    return this._getCollection(collection);
  }

  async save(collection, data) {
    const items = this._getCollection(collection);
    const newRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    items.push(newRecord);
    this._setCollection(collection, items);
    return newRecord;
  }

  async update(collection, id, updates) {
    const items = this._getCollection(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) throw new Error(`Record ${id} not found in ${collection}`);
    
    const updatedRecord = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    items[index] = updatedRecord;
    this._setCollection(collection, items);
    return updatedRecord;
  }

  async delete(collection, id) {
    const items = this._getCollection(collection);
    const filtered = items.filter(item => item.id !== id);
    this._setCollection(collection, filtered);
  }
}

// Export a singleton instance of the active provider
export const storage = new LocalStorageProvider();
