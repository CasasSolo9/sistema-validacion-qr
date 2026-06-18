# Sistema de Validacion Documental con Codigo QR

## Descripcion
Sistema web para la carga, gestion y validacion publica de documentos PDF mediante codigos QR unicos.

## Tecnologias Utilizadas
- **Backend:** Node.js + Express
- **Frontend:** HTML5 + CSS3 + JavaScript vanilla
- **Base de Datos:** PostgreSQL
- **Generacion QR:** libreria `qrcode`
- **Manipulacion PDF:** libreria `pdf-lib`
- **Contenedores:** Docker + Docker Compose

## Estructura del Proyecto
```
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── config/database.js
│   ├── middleware/auth.js
│   ├── models/init-db.sql
│   └── routes/
│       ├── auth.js
│       ├── documentos.js
│       └── validacion.js
└── frontend/
    ├── Dockerfile
    ├── index.html
    ├── login.html
    ├── panel.html
    ├── validar.html
    └── css/styles.css
```

## Instrucciones de Instalacion

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

### 4. Credenciales de prueba
| Usuario | Email | Contrasena | Rol |
|---------|-------|------------|-----|
| Administrador | admin@sistema.qr | password123 | admin |
| Capturista | capturista@sistema.qr | password123 | capturista |

## Funcionalidades
- Login de usuarios autorizados
- Carga de documentos PDF
- Generacion de folio unico
- Generacion de QR con URL de validacion
- Insercion de QR en el PDF (5 posiciones)
- Repositorio de documentos
- Descarga de PDF con QR
- Revocacion de documentos
- Validacion publica sin login
- Bitacora de consultas

## Autores
- Equipo de desarrollo
- UNAM Aragon - Ingenieria
