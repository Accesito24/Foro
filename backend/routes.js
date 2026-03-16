const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_super_secret_key_123'; // No es ideal en prod tenerlo harcodeado, pero sirve para el hackathon si no hay .env

// ==========================================
// MIDDLEWARE DE AUTENTICACIÓN
// ==========================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // Formato esperado: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Acceso denegado. Se requiere autenticación.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido o expirado.' });
        req.user = user; // Guardamos la info del token para usarla en la ruta
        next();
    });
}

// ==========================================
// RUTAS DE USUARIOS
// ==========================================

// REGISTRO
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        // Validación básica (Survival Checklist)
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
        }

        // Comprobamos si el usuario ya existe para dar un error amigable
        const stmtCheck = db.prepare('SELECT id FROM usuarios WHERE email = ? OR username = ?');
        const exists = stmtCheck.get(email, username);
        if (exists) {
            return res.status(409).json({ error: 'El nombre de usuario o email ya está en uso.' });
        }

        // Hasheamos la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertamos en la base de datos
        const stmtInsert = db.prepare('INSERT INTO usuarios (username, email, password) VALUES (?, ?, ?)');
        const result = stmtInsert.run(username, email, hashedPassword);

        // Evitamos enviar información sensible al cliente como el hash
        res.status(201).json({ 
            message: 'Usuario registrado correctamente.',
            userId: result.lastInsertRowid
        });

    } catch (error) {
        console.error('Error en /register:', error.message);
        res.status(500).json({ error: 'Error interno al registrar el usuario.' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier puede ser email o username

        if (!identifier || !password) {
             return res.status(400).json({ error: 'Identificador y contraseña son obligatorios.' });
        }

        // Buscamos al usuario por email o username
        const stmt = db.prepare('SELECT * FROM usuarios WHERE email = ? OR username = ?');
        const user = stmt.get(identifier, identifier);

        if (!user) {
            // Mensaje genérico para no dar pistas de qué falló (Seguridad)
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Comparamos contraseñas
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // Generamos Token de sesión
        const token = jwt.sign(
            { userId: user.id, username: user.username }, 
            JWT_SECRET, 
            { expiresIn: '2h' }
        );

        res.json({
            message: 'Login exitoso',
            token,
            username: user.username
        });

    } catch (error) {
        console.error('Error en /login:', error.message);
        res.status(500).json({ error: 'Error interno al intentar iniciar sesión.' });
    }
});

// ==========================================
// RUTAS DE MENSAJES (FORO)
// ==========================================

// OBTENER TODOS LOS MENSAJES (Público)
// (Reducción de info: No devolvemos el email ni el hash del autor, solo nombre y mensaje)
router.get('/messages', (req, res) => {
    try {
        const stmt = db.prepare(`
            SELECT m.id, m.texto, m.created_at, u.username as autor 
            FROM mensajes m
            JOIN usuarios u ON m.user_id = u.id
            ORDER BY m.created_at DESC
        `);
        const messages = stmt.all();
        
        res.json(messages);
    } catch (error) {
        console.error('Error en GET /messages:', error.message);
        res.status(500).json({ error: 'Error al cargar los mensajes.' });
    }
});

// AÑADIR UN MENSAJE (Protegido por JWT)
router.post('/messages', authenticateToken, (req, res) => {
    try {
        const { texto } = req.body;

        if (!texto || texto.trim().length === 0) {
            return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
        }
        
        if (texto.length > 500) {
             return res.status(400).json({ error: 'El mensaje es demasiado largo (máximo 500 caracteres).' });
        }

        // El userId viene del token verificado, confíamos en él y no en el frontend
        const userId = req.user.userId;

        const stmt = db.prepare('INSERT INTO mensajes (user_id, texto) VALUES (?, ?)');
        const result = stmt.run(userId, texto);

        res.status(201).json({ 
            message: 'Mensaje publicado correctamente.',
            messageId: result.lastInsertRowid 
        });

    } catch (error) {
        console.error('Error en POST /messages:', error.message);
        res.status(500).json({ error: 'Error al publicar el mensaje.' });
    }
});

module.exports = router;
