const Database = require('better-sqlite3');
const path = require('path');

// Conectamos a SQLite. El archivo db.sqlite estará en la carpeta 'data'
// que está mapeada en el docker-compose como un volumen persistente.
const dbPath = path.join(__dirname, 'data', 'db.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Activamos las foreign keys
db.pragma('foreign_keys = ON');

// Función para inicializar las tablas
function initDb() {
    // Tabla de usuarios (con contraseña hasheada)
    db.exec(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Tabla de mensajes
    db.exec(`
        CREATE TABLE IF NOT EXISTS mensajes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            texto TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES usuarios(id)
        )
    `);
    console.log('Base de datos inicializada correctamente.');
}

module.exports = {
    db,
    initDb
};
