import { Injectable } from '@angular/core';
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
      const worksheet = workbook.getWorksheet('CAMIONETA');

      if (!worksheet) {
        // Intentar fallback por índice si falla el nombre
        console.warn('⚠️ Hoja "CAMIONETA" no encontrada por nombre, intentando por índice...');
        const fallbackSheet = workbook.getWorksheet('CAMIONETA'); // Segunda hoja (índice 2 en ExcelJS)
        if (!fallbackSheet) {
          throw new Error('No se encontró la hoja "CAMIONETA" ni la hoja 2 en el archivo Excel');
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

    // ✅ 1. PROCESAR HOJA "CAMIONETA" CON LOS DATOS DEL FORMULARIO
    const worksheetCamioneta = workbook.getWorksheet('CAMIONETA');
    if (!worksheetCamioneta) {
      throw new Error('No se encontró la hoja "CAMIONETA" en la plantilla');
    }
    console.log('✅ Procesando hoja "CAMIONETA" con datos del formulario...');
    this.procesarHoja(worksheetCamioneta, formData);

    // ✅ 2. PROCESAR HOJA "IMAGENES" CON LAS FOTOS
    const worksheetImagenes = workbook.getWorksheet('IMAGENES');
    if (!worksheetImagenes) {
      throw new Error('No se encontró la hoja "IMAGENES" en la plantilla');
    }
    console.log('✅ Procesando hoja "IMAGENES" con fotografías...');
    
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
      { rango: 'D6:L8', descripcion: 'Imagen 1 - Vista frontal/lateral' },
      { rango: 'N6:AA8', descripcion: 'Imagen 2 - Vista lateral/posterior' },
      { rango: 'D10:L17', descripcion: 'Imagen 3 - Motor/detalle' }
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
        `Inspeccion_${placa}_${fecha}_CON_IMAGENES.pdf`
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
      const worksheet = workbook.getWorksheet('CAMIONETA');

      if (!worksheet) {
        console.warn('⚠️ Hoja "CAMIONETA" no encontrada por nombre, intentando por índice...');
        const fallbackSheet = workbook.getWorksheet(1);
        if (!fallbackSheet) {
          throw new Error('No se encontró la hoja "CAMIONETA" ni la hoja 2 en el archivo Excel');
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
      let worksheet = workbook.getWorksheet('CAMIONETA');

      if (!worksheet) {
        console.warn('⚠️ Hoja "CAMIONETA" no encontrada, usando segunda hoja por índice');
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

  /**
   * Procesa y escribe TODOS los datos en la hoja de Excel
   * ✅ PRESERVA ESTILOS: Solo modificamos .value, NUNCA .style
   */
  private procesarHoja(worksheet: ExcelJS.Worksheet, formData: any): void {
    console.log('✏️ Escribiendo datos en hoja:', worksheet.name);

    // // ✅ DATOS DEL VEHÍCULO (coordenadas verificadas con tu plantilla)
    this.setCell(worksheet, 'E20:M20', formData.placa); // Placa
    this.setCell(worksheet, 'E21:M21', formData.marca); // Marca
    this.setCell(worksheet, 'E22:M22', formData.modelo); // Modelo
    this.setCell(worksheet, 'V20:AA20', formData.kilometraje); // Kilometraje
    this.setCell(worksheet, 'E8:M8', formData.fecha_inspeccion); // Fecha inspección
    this.setCell(worksheet, 'Q8:AA8', formData.fecha_vigencia); // Vigencia hasta
    this.setCell(worksheet, 'J23:M23', formData.fecha_vencimiento_soat); // Color
    this.setCell(worksheet, 'U14:AA14', formData.fecha_vencimiento_licencia); // Color
    this.setCell(worksheet, 'J24:M24', formData.fecha_vencimiento_revision_tecnomecanica); // Color
    this.setCell(worksheet, 'J25:M25', formData.fecha_vencimiento_tarjeta_operacion); // Color
    this.setCell(worksheet, 'E10:M10', formData.propietario); // propietario
    this.setCell(worksheet, 'P10:AA10', formData.documento_propietario); // documento propietario
    // this.setCell(worksheet, 'B5', formData.licencia_transito); // Licencia tránsito
    // this.setCell(worksheet, 'D5', formData.revision_tecnomecanica); // R. Tecnomecánica
    // this.setCell(worksheet, 'F5', formData.tarjeta_operacion); // Tarjeta operación
    // this.setCell(worksheet, 'H5', formData.color); // Color
    // this.setCell(worksheet, 'J5', formData.codigo_vehiculo); // Código vehículo
    // this.setCell(worksheet, 'L5', formData.capacidad_pasajeros); // Capacidad

    // ✅ DATOS DEL CONDUCTOR
    // ✅ DATOS DEL CONDUCTOR// ✅ DATOS DEL CONDUCTOR
    this.setCell(worksheet, 'E13:AA13', formData.nombre_transportadora); // Transportadora
    this.setCell(worksheet, 'E14:M14', formData.nombres_conductor); // Nombres conductor    
    this.setCell(worksheet, 'U15:AA15', formData.telefono_conductor); // Identificación
    // this.setCell(worksheet, 'H7', formData.fecha_vencimiento_licencia); // V. Licencia

    // // ✅ SISTEMA ELÉCTRICO (Columnas: C=OK, D=Negativo, E=N/A)
     this.marcarRadio(worksheet, 'H38', 'J38', 'L38', formData.luces_navegacion); // Fila 14 en tu plantilla
     this.marcarRadio(worksheet, 'H40', 'J40', 'L40', formData.luces_frenado);
     this.marcarRadio(worksheet, 'H42', 'J42', 'L42', formData.luces_direccionales);
     this.marcarRadio(worksheet, 'H44', 'J44', 'L44', formData.luz_reversa);
    // this.marcarRadio(worksheet, 'C18', 'D18', 'E18', formData.luces_estacionamiento);
    // this.marcarRadio(worksheet, 'C19', 'D19', 'E19', formData.luces_posicion);
    // this.marcarRadio(worksheet, 'C20', 'D20', 'E20', formData.luz_antineblina);
    // this.marcarRadio(worksheet, 'C21', 'D21', 'E21', formData.luz_placa);
    // this.marcarRadio(worksheet, 'C22', 'D22', 'E22', formData.tablero_instrumentos);
    // this.marcarRadio(worksheet, 'C23', 'D23', 'E23', formData.bocina);
    // this.marcarRadio(worksheet, 'C24', 'D24', 'E24', formData.bateria);
    // this.marcarRadio(worksheet, 'C25', 'D25', 'E25', formData.aire_acondicionado);

    // // ✅ CARROCERÍA (ajustar filas según tu plantilla real)
    // this.marcarRadio(worksheet, 'C29', 'D29', 'E29', formData.parachoque_delantero);
    // this.marcarRadio(worksheet, 'C30', 'D30', 'E30', formData.parachoque_trasero);
    // this.marcarRadio(worksheet, 'C31', 'D31', 'E31', formData.vidrios_seguridad);
    // this.marcarRadio(worksheet, 'C32', 'D32', 'E32', formData.chapa_compuerta);
    // this.marcarRadio(worksheet, 'C33', 'D33', 'E33', formData.guardabarros);
    // this.marcarRadio(worksheet, 'C34', 'D34', 'E34', formData.estribos_laterales);
    // this.marcarRadio(worksheet, 'C35', 'D35', 'E35', formData.placa_adhesivo);

    // // ✅ CABINA Y MANDOS
    // this.marcarRadio(worksheet, 'C39', 'D39', 'E39', formData.tapiceria);
    // this.marcarRadio(worksheet, 'C40', 'D40', 'E40', formData.manijas_seguros);
    // this.marcarRadio(worksheet, 'C41', 'D41', 'E41', formData.cinturones_seguridad);
    // this.marcarRadio(worksheet, 'C42', 'D42', 'E42', formData.airbags);
    // this.marcarRadio(worksheet, 'C43', 'D43', 'E43', formData.cadena_sujecion);
    // this.marcarRadio(worksheet, 'C44', 'D44', 'E44', formData.columna_direccion);
    // this.marcarRadio(worksheet, 'C45', 'D45', 'E45', formData.apoyacabezas);
    // this.marcarRadio(worksheet, 'C46', 'D46', 'E46', formData.barra_antivuelco);
    // this.marcarRadio(worksheet, 'C47', 'D47', 'E47', formData.rejilla_vidrio_trasero);
    // this.marcarRadio(worksheet, 'C48', 'D48', 'E48', formData.tablero_instrumentos_interno);
    // this.marcarRadio(worksheet, 'C49', 'D49', 'E49', formData.antideslizantes_pedales);
    // this.marcarRadio(worksheet, 'C50', 'D50', 'E50', formData.freno_mano);

    // // ✅ SEGURIDAD ACTIVA
    // this.marcarRadio(worksheet, 'C54', 'D54', 'E54', formData.sistema_frenos);
    // this.marcarRadio(worksheet, 'C55', 'D55', 'E55', formData.abs);
    // this.marcarRadio(worksheet, 'C56', 'D56', 'E56', formData.sistema_direccion);
    // this.marcarRadio(worksheet, 'C57', 'D57', 'E57', formData.espejos_laterales);
    // this.marcarRadio(worksheet, 'C58', 'D58', 'E58', formData.espejo_interno);
    // this.marcarRadio(worksheet, 'C59', 'D59', 'E59', formData.freno_mano_seguridad);

    // // ✅ KIT DE CARRETERA
    // this.marcarRadio(worksheet, 'C63', 'D63', 'E63', formData.conos_triangular);
    // this.marcarRadio(worksheet, 'C64', 'D64', 'E64', formData.botiquin);
    // this.marcarRadio(worksheet, 'C65', 'D65', 'E65', formData.extintor);
    // this.marcarRadio(worksheet, 'C66', 'D66', 'E66', formData.cunas);
    // this.marcarRadio(worksheet, 'C67', 'D67', 'E67', formData.llanta_repuesto);
    // this.marcarRadio(worksheet, 'C68', 'D68', 'E68', formData.caja_herramientas);
    // this.marcarRadio(worksheet, 'C69', 'D69', 'E69', formData.linterna);
    // this.marcarRadio(worksheet, 'C70', 'D70', 'E70', formData.gato);

    // // ✅ PROFUNDIDAD DE LABRADO
    // this.setCell(worksheet, 'B74', formData.llanta_d_ld); // Ajustar según coordenadas reales
    // this.setCell(worksheet, 'D74', formData.llanta_t_lie);
    // this.setCell(worksheet, 'F74', formData.llanta_t_lii);
    // this.setCell(worksheet, 'H74', formData.llanta_t_lid);

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
   * Carga la plantilla Excel desde assets
   */
  async loadTemplateFromAssets(): Promise<File> {
    try {
      console.log('📂 Cargando plantilla desde assets...');

      // ✅ Ruta CORRECTA según tu estructura (verifica en network tab del navegador)
      const path = '/assets/templates/camioneta.xlsx';
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