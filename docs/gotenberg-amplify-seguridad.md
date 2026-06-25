# Seguridad de Gotenberg en AWS Amplify

Este documento explica cómo configurar Gotenberg sin guardar credenciales en el repositorio ni exponerlas en el frontend Angular.

## Problema

La aplicación Angular corre en el navegador. Cualquier valor incluido en:

- `src/environments/*`
- `public/config/app-config.js`
- variables de entorno usadas para generar archivos durante el build
- código TypeScript compilado

puede terminar visible en los artefactos publicados o en el navegador del usuario.

Por eso, las credenciales de Gotenberg no deben vivir en Angular. Esto incluye usuario, contraseña, tokens, headers `Authorization` y cualquier secreto equivalente.

## Qué Puede Ir En El Frontend

Estos valores pueden ser públicos:

| Valor | Puede estar en Angular | Motivo |
|---|---:|---|
| URL pública de PocketBase | Sí | Es necesaria para conectar el cliente. |
| URL de un proxy propio para PDF | Sí | No contiene secretos. |
| ID de colección de imágenes | Sí | Es configuración técnica, no autenticación. |
| Usuario de Gotenberg | No | Es parte de la autenticación. |
| Contraseña de Gotenberg | No | Es un secreto. |
| Header Basic Auth | No | Permite usar el servicio directamente. |

## Arquitectura Recomendada

La aplicación no debe llamar directamente a Gotenberg con Basic Auth. Debe llamar a un backend/proxy controlado por el proyecto.

```text
Angular en Amplify Hosting
  |
  |-- POST /api/pdf/convert
      |
      |-- Backend / Lambda / proxy
          |-- Lee secretos desde Amplify Secrets, SSM Parameter Store o Secret Manager
          |-- Agrega Authorization: Basic ...
          |-- Envía XLSX a Gotenberg
          `-- Devuelve el PDF al navegador
```

Con este patrón, el navegador solo conoce el endpoint del proxy. Las credenciales reales nunca viajan al cliente.

## Variables Y Secretos

### Variables públicas

Usarlas para configuración no sensible:

```text
POCKETBASE_URL=https://db.example.com
PDF_PROXY_URL=/api/pdf/convert
IMAGES_COLLECTION_ID=collection_id
```

Estas pueden alimentar `public/config/app-config.js` durante el despliegue.

### Secretos

Usarlos solo en el backend/proxy:

```text
GOTENBERG_BASE_URL=https://pdf.example.com
GOTENBERG_USERNAME=...
GOTENBERG_PASSWORD=...
```

No deben escribirse en archivos servidos por Angular.

## Amplify: Dónde Configurarlo

AWS Amplify separa dos conceptos:

- Environment variables: configuración disponible para builds y entornos.
- Secrets: valores sensibles gestionados fuera del código.

Para frontend estático, una variable de entorno usada por Angular no es un lugar seguro para una contraseña, porque el valor puede quedar incluido en el build. AWS también recomienda no usar environment variables para secretos en aplicaciones frontend.

Referencias oficiales:

- https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html
- https://docs.aws.amazon.com/amplify/latest/userguide/environment-secrets.html
- https://docs.amplify.aws/react/deploy-and-host/fullstack-branching/secrets-and-vars/

## Opción Recomendada En Amplify

Crear una función/backend que actúe como proxy de conversión PDF.

Flujo:

1. Angular genera el XLSX.
2. Angular envía el archivo a `/api/pdf/convert`.
3. La función lee `GOTENBERG_BASE_URL`, `GOTENBERG_USERNAME` y `GOTENBERG_PASSWORD` desde secretos.
4. La función construye el header Basic Auth.
5. La función llama a Gotenberg.
6. La función devuelve el PDF al navegador.

## Ejemplo De Backend Proxy

Ejemplo conceptual en Node.js:

```js
export async function handler(event) {
  const gotenbergUrl = process.env.GOTENBERG_BASE_URL;
  const username = process.env.GOTENBERG_USERNAME;
  const password = process.env.GOTENBERG_PASSWORD;

  if (!gotenbergUrl || !username || !password) {
    return {
      statusCode: 500,
      body: 'PDF service is not configured',
    };
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  // Recibir el XLSX del request, reenviarlo a Gotenberg y devolver el PDF.
  // La implementación exacta depende de API Gateway, Lambda runtime y formato multipart.
  const response = await fetch(`${gotenbergUrl}/forms/libreoffice/convert`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/pdf',
    },
    body: event.body,
  });

  const pdf = await response.arrayBuffer();

  return {
    statusCode: response.status,
    headers: {
      'Content-Type': 'application/pdf',
    },
    body: Buffer.from(pdf).toString('base64'),
    isBase64Encoded: true,
  };
}
```

Este ejemplo muestra la responsabilidad del backend. En producción se debe ajustar el manejo de `multipart/form-data`, límites de tamaño, errores, CORS y autenticación del endpoint propio.

## Cambios Necesarios En Angular

Actualmente, el frontend no debería construir este header:

```ts
const authHeader = 'Basic ' + btoa(`${username}:${password}`);
```

El servicio debería enviar el XLSX al proxy:

```ts
convertXlsxToPdf(xlsxFile: Blob): Observable<Blob> {
  const formData = new FormData();
  formData.append('files', xlsxFile, 'inspeccion.xlsx');

  return this.http.post(`${this.pdfProxyUrl}`, formData, {
    responseType: 'blob',
  });
}
```

La configuración pública de Angular quedaría así:

```js
window.__APP_CONFIG__ = {
  pocketbaseUrl: 'https://db.example.com',
  pdfProxyUrl: '/api/pdf/convert',
  imagesCollectionId: 'collection_id'
};
```

## Qué No Hacer

No hacer esto:

```ts
environment.gotenbergUsername = '...';
environment.gotenbergPassword = '...';
```

No generar durante el build un archivo público con secretos:

```bash
echo "GOTENBERG_PASSWORD=$GOTENBERG_PASSWORD" >> public/config/app-config.js
```

No confiar en que una variable de entorno de Amplify queda oculta si Angular la usa para compilar. Si el frontend la necesita en runtime, no es secreta.

## Checklist De Producción

- Quitar `gotenbergUsername` y `gotenbergPassword` de `src/environments/*`.
- Quitar cualquier construcción de `Authorization: Basic` del frontend.
- Crear un endpoint backend/proxy para conversión PDF.
- Guardar credenciales de Gotenberg como secretos del backend.
- Restringir CORS del proxy al dominio de la app.
- Definir límite de tamaño suficiente para XLSX con imágenes.
- Registrar errores del proxy sin imprimir secretos.
- Rotar credenciales que hayan estado en el repositorio.
- Confirmar que el build final no contiene usuario, contraseña ni Basic Auth.

## Resumen

En Amplify, las variables de entorno del frontend sirven para configuración pública, no para contraseñas. Para Gotenberg, la solución correcta es mover la autenticación a un backend/proxy y guardar las credenciales como secretos allí. Angular solo debe conocer la URL pública del proxy.
