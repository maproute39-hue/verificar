<p align="center">
  <img src="docs/logo.svg" alt="VerificarIT" width="92">
</p>

<h1 align="center">VerificarIT</h1>

<p align="center">
  <strong>PWA Angular para gestionar inspecciones vehiculares, evidencias, vencimientos y reportes PDF.</strong>
</p>

<p align="center">
  <img alt="Angular 21" src="https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white">
  <img alt="TypeScript 5.9" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white">
  <img alt="PocketBase" src="https://img.shields.io/badge/Backend-PocketBase-B8DBE4">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white">
</p>

<p align="center">
  <a href="https://maproute39-hue.github.io/verificar/" target="_blank">Documentación técnica</a>
  ·
  <a href="https://github.com/maproute39-hue/verificar/blob/main/docs/pb_schema.json" target="_blank">Schema PocketBase</a>
  ·
  <a href="https://github.com/maproute39-hue/verificar">Repositorio</a>
</p>

## Descripción

VerificarIT es un frontend Angular/PWA para la gestión de inspecciones vehiculares. Permite autenticar usuarios, crear inspecciones, consultar historial por placa, registrar firmas y fotografías, controlar vencimientos documentales y generar reportes PDF desde una plantilla Excel.

La aplicación se ejecuta como frontend estático y consume servicios externos:

- PocketBase para autenticación, datos, archivos y realtime.
- Gotenberg para conversión de reportes XLSX/HTML a PDF.
- Configuración runtime mediante `public/config/app-config.js`.

## Funcionalidades

- Login con PocketBase.
- Dashboard con métricas, inspecciones recientes, búsqueda por placa y alertas.
- Creación de inspecciones nuevas o heredadas desde una inspección base.
- Edición, detalle y eliminación de inspecciones.
- Captura de firmas de conductor e inspector.
- Carga y consulta de fotografías de evidencia.
- Estados de inspección: `borrador`, `aprobada`, `rechazada`.
- Alertas de vencimiento para SOAT, tecnomecánica, licencia, tarjeta de operación y vigencia.
- Generación de PDF con datos, firmas e imágenes.
- Soporte PWA con manifest y service worker de Angular.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Angular 21, standalone components |
| Lenguaje | TypeScript 5.9 |
| PWA | `@angular/service-worker`, `ngsw-config.json`, `public/manifest.json` |
| Datos/Auth | PocketBase |
| Realtime | PocketBase realtime subscriptions |
| Formularios | Angular Forms / Reactive Forms |
| Firmas | `@almothafar/angular-signature-pad` |
| Reportes | ExcelJS, xlsx, file-saver, Gotenberg |
| UI | Assets locales en `public/assets` |

## Requisitos

- Node.js `>=20.19` o `>=22.12`.
- npm `>=10`.
- PocketBase accesible por HTTPS.
- Gotenberg o un proxy de conversión PDF accesible por HTTPS.

## Instalación

```bash
npm ci
```

## Configuración

La app lee configuración runtime desde `public/config/app-config.js` y usa `src/environments/*` como fallback.

```js
window.__APP_CONFIG__ = {
  pocketbaseUrl: 'https://db.example.com',
  gotenbergBaseUrl: 'https://pdf.example.com',
  imagesCollectionId: 'collection_id'
};
```

No incluir secretos en el bundle Angular. Si Gotenberg requiere autenticación, debe resolverse desde un proxy/backend o desde la infraestructura de despliegue.

## Comandos

```bash
npm start
```

Levanta el servidor de desarrollo en:

```text
http://localhost:4200
```

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run build
```

El build productivo queda en:

```text
dist/verificar-app/browser
```

## Estructura

```text
.
├── docs/
│   ├── index.html
│   └── pb_schema.json
├── public/
│   ├── config/app-config.js
│   ├── manifest.json
│   └── assets/
│       └── templates/
│           ├── inspection.xlsx
│           └── resultado.pdf
├── src/
│   ├── environments/
│   └── app/
│       ├── components/
│       ├── config/
│       ├── models/
│       ├── pages/
│       ├── services/
│       ├── app.config.ts
│       └── app.routes.ts
├── angular.json
├── ngsw-config.json
├── package.json
└── tsconfig*.json
```

## Rutas

| Ruta | Propósito |
|---|---|
| `/login` | Autenticación de usuario. |
| `/home` | Dashboard, métricas, búsqueda, alertas e historial. |
| `/nueva` | Creación de inspección. |
| `/heredada` | Creación de inspección desde una base existente. |
| `/inspections` | Listado general con búsqueda y eliminación. |
| `/detail/:id` | Detalle, edición, evidencias, firmas y PDF. |

## Servicios Principales

| Servicio | Responsabilidad |
|---|---|
| `AuthService` | Login, logout, usuario actual y recuperación de contraseña. |
| `InspectionService` | CRUD de inspecciones, imágenes, secuencias y URLs de archivos. |
| `RealtimeInspectionsService` | Suscripciones realtime, caché local y carga progresiva. |
| `ExcelExportService` | Generación de XLSX y PDF desde plantilla. |
| `GotenbergService` | Conversión XLSX/HTML a PDF y descarga de blobs. |
| `PwaInstallService` | Instalación PWA desde `beforeinstallprompt`. |

## Modelo De Datos

El esquema de PocketBase está versionado en `docs/pb_schema.json`. Las colecciones principales son:

| Colección | Uso |
|---|---|
| `users` | Autenticación y perfil de usuario. |
| `inspections` | Registro principal de inspecciones vehiculares. |
| `images` | Evidencias fotográficas asociadas a inspecciones. |
| `secuencias` | Consecutivos por tipo y prefijo. |
| `files` | Archivos auxiliares. |
| `firmas` | Evidencias de firma por certificado. |

## Documentación

La documentación técnica extendida está en:

```text
docs/index.html
```

El schema importable/exportable de PocketBase está en:

```text
docs/pb_schema.json
```

## Despliegue

Para hosting estático, publicar el contenido de:

```text
dist/verificar-app/browser
```

El servidor debe redirigir las rutas SPA a `index.html`, por ejemplo:

```text
/<*> -> /index.html -> 200
```

Antes de producción, validar HTTPS, CORS, reglas de PocketBase, variables de ambiente y manejo seguro de credenciales fuera del frontend.
