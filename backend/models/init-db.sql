-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'capturista',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de estados de documento
CREATE TABLE IF NOT EXISTS estados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE,
    descripcion VARCHAR(100)
);

INSERT INTO estados (nombre, descripcion) VALUES 
    ('vigente', 'Documento activo y valido'),
    ('revocado', 'Documento revocado, no valido'),
    ('cancelado', 'Documento cancelado por el emisor')
ON CONFLICT (nombre) DO NOTHING;

-- Tabla de documentos
CREATE TABLE IF NOT EXISTS documentos (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    tipo_documento VARCHAR(100) NOT NULL,
    area_emisora VARCHAR(100) NOT NULL,
    estado_id INTEGER REFERENCES estados(id) DEFAULT 1,
    ruta_pdf_original VARCHAR(500),
    ruta_pdf_qr VARCHAR(500),
    ruta_qr_imagen VARCHAR(500),
    url_validacion VARCHAR(500),
    usuario_id INTEGER REFERENCES usuarios(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de bitacora de validaciones
CREATE TABLE IF NOT EXISTS bitacora_validaciones (
    id SERIAL PRIMARY KEY,
    documento_id INTEGER REFERENCES documentos(id),
    ip_address VARCHAR(45),
    resultado VARCHAR(20),
    fecha_consulta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuario de prueba: admin@sistema.qr / password123
-- Hash generado con bcrypt 10 rounds
INSERT INTO usuarios (nombre, email, password, rol) VALUES 
    ('Administrador', 'admin@sistema.qr', '$2b$10$LW6ce/q2OheNvJ3ms3EPuOPsWtd1fQ9ocusJddhFFyjL3.uyAuPQC', 'admin'),
    ('Capturista', 'capturista@sistema.qr', '$2b$10$LW6ce/q2OheNvJ3ms3EPuOPsWtd1fQ9ocusJddhFFyjL3.uyAuPQC', 'capturista')
ON CONFLICT (email) DO NOTHING;
