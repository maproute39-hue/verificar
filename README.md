# VerificarIT

VerificarIT es una PWA en Angular para la gestión de inspecciones vehiculares. La aplicación permite autenticar usuarios, crear inspecciones, capturar firmas, adjuntar fotografías, consultar historiales por placa, controlar vencimientos documentales y generar reportes PDF a partir de una plantilla Excel.

La solución actual funciona como frontend estático Angular conectado directamente a PocketBase y Gotenberg:

- Angular 21 standalone como cliente web/PWA.
- PocketBase como backend de autenticación, datos, archivos y realtime.
- ExcelJS para completar plantillas XLSX en el navegador.
- Gotenberg para convertir XLSX/HTML a PDF.

## Estado Del Proyecto

El repositorio fue depurado para entrega:

- Se eliminaron flujos obsoletos, servicios sin uso, guards no conectados, utilidades vacías y archivos locales de respaldo.
- `src/app` contiene solo componentes, páginas y servicios activos.
- La documentación técnica autocontenida está disponible en `docs/index.html`.
- La validación TypeScript pasa con `npx tsc -p tsconfig.app.json --noEmit`.
- El build requiere Node `>=20.19` o `>=22.12`; con Node 18 Angular CLI no ejecuta.

## Funcionalidades

- Login con PocketBase.
- Dashboard con inspecciones recientes, carga completa en segundo plano y métricas.
- Búsqueda por placa con historial e inspección heredada.
- Formulario multipaso para nuevas inspecciones.
- Captura de firmas de conductor e inspector.
- Carga y gestión de imágenes de inspección.
- Detalle y edición de inspecciones existentes.
- Cálculo de estado de inspección: `borrador`, `aprobada`, `rechazada`.
- Alertas de vencimiento para vigencia, SOAT, tecnomecánica y licencia.
- Exportación de PDF con datos, firmas e imágenes.
- PWA con manifest y service worker de Angular.

## Arquitectura

```text
Navegador/PWA
  |
  |-- Angular 21 standalone
  |   |-- routes: login, home, nueva, heredada, inspections, detail/:id
  |   |-- services: auth, inspections, realtime, excel, gotenberg, pwa
  |   `-- assets/templates/inspection.xlsx
  |
  |-- PocketBase v0.19.0 HTTPS
  |   |-- users
  |   |-- files
  |   |-- inspections
  |   |-- images
  |   |-- firmas
  |   `-- secuencias
  |
  `-- Gotenberg HTTPS
      |-- /forms/libreoffice/convert
      `-- /forms/chromium/convert/html
```

No hay backend Node dentro del repositorio. El frontend consume PocketBase y Gotenberg directamente desde el navegador.

## Stack Técnico

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21, standalone components |
| Lenguaje | TypeScript 5.9 |
| PWA | `@angular/service-worker`, `ngsw-config.json`, `public/manifest.json` |
| Backend de datos | PocketBase server `v0.19.0` |
| Cliente de datos | PocketBase SDK `pocketbase@^0.26.6` |
| Realtime | PocketBase realtime subscriptions |
| Formularios | Angular Reactive Forms, FormsModule |
| Firmas | `@almothafar/angular-signature-pad` |
| Fechas | Flatpickr |
| Modales | SweetAlert2 |
| Excel | ExcelJS, xlsx |
| Descargas | file-saver |
| PDF | Gotenberg |
| Galería | ngx-lightbox |
| UI | Assets locales en `public/assets` |

## Requisitos

- Node.js `>=20.19` o `>=22.12`.
- npm `>=10`.
- Angular CLI compatible con Angular 21.
- PocketBase `v0.19.0` accesible por HTTPS.
- Gotenberg accesible por HTTPS.

```bash
node --version
npm --version
npx ng version
```

## Instalación

```bash
npm ci
```

Desarrollo:

```bash
npm start
```

La app queda disponible en:

```text
http://localhost:4200
```

Validación TypeScript:

```bash
npx tsc -p tsconfig.app.json --noEmit
```

Build productivo:

```bash
npm run build
```

Salida del build:

```text
dist/verificar-app/browser
```

## Estructura

```text
.
├── angular.json
├── ngsw-config.json
├── proxy.conf.json
├── docs/
│   ├── index.html
│   └── pb_schema.json
├── public/
│   ├── manifest.json
│   └── assets/
│       ├── templates/
│       │   ├── inspection.xlsx
│       │   └── resultado.pdf
│       ├── images/
│       ├── icons/
│       ├── libs/
│       └── js/
├── src/
│   ├── main.ts
│   ├── index.html
│   ├── styles.scss
│   └── app/
│       ├── app.config.ts
│       ├── app.routes.ts
│       ├── components/
│       │   ├── footer/
│       │   ├── header/
│       │   └── sidebar/
│       ├── models/
│       ├── pages/
│       │   ├── detail/
│       │   ├── heredada/
│       │   ├── home/
│       │   ├── inspections/
│       │   ├── login/
│       │   └── nueva/
│       └── services/
└── package.json
```

## Rutas

| Ruta | Componente | Propósito |
|---|---|---|
| `/` | Redirect | Redirige a `/login`. |
| `/login` | `Login` | Autenticación de usuario. |
| `/home` | `Home` | Dashboard, métricas, búsqueda, alertas e historial. |
| `/nueva` | `Nueva` | Creación de inspección. |
| `/heredada` | `Heredada` | Nueva inspección desde una inspección base. |
| `/inspections` | `Inspections` | Listado general con búsqueda y eliminación. |
| `/detail/:id` | `Detail` | Detalle, edición, imágenes, firmas y PDF. |

## Servicios Principales

| Servicio | Responsabilidad |
|---|---|
| `AuthService` | Login, logout, usuario actual, perfil y recuperación de contraseña. |
| `InspectionService` | CRUD principal, imágenes, secuencias y URLs de archivos. |
| `RealtimeInspectionsService` | Realtime, caché local, carga progresiva y eliminación. |
| `ExcelExportService` | Generación de XLSX y PDF desde plantilla. |
| `GotenbergService` | Conversión XLSX/HTML a PDF y descarga de blobs. |
| `PwaInstallService` | Instalación PWA desde `beforeinstallprompt`. |
| `SharedService` | Estado simple de ruta actual usado por layout. |

## Modelo De Datos

El esquema de PocketBase está versionado en `docs/pb_schema.json` y corresponde a PocketBase server `v0.19.0`. La aplicación activa consume principalmente `users`, `inspections`, `images` y `secuencias`; el export también conserva colecciones de soporte y una colección histórica de busetas que ya no tiene componente Angular activo.

Colecciones del export:

| Colección | Uso |
|---|---|
| `users` | Auth collection con perfil, rol, teléfono, avatar y estado. |
| `inspections` | Registro principal activo de inspecciones; 117 campos de datos, checklist, evidencias y verificación. |
| `images` | Archivos/fotografías; campo file `image` con tamaño máximo aproximado de 50 MB. |
| `secuencias` | Consecutivos por tipo y prefijo: `ultimo_numero`, `tipo_inspeccion`, `prefijo`. |
| `files` | Colección auxiliar de archivos con `image`, `type` y `userId`. |
| `firmas` | Evidencias de firma asociadas por `numero_certificado`. |
| `inspections_busetas` | Colección histórica/legado del backend; el flujo Angular de busetas fue retirado para la entrega. |

Campos principales de `inspections`:

- Identificación: `id`, `numero_certificado`, `created`, `updated`.
- Conductor: `nombres_conductor`, `identificacion`, `telefono`, `whatsapp`, `licencia_conductor_numero`, `fecha_vencimiento_licencia`.
- Propietario: `propietario`, `documento_propietario`, `tipo_propietario`.
- Vehículo: `placa`, `marca`, `modelo`, `color`, `clase_vehiculo`, `codigo_vehiculo`, `capacidad_pasajeros`, `kilometraje`.
- Documentos: `soat`, `licencia_transito`, `revision_tecnomecanica`, `tarjeta_operacion`.
- Fechas: `fecha_inspeccion`, `fecha_vigencia`, `fecha_vencimiento_soat`, `fecha_vencimiento_revision_tecnomecanica`, `fecha_vencimiento_tarjeta_operacion`.
- Estado y publicación: `estado`, `status`, `observaciones`, `created_by`, `publicUrl`, `verificationCode`, `qrImage`.
- Checklist: sistema eléctrico, motor, carrocería, cabina, seguridad, kit de carretera, parte baja, frenos, dirección y llantas.
- Evidencia: `firma_conductor`, `firma_inspector`, `images`.

Los listados limitan campos con `INSPECTION_LIST_FIELDS` y eliminan firmas base64 para reducir peso en memoria, realtime y `localStorage`.

Valores select principales:

| Campo | Valores |
|---|---|
| Checklist técnico | `ok`, `negativo`, `na` |
| `estado` | `borrador`, `aprobada`, `rechazada` |
| `status` | `approved`, `rejected` |
| `tipo_propietario` | `empresa`, `persona` |
| `users.role` | `client`, `admin` |

## Endpoints Consumidos

La aplicación usa el SDK de PocketBase; las rutas siguientes son equivalentes REST de las operaciones:

| Servicio | Operación | Ruta |
|---|---|---|
| PocketBase | Login | `POST /api/collections/users/auth-with-password` |
| PocketBase | Crear usuario | `POST /api/collections/users/records` |
| PocketBase | Actualizar usuario | `PATCH /api/collections/users/records/{id}` |
| PocketBase | Reset password | `POST /api/collections/users/request-password-reset` |
| PocketBase | Confirmar reset | `POST /api/collections/users/confirm-password-reset` |
| PocketBase | Crear inspección | `POST /api/collections/inspections/records` |
| PocketBase | Listar inspecciones | `GET /api/collections/inspections/records` |
| PocketBase | Obtener inspección | `GET /api/collections/inspections/records/{id}` |
| PocketBase | Actualizar inspección | `PATCH /api/collections/inspections/records/{id}` |
| PocketBase | Eliminar inspección | `DELETE /api/collections/inspections/records/{id}` |
| PocketBase | Subir imagen | `POST /api/collections/images/records` |
| PocketBase | Leer archivo | `GET /api/files/{collectionId}/{recordId}/{filename}` |
| PocketBase | Realtime | `/api/realtime` |
| PocketBase | Secuencias | `/api/collections/secuencias/records` |
| Gotenberg | XLSX a PDF | `POST /forms/libreoffice/convert` |
| Gotenberg | HTML a PDF | `POST /forms/chromium/convert/html` |

## Configuración Actual

Actualmente no existen archivos `environment.ts`. Las URLs y credenciales están en servicios del frontend.

| Valor | Ubicación | Estado |
|---|---|---|
| PocketBase URL | `auth.service.ts`, `inspection.service.ts`, `inspections-realtime.ts` | Hardcodeado |
| Gotenberg URL | `gotenberg.service.ts` | Hardcodeado |
| Basic Auth Gotenberg | `gotenberg.service.ts`, `proxy.conf.json` | Debe retirarse del frontend |
| Collection ID de imágenes | `inspection.service.ts` | Hardcodeado |
| Credenciales de login demo | `login.ts` | Deben eliminarse antes de producción |

Recomendación para entrega productiva:

```ts
export const environment = {
  production: true,
  pocketbaseUrl: 'https://db.example.com',
  gotenbergUrl: 'https://pdf.example.com',
  imagesCollectionId: 'collection_id'
};
```

## PDF

Flujo principal:

1. `Detail.imprimirInspeccion()` valida que la inspección no esté en `borrador`.
2. Se recopilan datos del formulario, firmas e imágenes.
3. `ExcelExportService` carga `public/assets/templates/inspection.xlsx`.
4. ExcelJS procesa `FIRST_PAGE` y `SECOND_PAGE`.
5. Se insertan datos, checks, firmas e imágenes.
6. Se genera un XLSX en memoria.
7. `GotenbergService.convertXlsxToPdf()` envía el XLSX a Gotenberg.
8. Gotenberg devuelve un PDF.
9. `downloadBlob()` descarga el archivo.

Nombre de salida:

```text
Inspeccion_<placa>_<fecha>_CON_SECOND_PAGE.pdf
```

## Realtime Y Caché

`RealtimeInspectionsService` suscribe la colección `inspections` con `subscribe('*')`.

- Caché local: `localStorage`, clave `inspections_cache`.
- TTL: 5 minutos.
- Los datos cacheados se sanitizan para excluir firmas.
- La carga inicial prioriza inspecciones recientes y luego completa el historial en segundo plano.
- Crear, actualizar o eliminar inspecciones invalida la caché.

## Despliegue Frontend En AWS Amplify

Configuración sugerida:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist/verificar-app/browser
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

Configurar rewrite SPA:

```text
/<*> -> /index.html -> 200
```

Validar después del despliegue:

- Login.
- Navegación directa a `/home`, `/nueva`, `/detail/:id`.
- Carga de assets PWA.
- Conexión a PocketBase.
- Conversión PDF.

## Despliegue PocketBase En EC2

Recomendaciones mínimas:

- Usar PocketBase server `v0.19.0` para mantener compatibilidad con `docs/pb_schema.json`.
- Ejecutar PocketBase como servicio systemd.
- Servir detrás de HTTPS con Nginx, Caddy o balanceador.
- Persistir y respaldar `pb_data`.
- Importar o validar el schema desde `docs/pb_schema.json` antes de liberar.
- Exportar y versionar schema/reglas después de cada cambio operativo.
- Restringir CORS al dominio de la app.
- Validar permisos por colección y rol.

Servicio systemd de referencia:

```ini
[Unit]
Description=PocketBase
After=network.target

[Service]
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http=127.0.0.1:8090
Restart=always
User=pocketbase

[Install]
WantedBy=multi-user.target
```

## Despliegue Gotenberg En Dokploy

Imagen recomendada:

```text
gotenberg/gotenberg:8
```

Checklist:

- Dominio HTTPS propio para Gotenberg.
- Basic Auth o protección equivalente en proxy.
- Tamaño máximo de request suficiente para XLSX con imágenes.
- CORS restringido si el navegador llama directo.
- Preferible: backend intermedio para no exponer credenciales en Angular.

Compose base:

```yaml
services:
  gotenberg:
    image: gotenberg/gotenberg:8
    restart: unless-stopped
    ports:
      - "3000:3000"
```

## Seguridad Pendiente

Antes de producción:

- Rotar credenciales expuestas históricamente en el repositorio.
- Eliminar credenciales demo del login.
- Sacar Basic Auth de Gotenberg del frontend.
- Mover URLs y constantes a configuración por ambiente.
- Versionar reglas y schema de PocketBase.
- Restringir CORS a dominios conocidos.
- Mantener HTTPS en frontend, PocketBase y Gotenberg.
- Revisar assets demo en `public/assets` y eliminar lo no utilizado.
- Agregar control de acceso server-side; no confiar solo en rutas Angular.

## Troubleshooting

### Angular CLI exige Node nuevo

```text
The Angular CLI requires a minimum Node.js version of v20.19 or v22.12.
```

Solución:

```bash
nvm install 22
nvm use 22
npm ci
```

### Login falla

Revisar:

- URL de PocketBase.
- Usuario en colección `users`.
- Reglas de autenticación.
- Cookie `pb_auth`.
- HTTPS y CORS.

### Realtime no actualiza

Revisar:

- Sesión válida.
- Reglas de lectura sobre `inspections`.
- `/api/realtime`.
- Proxy o firewall.

### PDF no se genera

Revisar:

- Endpoint `/forms/libreoffice/convert`.
- Autenticación de Gotenberg.
- CORS.
- Plantilla `inspection.xlsx`.
- Hojas `FIRST_PAGE` y `SECOND_PAGE`.
- Tamaño de payload.

### Imágenes no aparecen en PDF

Revisar:

- Colección `images`.
- Campo archivo `image`.
- IDs guardados en `inspections.images`.
- Permisos de lectura de `/api/files`.
- CORS para descarga de imágenes.

### Rutas fallan al refrescar

Configurar fallback SPA en hosting:

```text
try_files $uri $uri/ /index.html
```

## Documentación Extendida

Abrir:

```text
docs/index.html
```

El archivo es autocontenido y puede abrirse directamente en el navegador. Incluye sidebar, tema claro/oscuro y detalle técnico operativo.
