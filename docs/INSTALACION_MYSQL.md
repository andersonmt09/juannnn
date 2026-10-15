# Instalación de MySQL 8 (Windows)

## Opción A: winget (recomendada)

```powershell
winget install Oracle.MySQL --accept-package-agreements --accept-source-agreements
```

Después inicializa el data directory (solo la primera vez):

```powershell
$bin = 'C:\Program Files\MySQL\MySQL Server 8.4\bin'
$data = 'C:\ProgramData\MySQL\MySQL Server 8.4\Data'
New-Item -ItemType Directory -Force -Path $data
& "$bin\mysqld.exe" --initialize-insecure --datadir="$data"
```

Inicia el servidor:

```powershell
$bin = 'C:\Program Files\MySQL\MySQL Server 8.4\bin'
$data = 'C:\ProgramData\MySQL\MySQL Server 8.4\Data'
Start-Process -FilePath "$bin\mysqld.exe" -ArgumentList "--datadir=$data" -WindowStyle Hidden
```

Comprueba:

```powershell
& 'C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqladmin.exe' -u root ping
```

## Opción B: XAMPP

Instala XAMPP (incluye MySQL/MariaDB) y arranca MySQL desde el panel de control de XAMPP.

## Configuración del backend

Edita `backend/.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=   # deja vacío si usaste --initialize-insecure
DB_NAME=axon_db
```

Luego ejecuta `npm run db:init` dentro de `backend`.

## Solución de problemas

- **Can't connect to MySQL server**: asegúrate de que el servicio esté corriendo.
- **Access denied for user 'root'**: verifica la contraseña en `.env` o reinicializa con `--initialize-insecure`.
- **Puerto 3306 ocupado**: cambia `DB_PORT` en `.env` y el `--port` de arranque.
