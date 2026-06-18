const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const documentoRoutes = require('./routes/documentos');
const validacionRoutes = require('./routes/validacion');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configurado para permitir el frontend en localhost:8080
app.use(cors({
    origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Servir archivos estaticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/api/validar', validacionRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Sistema de Validacion QR funcionando' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
