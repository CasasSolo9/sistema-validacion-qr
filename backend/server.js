const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const documentoRoutes = require('./routes/documentos');
const validacionRoutes = require('./routes/validacion');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/api/validar', validacionRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Sistema de Validación QR funcionando' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
