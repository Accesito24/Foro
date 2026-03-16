const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const routes = require('./routes'); // Importamos las rutas

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de middlewares
// Permite peticiones cruzadas desde el frontend
app.use(cors());
// Parsear body en JSON
app.use(express.json());

// Inicializa la base de datos (crea tablas si no existen)
initDb();

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API funcionando correctamente' });
});

// Montamos todas las rutas de la API bajo /api
app.use('/api', routes);

// Middleware de manejo de errores global (Survival Checklist: Control de errores)
app.use((err, req, res, next) => {
    console.error('Error de servidor:', err.message);
    // Nunca devolvemos el stack trace al cliente en producción (vulnerabilidad de exposición de información)
    res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
    console.log(`Servidor API arrancado en el puerto ${PORT}`);
});
