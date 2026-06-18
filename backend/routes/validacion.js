const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/:folio', async (req, res) => {
    try {
        const { folio } = req.params;
        const ipAddress = req.ip || req.connection.remoteAddress;

        const result = await pool.query(`
            SELECT d.folio, d.titulo, d.tipo_documento, d.area_emisora, 
                   d.url_validacion, d.created_at, e.nombre as estado, e.descripcion
            FROM documentos d
            JOIN estados e ON d.estado_id = e.id
            WHERE d.folio = $1
        `, [folio]);

        if (result.rows.length === 0) {
            await pool.query(
                `INSERT INTO bitacora_validaciones (documento_id, ip_address, resultado)
                 VALUES (NULL, $1, 'no_encontrado')`,
                [ipAddress]
            );
            return res.json({
                valido: false,
                mensaje: 'Documento no encontrado en el sistema',
                estado: 'no_registrado'
            });
        }

        const documento = result.rows[0];

        await pool.query(
            `INSERT INTO bitacora_validaciones (documento_id, ip_address, resultado)
             VALUES ((SELECT id FROM documentos WHERE folio = $1), $2, $3)`,
            [folio, ipAddress, documento.estado]
        );

        res.json({
            valido: documento.estado === 'vigente',
            mensaje: documento.estado === 'vigente' 
                ? 'Documento valido y vigente' 
                : `Documento ${documento.estado}`,
            documento: {
                folio: documento.folio,
                titulo: documento.titulo,
                tipo: documento.tipo_documento,
                area: documento.area_emisora,
                estado: documento.estado,
                fecha_emision: documento.created_at
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al validar documento' });
    }
});

module.exports = router;
