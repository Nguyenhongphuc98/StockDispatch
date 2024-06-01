const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const dbPath = process.env.SQLITE_DB_LOCATION || '/etc/database/todo.db';

let db, dbAll, dbRun;

export function init() {
    const dirName = require('path').dirname(dbPath);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    return new Promise<void>((resolve, rej) => {
        db = new sqlite3.Database(dbPath, err => {
            if (err) return rej(err);

            if (process.env.NODE_ENV !== 'test')
                console.log(`Using sqlite database at ${dbPath}`);

            db.run(
                'CREATE TABLE IF NOT EXISTS todo_items (id varchar(36), name varchar(255), completed boolean)',
                (err, result) => {
                    if (err) return rej(err);
                    resolve();
                },
            );
        });
    });
}

export async function teardown() {
    return new Promise<void>((resolve, rej) => {
        db.close(err => {
            if (err) rej(err);
            else resolve();
        });
    });
}

export async function getItems() {
    return new Promise<void>((resolve, rej) => {
        db.all('SELECT * FROM todo_items', (err, rows) => {
            if (err) return rej(err);
            resolve(
                rows.map(item =>
                    Object.assign({}, item, {
                        completed: item.completed === 1,
                    }),
                ),
            );
        });
    });
}

export async function getItem(id) {
    return new Promise((resolve, rej) => {
        db.all('SELECT * FROM todo_items WHERE id=?', [id], (err, rows) => {
            if (err) return rej(err);
            resolve(
                rows.map(item =>
                    Object.assign({}, item, {
                        completed: item.completed === 1,
                    }),
                )[0],
            );
        });
    });
}

export async function storeItem(item) {
    return new Promise<void>((resolve, rej) => {
        db.run(
            'INSERT INTO todo_items (id, name, completed) VALUES (?, ?, ?)',
            [item.id, item.name, item.completed ? 1 : 0],
            err => {
                if (err) return rej(err);
                resolve();
            },
        );
    });
}

export async function updateItem(id, item) {
    return new Promise<void>((resolve, rej) => {
        db.run(
            'UPDATE todo_items SET name=?, completed=? WHERE id = ?',
            [item.name, item.completed ? 1 : 0, id],
            err => {
                if (err) return rej(err);
                resolve();
            },
        );
    });
} 

export async function removeItem(id) {
    return new Promise<void>((resolve, rej) => {
        db.run('DELETE FROM todo_items WHERE id = ?', [id], err => {
            if (err) return rej(err);
            resolve();
        });
    });
}
