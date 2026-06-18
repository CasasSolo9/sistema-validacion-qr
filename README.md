# Sistema de Validación Documental con Código QR

## Descripción
Sistema web para la carga, gestión y validación pública de documentos PDF mediante códigos QR únicos.

## Tecnologías Utilizadas
- **Backend:** Node.js + Express (API REST ligera y rápida)
- **Frontend:** HTML5 + CSS3 + JavaScript vanilla (sin frameworks, ligero)
- **Base de Datos:** PostgreSQL (robusta, relacional, compatible con Docker)
- **Generación QR:** librería `qrcode` de npm
- **Manipulación PDF:** librería `pdf-lib` de npm
- **Contenedores:** Docker + Docker Compose

## Estructura del Proyecto
```
├── docker-compose.yml      # Orquestación de contenedores
├── backend/                # API REST (Node.js/Express)
│   ├── Dockerfile
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── models/init-db.sql
│   └── uploads/
└── frontend/               # Interfaz de usuario
    ├── login.html
    ├── panel.html
    ├── validar.html
    └── css/styles.css
```

## Instrucciones de Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/sistema-validacion-qr.git
cd sistema-validacion-qr
```

### 2. Ejecutar con Docker Compose
```bash
docker compose up --build
```

### 3. Acceder al sistema
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000
- **Base de datos:** localhost:5432

### 4. Credenciales de prueba
| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Administrador | admin@sistema.qr | password123 | admin |
| Capturista | capturista@sistema.qr | password123 | capturista |

## Funcionalidades
- Login de usuarios autorizados
- Carga de documentos PDF
- Generación de folio único
- Generación de QR con URL de validación
- Inserción de QR en el PDF (5 posiciones)
- Repositorio de documentos
- Descarga de PDF con QR
- Revocación de documentos
- Validación pública sin login
- Bitácora de consultas

## Diagramas
- Ver carpeta `/docs/` para diagramas de caso de uso y entidad-relación.

## Autores
- [Nombre del equipo]
- UNAM Aragón - Ingeniería
