const express = require('express');
const router = express.Router();
const multer = require('multer');
const QRCode = require('qrcode');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/originales/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'));
        }
    }
});

// Generar folio único
function generarFolio() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DOC-${timestamp}-${random}`;
}

// Subir documento y generar QR
router.post('/upload', verificarToken, upload.single('pdf'), async (req, res) => {
    try {
        const { titulo, tipo_documento, area_emisora, posicion_qr } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No se proporcionó archivo PDF' });
        }

        const folio = generarFolio();
        const urlValidacion = `${req.protocol}://${req.get('host')}/validar.html?folio=${folio}`;

        // Generar QR como imagen PNG
        const qrFileName = `qr-${folio}.png`;
        const qrPath = path.join(__dirname, '..', 'uploads', qrFileName);
        await QRCode.toFile(qrPath, urlValidacion, {
            width: 150,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        // Insertar QR en el PDF
        const pdfBytes = await fs.readFile(file.path);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();
        const lastPage = pages[pages.length - 1];

        // Cargar imagen QR
        const qrImageBytes = await fs.readFile(qrPath);
        const qrImage = await pdfDoc.embedPng(qrImageBytes);

        // Determinar posición
        const { width: pageWidth, height: pageHeight } = lastPage.getSize();
        const qrSize = 100;
        let x, y;

        switch(posicion_qr) {
            case 'superior-derecha':
                x = pageWidth - qrSize - 20;
                y = pageHeight - qrSize - 20;
                break;
            case 'superior-izquierda':
                x = 20;
                y = pageHeight - qrSize - 20;
                break;
            case 'inferior-derecha':
                x = pageWidth - qrSize - 20;
                y = 20;
                break;
            case 'inferior-izquierda':
                x = 20;
                y = 20;
                break;
            case 'ultima-pagina':
            default:
                x = pageWidth - qrSize - 20;
                y = 20;
                break;
        }

        lastPage.drawImage(qrImage, {
            x,
            y,
            width: qrSize,
            height: qrSize
        });

        // Guardar PDF con QR
        const pdfConQrBytes = await pdfDoc.save();
        const pdfConQrPath = path.join(__dirname, '..', 'uploads', 'con-qr', `${folio}.pdf`);
        await fs.writeFile(pdfConQrPath, pdfConQrBytes);

        // Guardar en base de datos
        const result = await pool.query(
            `INSERT INTO documentos 
             (folio, titulo, tipo_documento, area_emisora, ruta_pdf_original, 
              ruta_pdf_qr, ruta_qr_imagen, url_validacion, usuario_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                folio,
                titulo,
                tipo_documento,
                area_emisora,
                file.path,
                pdfConQrPath,
                qrPath,
                urlValidacion,
                req.usuario.id
            ]
        );

        res.json({
            mensaje: 'Documento cargado exitosamente',
            documento: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al procesar el documento' });
    }
});

// Obtener todos los documentos
router.get('/', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT d.*, e.nombre as estado, u.nombre as usuario_nombre
            FROM documentos d
            JOIN estados e ON d.estado_id = e.id
            JOIN usuarios u ON d.usuario_id = u.id
            ORDER BY d.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener documentos' });
    }
});

// Revocar documento
router.put('/revocar/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE documentos 
             SET estado_id = (SELECT id FROM estados WHERE nombre = 'revocado'),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        res.json({ mensaje: 'Documento revocado exitosamente', documento: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al revocar documento' });
    }
});

// Descargar PDF con QR
router.get('/descargar/:folio', verificarToken, async (req, res) => {
    try {
        const { folio } = req.params;
        const result = await pool.query(
            'SELECT ruta_pdf_qr FROM documentos WHERE folio = $1',
            [folio]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        const filePath = result.rows[0].ruta_pdf_qr;
        res.download(filePath, `${folio}.pdf`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al descargar documento' });
    }
});

module.exports = router;
