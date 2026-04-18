# Panel Gradu

Plataforma de gestión de graduación: Cuotas, rifas, finanzas y coordinación operativa.

## Módulo 0: Setup Local con Docker

Este proyecto consta de 3 contenedores separados (Database MariaDB, Backend Node.js y Frontend React), gestionados mediante `docker-compose`.

### Prerrequisitos
- Docker y Docker Compose instalados.

### Instalación

1. Copia las variables de entorno de ejemplo:
   ```bash
   cp .env.example .env
   ```

2. Levanta los contenedores:
   ```bash
   docker-compose up -d --build
   ```

### Puertos Locales

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000  (Healthcheck en `/health`)
- **Base de Datos:** 3306
