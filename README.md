# VerificarIT

VerificarIT es una aplicación web PWA construida con Angular para la gestión de inspecciones vehiculares. Permite crear inspecciones, capturar firmas digitales, adjuntar fotografías, consultar historiales por placa, validar vencimientos de documentos críticos y generar reportes PDF a partir de una plantilla Excel.

El backend principal detectado en el código es PocketBase. La generación de PDFs se realiza con Gotenberg mediante conversión de archivos XLSX generados en el navegador con ExcelJS.

> Estado de este documento: generado a partir del código fuente del repositorio. Las secciones marcadas como **Pendiente de configuración** no tienen suficiente información verificable en el código.

## Descripción General

La aplicación cubre el flujo operativo de inspecciones vehiculares para camionetas, busetas y vehículos de transporte:

- Autenticación de usuarios con PocketBase.
- Creación de inspecciones nuevas.
- Creación de inspecciones heredadas desde una inspección previa.
- Captura de firmas digitales de conductor e inspector.
- Captura y gestión de imágenes de inspección.
- Listado de inspecciones recientes y completas.
- Búsqueda por placa con historial y alertas de vigencia.
- Validación de documentos críticos: vigencia, SOAT, revisión tecnomecánica, tarjeta de operación y licencia.
- Detalle y edición de inspecciones.
- Generación de reportes Excel/PDF con imágenes y firmas.
- Soporte PWA mediante Angular Service Worker.

## Arquitectura de la Solución

```text
Usuario navegador/PWA
        |
        v
Angular 21 standalone app
        |
        |-- PocketBase SDK
        |     |-- Auth users
        |     |-- CRUD inspections
        |     |-- Realtime WebSocket
        |     |-- Files/images
        |     `-- Secuencias de certificados
        |
        |-- ExcelJS
        |     `-- Genera XLSX desde public/assets/templates/inspection.xlsx
        |
        `-- Gotenberg
              |-- /forms/libreoffice/convert para XLSX -> PDF
              `-- /forms/chromium/convert/html para HTML -> PDF
```

Componentes principales:

- `Home`: dashboard, estadísticas, búsqueda por placa, alertas y listado paginado.
- `Nueva`: formulario wizard para crear inspecciones.
- `Heredada`: crea una nueva inspección usando una inspección base.
- `Detail`: visualización, edición, imágenes, firmas y exportación a PDF.
- `Inspections`: listado general con búsqueda y eliminación.
- `Busetas`: flujo alterno para colección `inspections_busetas`.

Servicios principales:

- `AuthService`: autenticación con PocketBase (`users`).
- `RealtimeInspectionsService`: carga optimizada, cache local, realtime y CRUD de listados.
- `InspectionService`: CRUD general, imágenes, secuencias y detalle completo.
- `ExcelExportService`: generación de XLSX y PDFs.
- `GotenbergService`: cliente HTTP para Gotenberg.

## Tecnologías Utilizadas

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21, standalone components |
| Lenguaje | TypeScript 5.9 |
| PWA | `@angular/service-worker`, `ngsw-config.json`, `public/manifest.json` |
| Backend | PocketBase vía SDK JS `pocketbase@^0.26.6` |
| Realtime | PocketBase realtime subscriptions |
| Formularios | Angular Reactive Forms |
| Firmas | `@almothafar/angular-signature-pad` |
| Fechas | Flatpickr |
| Alertas/modales | SweetAlert2 |
| Excel | ExcelJS, xlsx |
| Descargas | file-saver |
| PDF | Gotenberg |
| Galería | ngx-lightbox |
| UI/assets | Bootstrap-like template assets, FontAwesome, Lucide, Flaticon |

## Requisitos Previos

Recomendado para Angular 21:

- Node.js `>= 20.19` o `>= 22.12`.
- npm `>= 10`.
- Angular CLI compatible con Angular 21.
- Servidor PocketBase accesible por HTTPS.
- Servicio Gotenberg accesible por HTTPS.
- Nginx o servidor HTTP equivalente para producción.

Verificar versiones:

```bash
node --version
npm --version
npx ng version
```

## Instalación Desde Cero

```bash
git clone <URL_DEL_REPOSITORIO>
cd appverificar
npm install
```

Ejecutar en desarrollo:

```bash
npm start
```

La aplicación queda disponible en:

```text
http://localhost:4200
```

Compilar para producción:

```bash
npm run build
```

Salida detectada:

```text
dist/verificar-app/browser
```

Verificación TypeScript:

```bash
npx tsc -p tsconfig.app.json --noEmit
```

## Configuración de Variables de Entorno

Actualmente el proyecto **no usa archivos `environment.ts` ni variables de entorno Angular**. Las URLs y credenciales están hardcodeadas en servicios.

Valores detectados:

| Configuración | Archivo | Valor detectado |
|---|---|---|
| PocketBase URL | `src/app/services/auth.service.ts` | `https://db.buckapi.site:8095` |
| PocketBase URL | `src/app/services/inspection.service.ts` | `https://db.buckapi.site:8095` |
| PocketBase URL | `src/app/services/inspections-realtime.ts` | `https://db.buckapi.site:8095` |
| PocketBase URL | `src/app/services/inspection_busetas.service.ts` | `https://db.buckapi.site:8095` |
| Gotenberg LibreOffice | `src/app/services/gotenberg.service.ts` | `https://gotenberg.buckapi.online/forms/libreoffice/convert` |
| Gotenberg Chromium | `src/app/services/gotenberg.service.ts` | `https://gotenberg.buckapi.online/forms/chromium/convert/html` |

**Pendiente de configuración:** migrar estas constantes a configuración por ambiente. Ejemplo recomendado:

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  pocketbaseUrl: 'https://db.example.com',
  gotenbergLibreOfficeUrl: 'https://gotenberg.example.com/forms/libreoffice/convert',
  gotenbergChromiumUrl: 'https://gotenberg.example.com/forms/chromium/convert/html',
};
```

**Importante de seguridad:** el código contiene credenciales hardcodeadas de Gotenberg y credenciales de prueba en login. Deben rotarse y eliminarse antes de producción.

## Configuración de PocketBase

### Versión Recomendada

**Pendiente de configuración.** El repositorio usa el SDK JavaScript `pocketbase@^0.26.6`, pero no incluye la versión del servidor PocketBase. Use una versión de servidor compatible con ese SDK y valide realtime/files/auth antes de producción.

### URL Base

Detectada en código:

```text
https://db.buckapi.site:8095
```

### Colecciones Requeridas

Inferidas desde el código:

| Colección | Uso |
|---|---|
| `users` | Autenticación, perfiles y roles. |
| `inspections` | Colección principal de inspecciones vehiculares. |
| `inspections_busetas` | Flujo alterno para busetas. |
| `images` | Archivos/fotos asociadas a inspecciones. |
| `secuencias` | Secuencias para números de certificado por prefijo. |

### Campos Mínimos Inferidos para `inspections`

El modelo contiene muchos campos de inspección. Campos críticos usados por listados, búsqueda y alertas:

```text
id
created
updated
numero_certificado
placa
telefono
whatsapp
nombres_conductor
identificacion
foto_conductor
fecha_inspeccion
fecha_vigencia
estado
fecha_vencimiento_soat
fecha_vencimiento_revision_tecnomecanica
fecha_vencimiento_tarjeta_operacion
licencia_vencimiento
fecha_vencimiento_licencia
clase_vehiculo
marca
modelo
color
codigo_vehiculo
firma_conductor
firma_inspector
images
```

Campos de detalle/formulario incluyen sistemas eléctricos, mecánicos, carrocería, cabina, seguridad, kit de carretera, parte baja, llantas, frenos y observaciones. Ver `src/app/models/inspection.model.ts`, `src/app/pages/nueva/nueva.ts` y `src/app/pages/detail/detail.ts`.

### Optimización de Listados

Los listados usan `fields` para no traer firmas base64:

```ts
fields: INSPECTION_LIST_FIELDS
```

Los campos `firma_conductor` y `firma_inspector` se limpian antes de insertar datos en el `BehaviorSubject` y cache local. El detalle se carga con `getOne(id)` sin `fields`, por lo que conserva firmas.

### Colección `images`

Uso detectado:

- Campo file: `image`.
- Los IDs de imágenes se guardan en `inspections.images`.
- El código usa el ID de colección `5bjt6wpqfj0rnsl` para construir URLs de archivos.

**Pendiente de configuración:** confirmar si `images` es relación múltiple, array de IDs o campo JSON en PocketBase.

### Colección `secuencias`

Uso detectado:

```ts
getFirstListItem(`prefijo="${prefix}"`)
update(secuencia.id, { ultimo_numero: nuevoNumero })
```

Campos inferidos:

```text
prefijo
ultimo_numero
```

Prefijos usados:

- `U` para inspecciones nuevas/heredadas.

### Reglas de Acceso

**Pendiente de configuración.** El repositorio no incluye export de reglas PocketBase.

Recomendación mínima:

- `users`: autenticación con email/usuario y contraseña.
- `inspections`: lectura/escritura solo para usuarios autenticados.
- `images`: lectura/escritura solo para usuarios autenticados.
- `secuencias`: lectura/escritura solo para usuarios autenticados o rol administrativo.
- Realtime habilitado para `inspections` si se requiere actualización en vivo.

Ejemplo conceptual:

```text
@request.auth.id != ""
```

Adapte reglas por rol (`role`) si se requiere separación entre administradores e inspectores.

## Configuración de Gotenberg

### Propósito

Gotenberg se usa para generar PDF desde archivos creados en el navegador:

1. Angular recopila datos de la inspección.
2. `ExcelExportService` carga `public/assets/templates/inspection.xlsx`.
3. ExcelJS escribe datos, imágenes y firmas en la plantilla.
4. Se genera un XLSX en memoria.
5. `GotenbergService` envía el XLSX a Gotenberg.
6. Gotenberg convierte el XLSX a PDF mediante LibreOffice.
7. El navegador descarga el PDF.

### Endpoints Detectados

```text
https://gotenberg.buckapi.online/forms/libreoffice/convert
https://gotenberg.buckapi.online/forms/chromium/convert/html
```

### Despliegue con Docker

Ejemplo básico:

```bash
docker run -d \
  --name gotenberg \
  --restart unless-stopped \
  -p 3000:3000 \
  gotenberg/gotenberg:8
```

Endpoint local:

```text
http://localhost:3000/forms/libreoffice/convert
```

Con Docker Compose:

```yaml
services:
  gotenberg:
    image: gotenberg/gotenberg:8
    restart: unless-stopped
    ports:
      - "3000:3000"
```

### Autenticación

El código actual envía Basic Auth desde `GotenbergService` y `proxy.conf.json`.

**Pendiente de configuración:** definir si el Gotenberg productivo debe estar detrás de Nginx/Traefik con Basic Auth, API gateway o red privada.

No deje credenciales en el bundle de Angular: cualquier valor dentro del frontend es visible para el usuario. Para producción, use un backend intermedio para firmar/autenticar la conversión.

### Proxy de Desarrollo

Existe `proxy.conf.json`:

```json
{
  "/gotenberg": {
    "target": "https://gotenberg.buckapi.online",
    "secure": false,
    "changeOrigin": true,
    "pathRewrite": { "^/gotenberg": "" }
  }
}
```

El código actual no usa `/gotenberg`; llama directamente a la URL HTTPS. Para usar el proxy:

```bash
npx ng serve --proxy-config proxy.conf.json
```

Y cambie el servicio a `/gotenberg/forms/libreoffice/convert`.

## Configuración de Firebase

No se detectó configuración Firebase, `firebaseConfig`, SDK Firebase ni archivos de ambiente relacionados.

**Estado:** no aplica actualmente.

## Dominios y CORS Detectados

Dominios externos detectados:

- `https://db.buckapi.site:8095` - PocketBase.
- `https://gotenberg.buckapi.online` - Gotenberg.
- `https://wa.me` - apertura de WhatsApp desde búsqueda/listados.
- `https://fonts.googleapis.com` y `https://fonts.gstatic.com` - fuentes en `index.html`.
- URLs de assets demo dentro de archivos estáticos del template en `public/assets`.

Requisitos CORS:

- PocketBase debe permitir el dominio donde se sirva Angular.
- Gotenberg o el proxy delante de Gotenberg debe permitir el origen del frontend si se llama directamente desde navegador.
- Las imágenes de PocketBase deben permitir `fetch` con CORS porque `ExcelExportService` descarga imágenes para incrustarlas en XLSX.

## Comandos de Desarrollo

Instalar:

```bash
npm install
```

Servidor local:

```bash
npm start
# equivalente:
npx ng serve
```

Servidor local con proxy de Gotenberg:

```bash
npx ng serve --proxy-config proxy.conf.json
```

Build producción:

```bash
npm run build
```

Build desarrollo:

```bash
npm run watch
```

Tests:

```bash
npm test
```

Validación TypeScript:

```bash
npx tsc -p tsconfig.app.json --noEmit
```

## Despliegue en Servidor Linux

Ejemplo con Ubuntu, Nginx y build estático.

### 1. Preparar servidor

```bash
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### 2. Descargar e instalar

```bash
sudo mkdir -p /var/www/verificar
sudo chown "$USER":"$USER" /var/www/verificar
git clone <URL_DEL_REPOSITORIO> /var/www/verificar/source
cd /var/www/verificar/source
npm ci
npm run build
```

### 3. Publicar build

```bash
sudo mkdir -p /var/www/verificar/html
sudo rsync -a --delete dist/verificar-app/browser/ /var/www/verificar/html/
```

### 4. Configurar Nginx

```nginx
server {
    listen 80;
    server_name appverificar.example.com;

    root /var/www/verificar/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
```

Activar:

```bash
sudo ln -s /etc/nginx/sites-available/verificar /etc/nginx/sites-enabled/verificar
sudo nginx -t
sudo systemctl reload nginx
```

### 5. HTTPS con Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d appverificar.example.com
```

### 6. Verificar PWA

Después de servir por HTTPS:

- Abrir DevTools > Application.
- Confirmar `manifest.json`.
- Confirmar service worker `ngsw-worker.js`.
- Probar recarga y navegación directa a `/home`, `/detail/:id`.

## Estructura de Carpetas

```text
.
├── angular.json
├── ngsw-config.json
├── proxy.conf.json
├── public/
│   ├── manifest.json
│   └── assets/
│       ├── templates/inspection.xlsx
│       ├── templates/resultado.pdf
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
│       │   ├── header/
│       │   ├── sidebar/
│       │   └── footer/
│       ├── guards/
│       ├── models/
│       ├── pages/
│       │   ├── login/
│       │   ├── home/
│       │   ├── nueva/
│       │   ├── heredada/
│       │   ├── detail/
│       │   ├── inspections/
│       │   └── busetas/
│       ├── services/
│       └── utils/
└── package.json
```

## Dependencias Críticas y Función

| Dependencia | Función |
|---|---|
| `@angular/*` | Framework SPA/PWA. |
| `pocketbase` | Auth, CRUD, realtime y archivos. |
| `@almothafar/angular-signature-pad` | Captura de firmas digitales en canvas. |
| `exceljs` | Lectura/escritura de plantilla XLSX. |
| `file-saver` | Descarga de archivos generados. |
| `sweetalert2` | Modales y confirmaciones. |
| `flatpickr` | Selectores de fecha. |
| `ngx-lightbox` | Galería de imágenes en detalle. |
| `ngx-mask` | Máscaras de entrada. |
| `rxjs` | Observables y flujos async. |
| `xlsx` | Utilidades Excel adicionales. |

## Flujo Funcional de la Aplicación

1. Usuario ingresa por `/login`.
2. `AuthService` autentica contra `users` en PocketBase.
3. Usuario navega a `/home`.
4. `Home` carga inspecciones recientes y luego historial completo con cache.
5. PocketBase realtime actualiza la lista al crear/editar/eliminar.
6. Desde Home puede:
   - buscar por placa,
   - ver detalle,
   - crear inspección heredada,
   - revisar alertas de vencimientos.
7. En `/nueva` se crea una inspección con datos, firmas e imágenes.
8. En `/detail/:id` se carga el registro completo, incluyendo firmas.
9. En detalle se pueden editar datos, gestionar imágenes y exportar PDF.
10. Para PDF, ExcelJS genera XLSX y Gotenberg lo convierte a PDF.

## Proceso de Generación de PDFs

Archivo base:

```text
public/assets/templates/inspection.xlsx
```

Flujo técnico:

1. `Detail` valida que la inspección no esté en estado borrador.
2. Se recopilan datos del formulario, firmas e imágenes.
3. `ExcelExportService.generarXlsxConductorConImagenes()`:
   - carga la plantilla Excel,
   - procesa hoja `FIRST_PAGE`,
   - procesa hoja `SECOND_PAGE`,
   - inserta firmas,
   - descarga/inserta hasta 3 imágenes.
4. `GotenbergService.convertXlsxToPdf()` envía el XLSX a:

```text
/forms/libreoffice/convert
```

5. Gotenberg devuelve un PDF.
6. `downloadBlob()` descarga:

```text
Inspeccion_<placa>_<fecha>.pdf
```

## Integraciones Externas Detectadas

- PocketBase: backend, realtime, auth, archivos.
- Gotenberg: conversión XLSX/HTML a PDF.
- WhatsApp: links `wa.me`.
- Google Fonts.
- Plantilla UI con assets locales de FontAwesome, Lucide, Flaticon, ApexCharts, DataTables, Leaflet y otros. No todos están necesariamente usados por los componentes actuales.

## Solución de Problemas Comunes

### Angular CLI exige Node más nuevo

Síntoma:

```text
The Angular CLI requires a minimum Node.js version of v20.19 or v22.12.
```

Solución:

```bash
nvm install 22
nvm use 22
npm ci
```

### Error CORS con PocketBase

Síntoma: login/listados fallan desde dominio productivo.

Revisar:

- Dominio permitido en PocketBase.
- HTTPS válido.
- Reglas de colección.
- Token/cookie de sesión.

### Error CORS con Gotenberg

Soluciones:

- Configurar CORS en proxy/Nginx/Traefik.
- Usar `proxy.conf.json` en desarrollo.
- En producción, preferir un backend intermedio para no exponer credenciales.

### PDF no se genera

Revisar:

- Gotenberg activo.
- Endpoint `/forms/libreoffice/convert`.
- Basic Auth si aplica.
- Plantilla `public/assets/templates/inspection.xlsx`.
- Hoja `FIRST_PAGE` y `SECOND_PAGE`.
- CORS de imágenes.

### Imágenes no aparecen en PDF

Revisar:

- Colección `images`.
- Campo file `image`.
- IDs guardados en `inspections.images`.
- Permisos de lectura de archivos en PocketBase.
- CORS para `fetch(imageUrl, { mode: 'cors' })`.

### Realtime no actualiza

Revisar:

- Usuario autenticado.
- Reglas realtime/lectura de `inspections`.
- WebSocket permitido por proxy/firewall.
- URL PocketBase correcta.

### Service Worker no actualiza cambios

Soluciones:

```bash
npm run build
sudo rsync -a --delete dist/verificar-app/browser/ /var/www/verificar/html/
```

Luego limpiar cache del navegador o esperar actualización de `ngsw`.

## Consideraciones de Seguridad

Puntos detectados que deben corregirse antes de producción:

- Hay credenciales hardcodeadas en código frontend para Gotenberg. Todo secreto dentro de Angular es visible en el navegador.
- Hay credenciales de prueba prellenadas en `login.ts`. Deben eliminarse.
- Existe un archivo con nombre tipo comando curl bajo `src/app/pages/nueva/` que contiene credenciales. Debe eliminarse y rotar credenciales.
- `AuthService` exporta cookie con `httpOnly: false`; esto es normal desde frontend pero aumenta exposición ante XSS.
- Las reglas PocketBase no están versionadas en el repo. Exportarlas y documentarlas.
- Mover URLs y credenciales a configuración segura.
- Usar HTTPS en frontend, PocketBase y Gotenberg.
- Restringir CORS a dominios conocidos.
- Proteger Gotenberg detrás de backend/proxy privado, no exponer Basic Auth al cliente.
- Limitar payload de listados con `fields`; esto ya está implementado para evitar firmas base64 en listados.

## Mantenimiento

Tareas recomendadas:

- Crear archivos de ambiente (`environment.ts`, `environment.prod.ts`) y retirar hardcoding.
- Versionar schema y reglas de PocketBase.
- Automatizar despliegue con CI/CD.
- Agregar tests unitarios para servicios críticos.
- Revisar y eliminar archivos `.bak`, backups y assets demo no usados.
- Rotar credenciales expuestas.
- Auditar dependencias y assets de terceros.

## Créditos

Proyecto: VerificarIT.

Mantenimiento: **Pendiente de configuración**.

Responsables técnicos, contactos operativos, dominio definitivo, repositorio remoto y procedimiento de soporte deben completarse antes de producción.
