const express = require('express');
const router = express.Router();
const multer = require('multer');
const QRCode = require('qrcode');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');

// Asegurar que las carpetas existen
const uploadsDir = path.join(__dirname, '..', 'uploads');
const originalesDir = path.join(uploadsDir, 'originales');
const conQrDir = path.join(uploadsDir, 'con-qr');

async function ensureDirs() {
    try {
        await fs.mkdir(uploadsDir, { recursive: true });
        await fs.mkdir(originalesDir, { recursive: true });
        await fs.mkdir(conQrDir, { recursive: true });
    } catch (e) {
        console.error('Error creando directorios:', e);
    }
}
ensureDirs();

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        await ensureDirs();
        cb(null, originalesDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
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

function generarFolio() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DOC-${timestamp}-${random}`;
}

router.post('/upload', verificarToken, upload.single('pdf'), async (req, res) => {
    console.log('=== INICIO UPLOAD ===');
    try {
        const { titulo, tipo_documento, area_emisora, posicion_qr } = req.body;
        const file = req.file;

        console.log('Datos recibidos:', { titulo, tipo_documento, area_emisora, posicion_qr });
        console.log('Archivo:', file ? { name: file.originalname, path: file.path, size: file.size } : 'NO FILE');

        if (!file) {
            console.log('ERROR: No se proporciono archivo PDF');
            return res.status(400).json({ error: 'No se proporciono archivo PDF' });
        }

        const folio = generarFolio();
        const urlValidacion = `http://localhost:8080/validar.html?folio=${folio}`;
        console.log('Folio generado:', folio);
        console.log('URL validacion:', urlValidacion);

        // Generar QR
        const qrFileName = `qr-${folio}.png`;
        const qrPath = path.join(uploadsDir, qrFileName);
        console.log('Generando QR en:', qrPath);

        try {
            await QRCode.toFile(qrPath, urlValidacion, {
                width: 150,
                margin: 2,
                color: { dark: '#000000', light: '#FFFFFF' }
            });
            console.log('QR generado exitosamente');
        } catch (qrError) {
            console.error('ERROR generando QR:', qrError);
            return res.status(500).json({ error: 'Error al generar codigo QR: ' + qrError.message });
        }

        // Leer PDF original
        console.log('Leyendo PDF original:', file.path);
        let pdfBytes;
        try {
            pdfBytes = await fs.readFile(file.path);
            console.log('PDF leido, tamaño:', pdfBytes.length, 'bytes');
        } catch (readError) {
            console.error('ERROR leyendo PDF:', readError);
            return res.status(500).json({ error: 'Error al leer PDF: ' + readError.message });
        }

        // Cargar PDF
        let pdfDoc;
        try {
            pdfDoc = await PDFDocument.load(pdfBytes);
            console.log('PDF cargado, paginas:', pdfDoc.getPageCount());
        } catch (loadError) {
            console.error('ERROR cargando PDF:', loadError);
            return res.status(500).json({ error: 'Error al cargar PDF: ' + loadError.message });
        }

        const pages = pdfDoc.getPages();
        const lastPage = pages[pages.length - 1];

        // Cargar imagen QR
        let qrImageBytes;
        try {
            qrImageBytes = await fs.readFile(qrPath);
            console.log('Imagen QR leida, tamaño:', qrImageBytes.length, 'bytes');
        } catch (qrReadError) {
            console.error('ERROR leyendo imagen QR:', qrReadError);
            return res.status(500).json({ error: 'Error al leer QR: ' + qrReadError.message });
        }

        let qrImage;
        try {
            qrImage = await pdfDoc.embedPng(qrImageBytes);
            console.log('QR embebido en PDF');
        } catch (embedError) {
            console.error('ERROR embebiendo QR:', embedError);
            return res.status(500).json({ error: 'Error al insertar QR: ' + embedError.message });
        }

        // Posicion
        const { width: pageWidth, height: pageHeight } = lastPage.getSize();
        const qrSize = 100;
        let x, y;

        switch(posicion_qr) {
            case 'superior-derecha':
                x = pageWidth - qrSize - 20; y = pageHeight - qrSize - 20;
                break;
            case 'superior-izquierda':
                x = 20; y = pageHeight - qrSize - 20;
                break;
            case 'inferior-derecha':
                x = pageWidth - qrSize - 20; y = 20;
                break;
            case 'inferior-izquierda':
                x = 20; y = 20;
                break;
            case 'ultima-pagina':
            default:
                x = pageWidth - qrSize - 20; y = 20;
                break;
        }

        console.log('Dibujando QR en posicion:', { x, y, qrSize });
        lastPage.drawImage(qrImage, { x, y, width: qrSize, height: qrSize });

        // Guardar PDF con QR
        let pdfConQrBytes;
        try {
            pdfConQrBytes = await pdfDoc.save();
            console.log('PDF con QR guardado en memoria, tamaño:', pdfConQrBytes.length);
        } catch (saveError) {
            console.error('ERROR guardando PDF:', saveError);
            return res.status(500).json({ error: 'Error al guardar PDF: ' + saveError.message });
        }

        const pdfConQrPath = path.join(conQrDir, `${folio}.pdf`);
        try {
            await fs.writeFile(pdfConQrPath, pdfConQrBytes);
            console.log('PDF con QR escrito en:', pdfConQrPath);
        } catch (writeError) {
            console.error('ERROR escribiendo PDF:', writeError);
            return res.status(500).json({ error: 'Error al escribir PDF: ' + writeError.message });
        }

        // Guardar en base de datos
        console.log('Guardando en base de datos...');
        let result;
        try {
            result = await pool.query(
                `INSERT INTO documentos 
                 (folio, titulo, tipo_documento, area_emisora, ruta_pdf_original, 
                  ruta_pdf_qr, ruta_qr_imagen, url_validacion, usuario_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [folio, titulo, tipo_documento, area_emisora, file.path, 
                 pdfConQrPath, qrPath, urlValidacion, req.usuario.id]
            );
            console.log('Documento guardado en BD, ID:', result.rows[0].id);
        } catch (dbError) {
            console.error('ERROR base de datos:', dbError);
            return res.status(500).json({ error: 'Error en base de datos: ' + dbError.message });
        }

        console.log('=== FIN UPLOAD - EXITO ===');
        res.json({
            mensaje: 'Documento cargado exitosamente',
            documento: result.rows[0]
        });

    } catch (error) {
        console.error('=== ERROR GENERAL UPLOAD ===', error);
        res.status(500).json({ error: 'Error al procesar el documento: ' + error.message });
    }
});

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

router.get('/descargar/:folio', verificarToken, async (req, res) => {
    try {
        const { folio } = req.params;
        const result = await pool.query(
            'SELECT ruta_pdf_qr FROM documentos WHERE folio = $1', [folio]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }
        res.download(result.rows[0].ruta_pdf_qr, `${folio}.pdf`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al descargar documento' });
    }
});

module.exports = router;
