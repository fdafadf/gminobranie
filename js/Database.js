export class Database
{
    /**
     * @param {string[]} table_names 
     */
    constructor(table_names)
    {
        this.table_names = table_names;
    }

    /**
     * @param {string} table_name 
     * @param {any} id 
     * @returns any
     */
    async get(table_name, id)
    {
        return this.table(table_name, table =>
        {
            return new Promise((resolve, reject) => 
            {
                let request = table.get(id);
                request.onerror = reject;
                request.onsuccess = e =>
                {
                    // @ts-ignore
                    resolve(e.target.result);
                };
            });
        });
    }

    /**
     * @param {string} table_name 
     * @param {any} entity 
     * @returns any
     */
    async add(table_name, entity)
    {
        return await this.table(table_name, table =>
        {
            table.add(entity);
        });
    }

    /**
     * @param {string} table_name 
     * @param {any} item 
     * @returns 
     */
    async update(table_name, item)
    {
        return this.table(table_name, table =>
        {
            return new Promise((resolve, reject) => 
            {
                let request = table.put(item);
                request.onerror = reject;
                request.onsuccess = e =>
                {
                    // @ts-ignore
                    resolve(e.target.result);
                };
            });
        });
    }

    /**
     * @param {string} table_name 
     * @param {any} key 
     * @returns any
     */
    async delete(table_name, key)
    {
        return this.table(table_name, table =>
        {
            table.delete(key);
        });
    }

    /**
     * @param {string} table_name 
     * @returns 
     */
    async items(table_name)
    {
        return this.table(table_name, async table =>
        {
            return new Promise((resolve, reject) => 
            {
                let items = {};
                let cursor = table.openCursor();
                cursor.onerror = reject;
                cursor.onsuccess = e =>
                {
                    // @ts-ignore
                    let result = e.target.result;

                    if (result) 
                    {
                        // @ts-ignore
                        items[result.key] = result.value;
                        result.continue();
                    }
                    else 
                    {
                        resolve(items);
                    }
                };
            });
        });
    }

    /**
     * 
     * @param {string} table_name 
     * @param {(table: IDBObjectStore) => any} callback 
     * @returns 
     */
    async table(table_name, callback)
    {
        return new Promise((resolve, reject) => 
        {
            let db = window.indexedDB.open("Gminobranie");
            db.onerror = reject;
            db.onsuccess = e => 
            {
                /** @type {any} */
                let result;
                // @ts-ignore
                let transaction = e.target.result.transaction([table_name], "readwrite");
                transaction.onerror = reject;
                transaction.oncomplete = async () =>
                {
                    resolve(result ? await result : result);
                }
                result = callback(transaction.objectStore(table_name));
            }
            db.onupgradeneeded = e => 
            {
                // @ts-ignore
                this.table_names.forEach(table_name => e.target.result.createObjectStore(table_name, { keyPath: "id" }));
            }
        });
    }
}