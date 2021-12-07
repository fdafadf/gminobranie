export class Database
{
    table_names = ['Routes', 'Activities'];

    async add(table_name, item)
    {
        return this.table(table_name, table =>
        {
            table.add(item);
        });
    }

    async delete(table_name, key)
    {
        return this.table(table_name, table =>
        {
            table.delete(key);
        });
    }

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
                    let result = e.target.result;

                    if (result) 
                    {
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

    async table(table_name, callback)
    {
        return new Promise((resolve, reject) => 
        {
            let db = window.indexedDB.open("Gminobranie");
            db.onerror = reject;
            db.onsuccess = e => 
            {
                let result;
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
                this.table_names.forEach(table_name => e.target.result.createObjectStore(table_name, { keyPath: "id" }));
            }
        });
    }
}