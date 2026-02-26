import { Injectable  } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { GotenbergService } from './gotenberg.service';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor

    (private gotenbergService: GotenbergService
    ) { }

  /**
   * Exporta datos del conductor a Excel PRESERVANDO 100% de los estilos originales
   * Acepta un objeto con los campos: nombre_transportadora, nombres_conductor, telefono_conductor
   * 
   * @param formData - Objeto con los datos del conductor
   * 
   */
  async exportarDatosConductor(formData: {
    nombre_transportadora?: string;
    nombres_conductor?: string;
    telefono_conductor?: string;
    fecha_inspeccion?: string;
    fecha_vigencia?: string;
    placa?: string;
    marca?: string;
    modelo?: string;
    color?: string;
    codigo_vehiculo?: string;
    fecha_vencimiento_licencia?: string;
    fecha_vencimiento_soat?: string;
    fecha_vencimiento_revision_tecnomecanica?: string;
    fecha_vencimiento_tarjeta_operacion?: string;
    estado?: string;
    kilometraje?: number;
    capacidad_pasajeros?: number;
    llanta_di?: number;
    llanta_dd?: number;
    llanta_tie?: number;
    llanta_tde?: number;
    llanta_tli?: number;
    llanta_tlii?: number;
    llanta_tlid?: number;
    llanta_t_lie?: number;
    llanta_t_lii?: number;
    llanta_t_lid?: number;
  }): Promise<void> {
    try {
      console.log('🔍 Iniciando exportación con exceljs...');

      // 1. Cargar la plantilla Excel
      const templateFile = await this.loadTemplateFromAssets();
      const arrayBuffer = await templateFile.arrayBuffer();

      // 2. Crear workbook y cargar plantilla
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      console.log('✅ Workbook cargado');
      console.log('📋 Hojas disponibles:',
        workbook.worksheets.map(ws => ws.name));

      // ✅ Obtener la hoja POR NOMBRE
      const worksheet = workbook.getWorksheet('FIRST_PAGE');

      if (!worksheet) {
        // Intentar fallback por índice si falla el nombre
        console.warn('⚠️ Hoja "FIRST_PAGE" no encontrada por nombre, intentando por índice...');
        const fallbackSheet = workbook.getWorksheet('FIRST_PAGE'); // Segunda hoja (índice 2 en ExcelJS)
        if (!fallbackSheet) {
          throw new Error('No se encontró la hoja "FIRST_PAGE" ni la hoja 2 en el archivo Excel');
        }
        this.procesarHoja(fallbackSheet, formData);
      } else {
        // ✅ Procesar la hoja con los datos
        this.procesarHoja(worksheet, formData);
      }

      // 6. Generar y descargar el archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const filename = `Inspeccion_${this.getCurrentDate()}.xlsx`;
      saveAs(blob, filename);

      console.log('✅ Archivo exportado exitosamente con TODOS los estilos preservados');

    } catch (error) {
      console.error('❌ Error al exportar:', error);
      throw new Error(`Error al generar el archivo Excel: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * ✨ Genera XLSX con imágenes embebidas
   */
  async generarXlsxConductorConImagenes(
    formData: any,
    imageUrls: string[] = []
  ): Promise<Blob> {
    try {
      console.log(`🔍 Generando XLSX con datos + ${imageUrls.length} imágenes...`);

      const templateFile = await this.loadTemplateFromAssets();
      const arrayBuffer = await templateFile.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // ✅ 1. PROCESAR HOJA "FIRST_PAGE" CON LOS DATOS DEL FORMULARIO
      const worksheetCamioneta = workbook.getWorksheet('FIRST_PAGE');
      if (!worksheetCamioneta) {
        throw new Error('No se encontró la hoja "FIRST_PAGE" en la plantilla');
      }
      console.log('✅ Procesando hoja "FIRST_PAGE" con datos del formulario...');
      this.procesarHoja(worksheetCamioneta, formData);

      // ✅ 2. PROCESAR HOJA "SECOND_PAGE" CON LAS FOTOS
      const worksheetImagenes = workbook.getWorksheet('SECOND_PAGE');
      if (!worksheetImagenes) {
        throw new Error('No se encontró la hoja "SECOND_PAGE" en la plantilla');
      }
      // console.log('✅ Procesando hoja "SECOND_PAGE" con fotografías...');
      // ✅ AGREGAR ESTO: Procesar datos de la hoja SECOND_PAGE (estado de aprobación)
      console.log('✅ Procesando hoja "SECOND_PAGE" con datos del formulario...');
      this.procesarHoja(worksheetImagenes, formData);  // ← ← ← ¡AGREGAR ESTA LÍNEA!

      console.log('✅ Procesando hoja "SECOND_PAGE" con fotografías...');

      if (imageUrls && imageUrls.length > 0) {
        await this.insertarTresImagenesPosicionesFijas(worksheetImagenes, imageUrls, workbook);
      } else {
        console.warn('⚠️ No hay imágenes para insertar');
      }

      // ✅ 3. Generar buffer final con AMBAS hojas procesadas
      const buffer = await workbook.xlsx.writeBuffer();
      console.log('✅ XLSX generado exitosamente con datos e imágenes');

      return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

    } catch (error) {
      console.error('❌ Error al generar XLSX con imágenes:', error);
      throw error;
    }
  }
  /**
   * ✨ Inserta EXACTAMENTE 3 imágenes en posiciones fijas:
   * - Imagen 1: D6:L8
   * - Imagen 2: N6:AA8
   * - Imagen 3: D10:L17
   * 
   * SIN modificar la estructura ni formato de la hoja
   */
  private async insertarTresImagenesPosicionesFijas(
    worksheet: ExcelJS.Worksheet,
    imageUrls: string[],
    workbook: ExcelJS.Workbook
  ): Promise<void> {

    console.log(`🖼️ Insertando ${Math.min(imageUrls.length, 3)} imágenes en posiciones fijas...`);

    // ✅ Definir las 3 posiciones exactas (rangos de celdas)
    const posiciones = [
      { rango: 'D18:L20', descripcion: 'Imagen 1 - Vista frontal/lateral' },
      { rango: 'N18:AA20', descripcion: 'Imagen 2 - Vista lateral/posterior' },
      { rango: 'D22:L29', descripcion: 'Imagen 3 - Motor/detalle' }
    ];

    // ✅ Insertar cada imagen en su posición
    for (let index = 0; index < Math.min(imageUrls.length, 3); index++) {
      const imageUrl = imageUrls[index];

      if (!imageUrl?.trim()) {
        console.warn(`⚠️ Imagen ${index + 1}: URL vacía`);
        continue;
      }

      const posicion = posiciones[index];
      console.log(`📥 Procesando ${posicion.descripcion}: ${imageUrl}`);

      try {
        // 1. Descargar imagen
        const imageData = await this.fetchImageAsBuffer(imageUrl);

        if (!imageData?.buffer) {
          console.error(`❌ ${posicion.descripcion}: No se obtuvo buffer`);
          continue;
        }

        console.log(`✅ ${posicion.descripcion} descargada (${imageData.buffer.byteLength} bytes)`);

        // 2. Agregar imagen al workbook
        const imageId = workbook.addImage({
          buffer: imageData.buffer,
          extension: 'jpeg'
        });

        // 3. ✅ Insertar imagen en el RANGO EXACTO de celdas
        // Esto preserva el formato y ajusta la imagen al rango
        worksheet.addImage(imageId, posicion.rango);

        console.log(`✅ ${posicion.descripcion} insertada en ${posicion.rango}`);

      } catch (error) {
        console.error(`❌ Error insertando ${posicion.descripcion}:`, error);
        // Continuar con la siguiente imagen
      }
    }

    console.log('✅ Proceso de inserción de imágenes completado');
  }

  /**
   * ✨ Descarga imagen y la convierte a ArrayBuffer
   */
  private async fetchImageAsBuffer(imageUrl: string): Promise<{ buffer: ArrayBuffer, extension: string }> {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const arrayBuffer = await response.arrayBuffer();

      // Detectar extensión del contenido
      let extension = 'jpeg';
      const contentType = response.headers.get('content-type')?.toLowerCase() || '';
      const urlLower = imageUrl.toLowerCase();

      if (urlLower.endsWith('.png') || contentType.includes('image/png')) {
        extension = 'png';
      } else if (urlLower.endsWith('.gif') || contentType.includes('image/gif')) {
        extension = 'gif';
      } else if (urlLower.endsWith('.bmp') || contentType.includes('image/bmp')) {
        extension = 'bmp';
      }

      return { buffer: arrayBuffer, extension };

    } catch (error) {
      console.error('❌ Error al descargar imagen:', imageUrl, error);
      throw error;
    }
  }

  /**
   * ✨ Exporta PDF CON imágenes (flujo híbrido: Excel → LibreOffice)
   */
  async exportarDatosConductorComoPdfConImagenes(
    formData: any,
    imageUrls: string[] = []
  ): Promise<void> {
    try {
      if (!this.gotenbergService) {
        throw new Error('GotenbergService no está disponible');
      }

      console.log(`🔍 Generando PDF con ${imageUrls.length} imágenes...`);

      // 1. Generar XLSX con imágenes embebidas
      const xlsxBlob = await this.generarXlsxConductorConImagenes(formData, imageUrls);

      // 2. Enviar a Gotenberg (LibreOffice) ← TU FLUJO ACTUAL
      const pdfBlob = await this.gotenbergService.convertXlsxToPdf(xlsxBlob).toPromise();

      // 3. Descargar
      const placa = formData.placa?.replace(/\s+/g, '_') || 'inspeccion';
      const fecha = this.getCurrentDate();
      this.gotenbergService.downloadBlob(
        pdfBlob!,
        `Inspeccion_${placa}_${fecha}_CON_SECOND_PAGE.pdf`
      );

      console.log('✅ PDF con imágenes generado');

    } catch (error) {
      console.error('❌ Error al generar PDF con imágenes:', error);
      throw new Error(`Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * ✨ NUEVO: Genera el XLSX como Blob (sin descargar)
   * Este método es usado para enviar el archivo a Gotenberg
   */
  async generarXlsxConductor(formData: {
    nombre_transportadora?: string;
    nombres_conductor?: string;
    telefono_conductor?: string;
    fecha_inspeccion?: string;
    fecha_vigencia?: string;
    placa?: string;
    marca?: string;
    modelo?: string;
    color?: string;
    codigo_vehiculo?: string;
    fecha_vencimiento_licencia?: string;
    fecha_vencimiento_soat?: string;
    fecha_vencimiento_revision_tecnomecanica?: string;
    fecha_vencimiento_tarjeta_operacion?: string;
    estado?: string;
    kilometraje?: number;
    capacidad_pasajeros?: number;
    llanta_di?: number;
    llanta_dd?: number;
    llanta_tie?: number;
    llanta_tde?: number;
    llanta_tli?: number;
    llanta_tlii?: number;
    llanta_tlid?: number;
    llanta_t_lie?: number;
    llanta_t_lii?: number;
    llanta_t_lid?: number;
  }): Promise<Blob> {
    try {
      console.log('🔍 Generando XLSX en memoria...');

      // 1. Cargar la plantilla Excel
      const templateFile = await this.loadTemplateFromAssets();
      const arrayBuffer = await templateFile.arrayBuffer();

      // 2. Crear workbook y cargar plantilla
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // ✅ Obtener la hoja POR NOMBRE
      const worksheet = workbook.getWorksheet('FIRST_PAGE');

      if (!worksheet) {
        console.warn('⚠️ Hoja "FIRST_PAGE" no encontrada por nombre, intentando por índice...');
        const fallbackSheet = workbook.getWorksheet(1);
        if (!fallbackSheet) {
          throw new Error('No se encontró la hoja "FIRST_PAGE" ni la hoja 2 en el archivo Excel');
        }
        this.procesarHoja(fallbackSheet, formData);
      } else {
        this.procesarHoja(worksheet, formData);
      }

      // 3. Generar el buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // 4. Devolver como Blob
      return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

    } catch (error) {
      console.error('❌ Error al generar XLSX:', error);
      throw new Error(`Error al generar el archivo Excel: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * ✨ NUEVO: Exporta datos del conductor como PDF usando Gotenberg
   * Genera el XLSX con estilos y lo convierte a PDF automáticamente
   */
  async exportarDatosConductorComoPdf(formData: {
    nombre_transportadora?: string;
    nombres_conductor?: string;
    telefono_conductor?: string;
    fecha_inspeccion?: string;
    fecha_vigencia?: string;
    placa?: string;
    marca?: string;
    modelo?: string;
    color?: string;
    codigo_vehiculo?: string;
    fecha_vencimiento_licencia?: string;
    fecha_vencimiento_soat?: string;
    fecha_vencimiento_revision_tecnomecanica?: string;
    fecha_vencimiento_tarjeta_operacion?: string;
    estado?: string;
    kilometraje?: number;
    capacidad_pasajeros?: number;
    llanta_di?: number;
    llanta_dd?: number;
    llanta_tie?: number;
    llanta_tde?: number;
    llanta_tli?: number;
    llanta_tlii?: number;
    llanta_tlid?: number;
    llanta_t_lie?: number;
    llanta_t_lii?: number;
    llanta_t_lid?: number;
  }): Promise<void> {
    try {
      // 1. Validar que GotenbergService esté inyectado
      if (!this.gotenbergService) {
        throw new Error('GotenbergService no está disponible. Por favor, inyecta el servicio en el constructor.');
      }

      console.log('🔍 Generando PDF con Gotenberg...');

      // 2. Generar XLSX en memoria
      const xlsxBlob = await this.generarXlsxConductor(formData);

      // 3. Enviar a Gotenberg y obtener PDF
      const pdfBlob = await this.gotenbergService.convertXlsxToPdf(xlsxBlob).toPromise();

      // 4. Descargar el PDF
      const placa = formData.placa || 'inspeccion';
      const fecha = this.getCurrentDate();
      this.gotenbergService.downloadBlob(pdfBlob!, `Inspeccion_${placa}_${fecha}.pdf`);

      console.log('✅ PDF generado y descargado exitosamente');

    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
      throw new Error(`Error al generar el PDF: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Exporta TODOS los datos del formulario a Excel con estilos preservados
   */
  async exportarInspeccionCompleta(formData: any): Promise<void> {
    try {
      const templateFile = await this.loadTemplateFromAssets();
      const arrayBuffer = await templateFile.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // ✅ Obtener hoja POR NOMBRE (crítico para tu plantilla)
      let worksheet = workbook.getWorksheet('FIRST_PAGE');

      if (!worksheet) {
        console.warn('⚠️ Hoja "FIRST_PAGE" no encontrada, usando segunda hoja por índice');
        worksheet = workbook.getWorksheet(2);
      }

      if (!worksheet) {
        throw new Error('No se encontró la hoja de destino en la plantilla Excel');
      }

      // ✅ Procesar todos los datos
      this.procesarHoja(worksheet, formData);

      // Generar y descargar
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const filename = `Inspeccion_${formData.placa || this.getCurrentDate()}.xlsx`;
      saveAs(blob, filename);

      console.log('✅ Inspección completa exportada exitosamente');

    } catch (error) {
      console.error('Error al exportar inspección completa:', error);
      throw error;
    }
  }
  private procesarHojaImagenes(worksheet: ExcelJS.Worksheet, formData: any): void {
    console.log('✏️ Procesando hoja SECOND_PAGE...');

    // ✅ Marcar estado de aprobación (F21 = aprobada, H21 = rechazada)
    if (formData.estado) {
      this.marcarEstadoAprobacion(worksheet, formData.estado);

      // ✅ Solo agregar nota si el estado es RECHAZADA
      const estadoLower = formData.estado.toLowerCase().trim();
      if (estadoLower === 'rechazada' || estadoLower === 'rechazado' || estadoLower === 'no') {
        this.agregarNotaReinspeccion(worksheet);
      }
    }

    // ✅ Aquí puedes agregar más lógica específica para la hoja SECOND_PAGE si la necesitas
    // Ejemplo: fechas, observaciones, etc.
    // this.setCell(worksheet, 'A1', formData.observaciones_imagenes);

    this.setCell(worksheet, 'U26', formData.llanta_di); // Ajustar según coordenadas reales
    this.setCell(worksheet, 'Y26', formData.llanta_dd);
    this.setCell(worksheet, 'U27', formData.llanta_tie);
    this.setCell(worksheet, 'Y27', formData.llanta_tde);
    this.setCell(worksheet, 'U28', formData.llanta_tii);
    this.setCell(worksheet, 'Y28', formData.llanta_tdi);

    this.setCell(worksheet, 'U31', formData.presion_llanta_d_li);  // LLanta D-LDI
    this.setCell(worksheet, 'Y31', formData.presion_llanta_d_ld);   // LLanta D-LD
    this.setCell(worksheet, 'U32', formData.presion_llanta_t_lie);  // LLanta T-LIE
    this.setCell(worksheet, 'Y32', formData.presion_llanta_t_lde);  // LLanta T-LDE
    this.setCell(worksheet, 'U33', formData.presion_llanta_t_lii);  // LLanta T-LII
    this.setCell(worksheet, 'Y33', formData.presion_llanta_t_ldi);  // LLanta T-LDI
    this.setCell(worksheet, 'D42:AA47', formData.observaciones);


    console.log('✅ Hoja SECOND_PAGE procesada exitosamente');
  }
  private procesarHoja(worksheet: ExcelJS.Worksheet, formData: any): void {
    console.log('✏️ Escribiendo datos en hoja:', worksheet.name);

    // ✅ Si es la hoja SECOND_PAGE, procesar el estado de aprobación
    if (worksheet.name === 'SECOND_PAGE') {
      this.procesarHojaImagenes(worksheet, formData); // ✅ Corregido: llamar al método específico
      return;
    }

    // ✅ Si es la hoja FIRST_PAGE, procesar datos del vehículo
    if (worksheet.name === 'FIRST_PAGE') {
      this.procesarHojaCamioneta(worksheet, formData);
    }
  }
  /**
   * Procesa y escribe TODOS los datos en la hoja de Excel
   * ✅ PRESERVA ESTILOS: Solo modificamos .value, NUNCA .style
   */
  private procesarHojaCamioneta(worksheet: ExcelJS.Worksheet, formData: any): void {
    console.log('✏️ Escribiendo datos en hoja:', worksheet.name);

    // ✅ DATOS DEL PROPIETARIO
    this.setCell(worksheet, 'E11:M11', formData.propietario); // propietario
    this.setCell(worksheet, 'P11:AA11', formData.documento_propietario); // documento propietario

    // // ✅ DATOS DEL VEHÍCULO (coordenadas verificadas con tu plantilla)
    this.setCell(worksheet, 'E20:M20', formData.placa); // Placa
    this.setCell(worksheet, 'E21:M21', formData.marca); // Marca
    this.setCell(worksheet, 'E22:M22', formData.modelo); // Modelo
    this.setCell(worksheet, 'V20:AA20', formData.kilometraje); // Kilometraje
    this.setCell(worksheet, 'E8:M8', formData.fecha_inspeccion); // Fecha inspección
    this.setCell(worksheet, 'Q8:AA8', formData.fecha_vigencia); // Vigencia hasta
    this.setCell(worksheet, 'J23:M23', formData.fecha_vencimiento_soat); // Color
    this.setCell(worksheet, 'J24:M24', formData.fecha_vencimiento_revision_tecnomecanica); // Color
    this.setCell(worksheet, 'J25:M25', formData.fecha_vencimiento_tarjeta_operacion); // Color
    this.setCell(worksheet, 'V21:AA21', formData.licencia_transito); // Licencia tránsito
    this.setCell(worksheet, 'E24:H24', formData.revision_tecnomecanica); // R. Tecnomecánica
    this.setCell(worksheet, 'E25:H25', formData.tarjeta_operacion); // Tarjeta operación
    this.setCell(worksheet, 'V23:AA23', formData.color); // Color
    this.setCell(worksheet, 'V24:AA24', formData.codigo_vehiculo); // Código vehículo
    this.setCell(worksheet, 'V25:AA25', formData.capacidad_pasajeros); // Capacidad
    this.setCell(worksheet, 'V22:AA22', formData.clase_vehiculo); // Clase vehículo
    this.setCell(worksheet, 'E23:H23', formData.soat); // Soat

    // ✅ DATOS DEL CONDUCTOR// ✅ DATOS DEL CONDUCTOR
    this.setCell(worksheet, 'E15:M15', formData.identificacion); // Identificación
    this.setCell(worksheet, 'E13:AA13', formData.nombre_transportadora); // Transportadora
    this.setCell(worksheet, 'E14:M14', formData.nombres_conductor); // Nombres conductor    
    this.setCell(worksheet, 'U15:AA15', formData.telefono_conductor); // Identificación
    this.setCell(worksheet, 'U14:AA14', formData.fecha_vencimiento_licencia); // Color

    // // ✅ SISTEMA ELÉCTRICO (Columnas: C=OK, D=Negativo, E=N/A)
    this.marcarRadio(worksheet, 'H38', 'J38', 'L38', formData.luces_navegacion); // Fila 14 en tu plantilla
    this.marcarRadio(worksheet, 'H40', 'J40', 'L40', formData.luces_frenado);
    this.marcarRadio(worksheet, 'H42', 'J42', 'L42', formData.luces_direccionales);
    this.marcarRadio(worksheet, 'H44', 'J44', 'L44', formData.luz_reversa);
    this.marcarRadio(worksheet, 'H46', 'J46', 'L46', formData.luces_estacionamiento);
    this.marcarRadio(worksheet, 'H48', 'J48', 'L48', formData.luces_posicion);
    this.marcarRadio(worksheet, 'H50', 'J50', 'L50', formData.luz_antineblina);
    this.marcarRadio(worksheet, 'H52', 'J52', 'L52', formData.luz_placa);
    this.marcarRadio(worksheet, 'H54', 'J54', 'L54', formData.tablero_instrumentos);
    this.marcarRadio(worksheet, 'H56', 'J56', 'L56', formData.bocina);
    this.marcarRadio(worksheet, 'H58', 'J58', 'L58', formData.bateria);
    this.marcarRadio(worksheet, 'H60', 'J60', 'L60', formData.aire_acondicionado);

    // // ✅ CARROCERÍA (ajustar filas según tu plantilla real)
    this.marcarRadio(worksheet, 'H84', 'J84', 'L84', formData.parachoque_delantero);
    this.marcarRadio(worksheet, 'H86', 'J86', 'L86', formData.parachoque_trasero);
    this.marcarRadio(worksheet, 'H88', 'J88', 'L88', formData.vidrios_seguridad);
    this.marcarRadio(worksheet, 'H90', 'J90', 'L90', formData.vidrios_laterales);
    this.marcarRadio(worksheet, 'H92', 'J92', 'L92', formData.limpia_brisas);
    this.marcarRadio(worksheet, 'H94', 'J94', 'L94', formData.guardabarros);
    this.marcarRadio(worksheet, 'H96', 'J96', 'L96', formData.estribos_laterales);
    this.marcarRadio(worksheet, 'H98', 'J98', 'L98', formData.placa_adhesivo);
    this.marcarRadio(worksheet, 'H100', 'J100', 'L100', formData.chapa_compuerta);

    // // ✅ CABINA Y MANDOS
    this.marcarRadio(worksheet, 'H106', 'J106', 'L106', formData.tapiceria);
    this.marcarRadio(worksheet, 'H108', 'J108', 'L108', formData.manijas_seguros);
    this.marcarRadio(worksheet, 'H110', 'J110', 'L110', formData.vidrios_electricos);
    this.marcarRadio(worksheet, 'H112', 'J112', 'L112', formData.antideslizantes_pedales);
    this.marcarRadio(worksheet, 'H114', 'J114', 'L114', formData.tablero_instrumentos);

    // MOTOR 
    this.marcarRadio(worksheet, 'H66', 'J66', 'L66', formData.aceite_motor);
    this.marcarRadio(worksheet, 'H68', 'J68', 'L68', formData.aceite_transmision);
    this.marcarRadio(worksheet, 'H70', 'J70', 'L70', formData.liquido_refrigerante);
    this.marcarRadio(worksheet, 'H72', 'J72', 'L72', formData.liquido_frenos);
    this.marcarRadio(worksheet, 'H74', 'J74', 'L74', formData.filtro_aire);
    this.marcarRadio(worksheet, 'H76', 'J76', 'L76', formData.hidraulico_direccion);
    this.marcarRadio(worksheet, 'H78', 'J78', 'L78', formData.tension_correas);


    // // ✅ SEGURIDAD PASIVA

    this.marcarRadio(worksheet, 'W54', 'Y54', 'AA54', formData.cinturones_seguridad);
    this.marcarRadio(worksheet, 'W56', 'Y56', 'AA56', formData.airbags);
    this.marcarRadio(worksheet, 'W58', 'Y58', 'AA58', formData.cadena_sujecion);
    this.marcarRadio(worksheet, 'W60', 'Y60', 'AA60', formData.columna_direccion);
    this.marcarRadio(worksheet, 'W62', 'Y62', 'AA62', formData.apoyacabezas);
    this.marcarRadio(worksheet, 'W64', 'Y64', 'AA64', formData.barra_antivuelco);
    this.marcarRadio(worksheet, 'W66', 'Y66', 'AA66', formData.rejilla_vidrio_trasero);


    // // ✅ SEGURIDAD ACTIVA
    this.marcarRadio(worksheet, 'W38', 'Y38', 'AA38', formData.sistema_frenos);
    this.marcarRadio(worksheet, 'W40', 'Y40', 'AA40', formData.abs);
    this.marcarRadio(worksheet, 'W42', 'Y42', 'AA42', formData.sistema_direccion);
    this.marcarRadio(worksheet, 'W44', 'Y44', 'AA44', formData.espejos_laterales);
    this.marcarRadio(worksheet, 'W46', 'Y46', 'AA46', formData.espejo_interno);
    this.marcarRadio(worksheet, 'W48', 'Y48', 'AA48', formData.freno_mano_seguridad);

    // // ✅ KIT DE CARRETERA
    this.marcarRadio(worksheet, 'W72', 'Y72', 'AA72', formData.conos_triangular);
    this.marcarRadio(worksheet, 'W74', 'Y74', 'AA74', formData.botiquin);
    this.marcarRadio(worksheet, 'W76', 'Y76', 'AA76', formData.extintor);
    this.marcarRadio(worksheet, 'W78', 'Y78', 'AA78', formData.cunas);
    this.marcarRadio(worksheet, 'W80', 'Y80', 'AA80', formData.llanta_repuesto);
    this.marcarRadio(worksheet, 'W82', 'Y82', 'AA82', formData.caja_herramientas);
    this.marcarRadio(worksheet, 'W84', 'Y84', 'AA84', formData.linterna);
    this.marcarRadio(worksheet, 'W86', 'Y86', 'AA86', formData.gato);


    //PARTE BAJA
    this.marcarRadio(worksheet, 'W92', 'Y92', 'AA92', formData.buies_barra);
    this.marcarRadio(worksheet, 'W94', 'Y94', 'AA94', formData.buies_tiera);
    this.marcarRadio(worksheet, 'W96', 'Y96', 'AA96', formData.cuna_motor);
    this.marcarRadio(worksheet, 'W98', 'Y98', 'AA98', formData.guardapolvo_axiales);
    this.marcarRadio(worksheet, 'W100', 'Y100', 'AA100', formData.amortiguadores);
    this.marcarRadio(worksheet, 'W102', 'Y102', 'AA102', formData.hojas_muelles);
    this.marcarRadio(worksheet, 'W104', 'Y104', 'AA104', formData.silenciadores);
    this.marcarRadio(worksheet, 'W106', 'Y106', 'AA106', formData.tanques_compresor);

    // ✅ PROFUNDIDAD DE LABRADO
    // this.setCell(worksheet, 'O112', formData.llanta_di); // Ajustar según coordenadas reales
    // this.setCell(worksheet, 'W112', formData.llanta_dd);
    // this.setCell(worksheet, 'O114', formData.llanta_tie);
    // this.setCell(worksheet, 'W114', formData.llanta_tde);
    // this.setCell(worksheet, 'O116', formData.llanta_tii);
    // this.setCell(worksheet, 'W116', formData.llanta_tdi);



    // PRESION DE AIRE
    // this.setCell(worksheet, 'B76', formData.presion_llanta_d_li); 
    // this.setCell(worksheet, 'D76', formData.presion_llanta_d_ld);
    // this.setCell(worksheet, 'F76', formData.presion_llanta_t_lie);
    // this.setCell(worksheet, 'L76', formData.presion_llanta_t_lde);
    // this.setCell(worksheet, 'H76', formData.presion_llanta_t_lii);
    // this.setCell(worksheet, 'J76', formData.presion_llanta_t_ldi);



    this.setCell(worksheet, 'X4:AA6', formData.numero_certificado); // numero_certificado



    console.log('✅ Todos los datos escritos exitosamente');
  }

  /**
   * ✅ MÉTODO SEGURO PARA ESCRIBIR CELDAS
   * Solo modifica el valor, NUNCA toca los estilos
   * Preserva 100% el formato original de la celda
   */
  private setCell(worksheet: ExcelJS.Worksheet, address: string, value: any): void {
    if (value == null || value === '') return;

    const cell = worksheet.getCell(address);
    // ✅ SOLO modificamos el valor, ExcelJS mantiene automáticamente el estilo original
    cell.value = value;

    // Opcional: Forzar preservación de estilo existente (redundante pero seguro)
    if (cell.style && Object.keys(cell.style).length > 0) {
      // No hacemos nada - el estilo ya está preservado
    }
  }

  /**
   * Marca una celda con "X" según el valor del radio (ok/negativo/na)
   * colC = OK, colD = Negativo, colE = N/A
   * ✅ Solo escribe "X", preserva estilos originales
   */
  // private marcarRadio(
  //   worksheet: ExcelJS.Worksheet,
  //   colOk: string,
  //   colNeg: string,
  //   colNa: string,
  //   valor: string
  // ): void {
  //   if (!valor) return;

  //   // Limpiar todas las opciones primero (importante para radios)
  //   worksheet.getCell(colOk).value = null;
  //   worksheet.getCell(colNeg).value = null;
  //   worksheet.getCell(colNa).value = null;

  //   // Marcar la opción seleccionada
  //   if (valor === 'ok') {
  //     worksheet.getCell(colOk).value = 'X';
  //   } else if (valor === 'negativo') {
  //     worksheet.getCell(colNeg).value = 'X';
  //   } else if (valor === 'na') {
  //     worksheet.getCell(colNa).value = 'X';
  //   }
  // }
  private marcarRadio(
    worksheet: ExcelJS.Worksheet,
    colOk: string,
    colNeg: string,
    colNa: string,
    valor: string
  ): void {
    if (!valor) return;

    // Limpiar todas las opciones primero
    worksheet.getCell(colOk).value = null;
    worksheet.getCell(colNeg).value = null;
    worksheet.getCell(colNa).value = null;

    // Símbolo de check Unicode
    const CHECK = '✓';

    // Colocar check solo en la columna correspondiente
    switch (valor.toLowerCase()) {
      case 'ok':
      case 'cumple':
      case 'c':
        worksheet.getCell(colOk).value = CHECK;
        break;

      case 'negativo':
      case 'no cumple':
      case 'n/c':
        worksheet.getCell(colNeg).value = CHECK;
        break;

      case 'na':
      case 'n/a':
      case 'no aplica':
        worksheet.getCell(colNa).value = CHECK;
        break;
    }
  }
  /**
   * ✅ Marca el estado de aprobación en la hoja SECOND_PAGE
   * - F21: Check ✓ si estado es "aprobada/aprobado/sí"
   * - H21: Check ✓ si estado es "rechazada/rechazado/no"
   */
  private marcarEstadoAprobacion(
    worksheet: ExcelJS.Worksheet,
    estado: string
  ): void {
    if (!estado) {
      console.warn('⚠️ No se proporcionó estado para aprobación');
      return;
    }

    const CHECK = '✓'; // Símbolo de check Unicode
    const cellF21 = worksheet.getCell('F33'); // Columna F = Aprobada
    const cellH21 = worksheet.getCell('H33'); // Columna H = Rechazada

    // Limpiar ambas celdas primero para evitar marcas duplicadas
    cellF21.value = null;
    cellH21.value = null;

    // Normalizar el estado para comparación
    const estadoLower = estado.toLowerCase().trim();

    // ✅ Marcar según el estado recibido
    if (estadoLower === 'aprobada' || estadoLower === 'aprobado' || estadoLower === 'si' || estadoLower === 'sí') {
      cellF21.value = CHECK;
      console.log(`✅ Estado: "${estado}" → Marcado con ✓ en F21 (APROBADA)`);

    } else if (estadoLower === 'rechazada' || estadoLower === 'rechazado' || estadoLower === 'no') {
      cellH21.value = CHECK;
      console.log(`✅ Estado: "${estado}" → Marcado con ✓ en H21 (RECHAZADA)`);

    } else {
      console.warn(`⚠️ Estado no reconocido: "${estado}". Valores válidos: aprobada/aprobado/sí, rechazada/rechazado/no`);
    }
  }
  /**
   * Carga la plantilla Excel desde assets
   */
  /**
 * Agrega la nota sobre reinspección de 15 días hábiles
 * Rango: D24:AA25
 * SOLO se llama cuando el estado es "rechazada"
 */
  private agregarNotaReinspeccion(worksheet: ExcelJS.Worksheet): void {
    const notaTexto = 'Nota: En caso de NO aprobar la inspección realizada tiene hasta 15 días hábiles para realizar las respectivas correcciones a los defectos señalados y realizar la reinspección sin ningún costo adicional.';

    try {
      // ✅ Fusionar celdas en el rango D24:AA25
      worksheet.mergeCells('D36:AA38');

      // ✅ Obtener la celda fusionada
      const notaCell = worksheet.getCell('D36');

      // ✅ Agregar el texto
      notaCell.value = notaTexto;

      // ✅ Configuración de alineación
      notaCell.alignment = {
        vertical: 'top',
        horizontal: 'left',
        wrapText: true  // El texto se ajusta automáticamente
      };

      // ✅ Formato de fuente
      notaCell.font = {
        name: 'Calibri',
        size: 9,
        bold: false,
        italic: false,
        color: { argb: 'FFFF0000' } // Rojo para destacar
      };

      // ✅ Fondo amarillo claro (opcional, para resaltar)
      notaCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFACD' } // LemonChiffon
      };

      // ✅ Bordes opcionales
      notaCell.border = {
        top: { style: 'thin', color: { argb: 'FFFF0000' } },
        left: { style: 'thin', color: { argb: 'FFFF0000' } },
        bottom: { style: 'thin', color: { argb: 'FFFF0000' } },
        right: { style: 'thin', color: { argb: 'FFFF0000' } }
      };
      notaCell.font.color = { argb: 'FFFF0000' };
      notaCell.font.bold = true;
      notaCell.font.italic = true;
      notaCell.font.size = 19;
      notaCell.font.name = 'Calibri';
      notaCell.font.color = { argb: 'FFFF0000' };
      notaCell.font.bold = true;
      notaCell.font.italic = true;
      notaCell.font.size = 19;
      notaCell.font.name = 'Calibri';

      // ✅ Ajustar altura de las filas
      worksheet.getRow(24).height = 35;
      worksheet.getRow(25).height = 35;

      console.log('✅ Nota de reinspección agregada en D24:AA25');

    } catch (error) {
      console.error('❌ Error al agregar nota de reinspección:', error);
    }
  }
  async loadTemplateFromAssets(): Promise<File> {
    try {
      console.log('📂 Cargando plantilla desde assets...');

      // ✅ Ruta CORRECTA según tu estructura (verifica en network tab del navegador)
      const path = '/assets/templates/busetas.xlsx';
      console.log('🔍 Cargando:', path);

      const response = await fetch(path);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: No se encontró la plantilla en ${path}`);
      }

      const blob = await response.blob();
      console.log('✅ Plantilla cargada exitosamente');

      return new File(
        [blob],
        'INSPECCION MECANICA VEHICULAR 2025.xlsx',
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );
    } catch (error) {
      console.error('❌ Error al cargar plantilla:', error);
      throw new Error(`No se pudo cargar la plantilla Excel: ${error}`);
    }
  }

  /**
   * Obtiene la fecha actual en formato YYYYMMDD
   */
  private getCurrentDate(): string {
    const date = new Date();
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  }
}