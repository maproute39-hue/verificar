# VerificarIT

Aplicación web PWA para la gestión y control de inspecciones vehiculares. Permite registrar, consultar y hacer seguimiento de las inspecciones técnicas de vehículos de transporte, con alertas automáticas de vencimiento de vigencias y documentos críticos.

---

## ¿Qué hace la aplicación?

### Gestión de inspecciones
- Crear inspecciones vehiculares detalladas para busetas y camionetas.
- Registrar información del conductor (nombre, identificación, teléfono, foto, licencia).
- Registrar información del vehículo (placa, marca, modelo, color, clase, kilometraje, capacidad).
- Adjuntar documentos: SOAT, licencia de tránsito, revisión tecnomecánica, tarjeta de operación.
- Registrar el estado de más de 40 ítems de inspección: luces, frenos, carrocería, seguridad, kit de carretera, parte baja, entre otros.
- Capturar firma digital del conductor.
- Generar número de certificado secuencial por prefijo.
- Exportar inspecciones a Excel y PDF.

### Panel de inicio
- Muestra las **10 inspecciones más recientes** al instante al entrar.
- En segundo plano descarga el historial completo para tenerlo disponible sin bloquear la UI.
- Botón **"Ver todas"** que se activa al terminar la descarga en segundo plano; muestra todas las inspecciones con **paginación de 20 por página** directamente en la misma pantalla.
- **Alert de vencimientos** con conteo de inspecciones y documentos críticos vencidos o próximos a vencer. Al hacer clic filtra y muestra exclusivamente las inspecciones con problemas de vigencia.

### Alertas de vencimiento
Detecta y reporta problemas en cinco categorías:
- Vigencia de la inspección
- SOAT
- Revisión tecnomecánica
- Tarjeta de operación
- Licencia de conducción

Los documentos se clasifican visualmente con cuatro estados: **Vencido** (rojo), **Urgente — vence en ≤7 días** (amarillo), **Próximo — vence en 8–30 días** (azul), **Vigente** (verde).

### Búsqueda rápida
Búsqueda por placa con resultados en tiempo real. Desde el resultado se puede ir al detalle de la inspección o crear una nueva inspección heredando los datos del vehículo y conductor.

### Inspecciones heredadas
Permite crear una nueva inspección pre-cargada con los datos de una inspección anterior, útil para vehículos recurrentes.

### Actualizaciones en tiempo real
Usa **PocketBase Realtime** (WebSocket) para reflejar automáticamente cualquier creación, edición o eliminación hecha desde otro dispositivo sin necesidad de recargar la página.

### PWA
Instalable en dispositivos móviles y de escritorio. Funciona con soporte de Service Worker para caché y uso offline básico.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Angular 21 (standalone components) |
| Backend / BDD | PocketBase |
| Tiempo real | PocketBase WebSocket Subscriptions |
| UI | Bootstrap 5 + iconos Flaticon |
| Alertas | SweetAlert2 |
| Firma digital | @almothafar/angular-signature-pad |
| Exportación | ExcelJS, FileSaver, XLSX |
| Datepicker | Flatpickr |
| Galería | ngx-lightbox |
| Tests | Vitest |
| PWA | @angular/service-worker |

---

## Instalación y desarrollo

### Requisitos
- Node.js 20+
- npm 10+
- Angular CLI 21

### Instalar dependencias

```bash
npm install
```

### Servidor de desarrollo

```bash
npm start
```

La app queda disponible en `http://localhost:4200/`. Se recarga automáticamente al guardar cambios.

### Build de producción

```bash
npm run build
```

Los artefactos quedan en `dist/`. El build de producción aplica optimizaciones de rendimiento y tree-shaking.

### Ejecutar tests

```bash
ng test
```

---

## Estructura principal

```
src/app/
├── pages/
│   ├── home/          # Panel principal con listado de inspecciones
│   ├── nueva/         # Formulario de nueva inspección
│   ├── heredada/      # Inspección con datos heredados de una anterior
│   ├── detail/        # Detalle y edición de una inspección
│   ├── inspections/   # Listado completo de inspecciones
│   ├── busetas/       # Vista específica para busetas
│   └── login/         # Autenticación
├── services/
│   ├── inspections-realtime.ts   # Servicio principal: realtime, carga y CRUD
│   ├── inspection.service.ts     # Servicio HTTP/PocketBase para operaciones CRUD
│   └── shared.service.ts         # Estado compartido entre componentes
└── models/
    └── inspection.model.ts       # Interfaces Inspection, CreateInspectionDTO, UpdateInspectionDTO
```

---

## Variables de entorno / configuración

El backend apunta a `https://db.buckapi.site:8095`. Para cambiar la URL de PocketBase, edita la constante en:

- `src/app/services/inspections-realtime.ts`
- `src/app/services/inspection.service.ts`
