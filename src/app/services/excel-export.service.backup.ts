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
  ) {}

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
  // async generarXlsxConductorConImagenes(
  //   formData: any,
  //   imageUrls: string[] = []
  // ): Promise<Blob> {
  //   try {
  //     console.log(`🔍 Generando XLSX con ${imageUrls.length} imágenes...`);

  //     const templateFile = await this.loadTemplateFromAssets();
  //     const arrayBuffer = await templateFile.arrayBuffer();
  //     const workbook = new ExcelJS.Workbook();
  //     await workbook.xlsx.load(arrayBuffer);

  //     const worksheet = workbook.getWorksheet('CAMIONETA') || workbook.getWorksheet(2);
  //     if (!worksheet) throw new Error('No se encontró la hoja de destino');

  //     this.procesarHoja(worksheet, formData);

  //     if (imageUrls && imageUrls.length > 0) {
  //       await this.insertarImagenesEnHoja(worksheet, imageUrls, workbook);
  //     }

  //     const buffer = await workbook.xlsx.writeBuffer();
  //     return new Blob([buffer], {
  //       type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  //     });

  //   } catch (error) {
  //     console.error('❌ Error al generar XLSX con imágenes:', error);
  //     throw new Error(`Error: ${error instanceof Error ? error.message : error}`);
  //   }
  // }
  async generarXlsxConductorConImagenes(
  formData: any,
  imageUrls: string[] = []
): Promise<Blob> {
  try {
    console.log(`🔍 Generando XLSX con ${imageUrls.length} imágenes...`);

    const templateFile = await this.loadTemplateFromAssets();
    const arrayBuffer = await templateFile.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    // ✅ 1. Obtener hoja 1 y procesar datos
    const worksheet1 = workbook.getWorksheet('CAMIONETA') || workbook.getWorksheet(1);
    if (!worksheet1) throw new Error('No se encontró la hoja 1');
    this.procesarHoja(worksheet1, formData);

    // ✅ 2. Obtener hoja 2 para las imágenes
    let worksheet2 = workbook.getWorksheet(2); // Segunda hoja
    
 if (!worksheet2) {
  worksheet2 = workbook.addWorksheet('IMAGENES');
} else {
  // ✅ LIMPIAR filas existentes (1 hasta el final)
  const rowCount = worksheet2.rowCount;
  if (rowCount > 0) {
    worksheet2.spliceRows(1, rowCount);
  }
  // ✅ Resetear columnas
  worksheet2.columns = [];
}

// ✅ Configurar página
worksheet2.pageSetup = {
  paperSize: 9,
  orientation: 'portrait',
  margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5, header: 0.5, footer: 0.5 } 
};

    // ✅ 3. Insertar imágenes en la hoja 2 (si existen)
    if (imageUrls && imageUrls.length > 0) {
      await this.insertarImagenesEnHoja2(worksheet2, imageUrls, workbook);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

  } catch (error) {
    console.error('❌ Error al generar XLSX con imágenes:', error);
    throw new Error(`Error: ${error instanceof Error ? error.message : error}`);
  }
}
private async insertarImagenesEnHoja2(
  worksheet: ExcelJS.Worksheet,
  imageUrls: string[],
  workbook: ExcelJS.Workbook
): Promise<void> {
  
  console.log(`🖼️ Insertando ${imageUrls.length} imágenes en HOJA 2...`);

  // 🔹 Título principal
  const titleRow = 2;
  const titleCell = worksheet.getCell(`B${titleRow}`);
  titleCell.value = '📷 REGISTRO FOTOGRÁFICO DE LA INSPECCIÓN';
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF0F0369' } };
  titleCell.alignment = { horizontal: 'center' };
  worksheet.mergeCells(`B${titleRow}:J${titleRow}`);

  // 🔹 Configuración de imágenes
  const startRow = 8;  // Fila de inicio (después del título)
  const imageHeightPx = 150;  // Altura de cada imagen
  const imageWidthPx = 280;   // Ancho de cada imagen
  const gapBetweenRows = 12;  // Espacio vertical entre filas de imágenes

  // 🔹 Posiciones para 3 imágenes en una fila
  const imagePositions = [
    { col: 1, row: startRow, label: 'Imagen 1' },   // Columna B
    { col: 4, row: startRow, label: 'Imagen 2' },   // Columna E  
    { col: 7, row: startRow, label: 'Imagen 3' }    // Columna H
  ];

  // 🔹 Insertar cada imagen
  for (let index = 0; index < Math.min(imageUrls.length, 3); index++) {
    const imageUrl = imageUrls[index];
    if (!imageUrl?.trim()) continue;

    const pos = imagePositions[index];

    try {
      // 1. Descargar imagen
      const { buffer, extension } = await this.fetchImageAsBuffer(imageUrl);
      if (!buffer) continue;

      // 2. Agregar al workbook
      const imageId = workbook.addImage({ buffer, extension: 'jpeg' });

      // 3. Insertar en posición específica
      worksheet.addImage(imageId, {
        tl: { col: pos.col, row: pos.row - 1 },
        ext: { width: imageWidthPx, height: imageHeightPx },
      });

      // 4. Agregar caption debajo
      const captionRow = pos.row + 10; // 150px / 15px ≈ 10 filas
      const captionCell = worksheet.getCell(`${this.getColumnLetter(pos.col)}${captionRow}`);
      captionCell.value = `Imagen ${index + 1} de ${imageUrls.length}`;
      captionCell.font = { italic: true, size: 9, color: { argb: 'FF666666' } };
      captionCell.alignment = { horizontal: 'center' };

      console.log(`✅ Imagen ${index + 1} insertada en hoja 2`);

    } catch (error) {
      console.warn(`⚠️ No se pudo insertar imagen ${index + 1}:`, error);
    }
  }

  // 🔹 Ajustar ancho de columnas para mejor visualización
  worksheet.getColumn(1).width = 5;   // Columna A
  worksheet.getColumn(2).width = 30;  // Columna B (imagen 1)
  worksheet.getColumn(3).width = 5;   // Columna C
  worksheet.getColumn(4).width = 5;   // Columna D
  worksheet.getColumn(5).width = 30;  // Columna E (imagen 2)
  worksheet.getColumn(6).width = 5;   // Columna F
  worksheet.getColumn(7).width = 5;   // Columna G
  worksheet.getColumn(8).width = 30;  // Columna H (imagen 3)
  worksheet.getColumn(9).width = 5;   // Columna I
  worksheet.getColumn(10).width = 5;  // Columna J
}
/**
 * ✨ Inserta imágenes en HOJA 2 desde FILA 1
 */
private async insertarImagenesEnHoja2Limpia(
  worksheet: ExcelJS.Worksheet,
  imageUrls: string[],
  workbook: ExcelJS.Workbook
): Promise<void> {
  
  console.log(`🖼️ Insertando ${imageUrls.length} imágenes desde FILA 1...`);

  // 🔹 Título en fila 1
  const titleRow = 1;
  const titleCell = worksheet.getCell(`B${titleRow}`);
  titleCell.value = '📷 REGISTRO FOTOGRÁFICO DE LA INSPECCIÓN';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF0F0369' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.mergeCells(`B${titleRow}:J${titleRow}`);
  worksheet.getRow(titleRow).height = 35;

  // 🔹 Configuración - IMÁGENES DESDE FILA 3
  const startRow = 3;  // ✅ Justo después del título
  const imageHeightPx = 200;
  const imageWidthPx = 320;

  // 🔹 Coordenadas EXACTAS para 3 imágenes en una fila
  // Columnas: B=1, E=4, H=7 (0-indexed en ExcelJS)
  const positions = [
    { col: 1, row: startRow },   // B3 (Columna B = índice 1)
    { col: 4, row: startRow },   // E3 (Columna E = índice 4)
    { col: 7, row: startRow }    // H3 (Columna H = índice 7)
  ];

  // 🔹 Insertar cada imagen
  for (let index = 0; index < Math.min(imageUrls.length, 3); index++) {
    const imageUrl = imageUrls[index];
    if (!imageUrl?.trim()) continue;

    const pos = positions[index];

    try {
      const { buffer, extension } = await this.fetchImageAsBuffer(imageUrl);
      if (!buffer) continue;

      const imageId = workbook.addImage({ buffer, extension: 'jpeg' });

      // ✅ Coordenadas EXACTAS: tl = top-left
      worksheet.addImage(imageId, {
        tl: { 
          col: pos.col,  // Columna (0-indexed)
          row: pos.row - 1  // Fila (0-indexed, por eso -1)
        },
        ext: { 
          width: imageWidthPx, 
          height: imageHeightPx 
        },
        editAs: 'oneCell'  // ✅ La imagen se mueve con la celda
      });

      // Caption debajo
      const captionRow = startRow + 14; // 200px / ~15px por fila
      const colLetter = this.getColumnLetter(pos.col);
      const captionCell = worksheet.getCell(`${colLetter}${captionRow}`);
      captionCell.value = `Imagen ${index + 1}`;
      captionCell.font = { italic: true, size: 9, color: { argb: 'FF666666' } };
      captionCell.alignment = { horizontal: 'center' };

      console.log(`✅ Imagen ${index + 1}: Columna ${colLetter}, Fila ${startRow}`);

    } catch (error) {
      console.warn(`⚠️ Error imagen ${index + 1}:`, error);
    }
  }

  // 🔹 Ajustar columnas
  worksheet.getColumn(1).width = 2;   // A
  worksheet.getColumn(2).width = 38;  // B (imagen 1)
  worksheet.getColumn(3).width = 2;   // C
  worksheet.getColumn(4).width = 2;   // D
  worksheet.getColumn(5).width = 38;  // E (imagen 2)
  worksheet.getColumn(6).width = 2;   // F
  worksheet.getColumn(7).width = 2;   // G
  worksheet.getColumn(8).width = 38;  // H (imagen 3)
  worksheet.getColumn(9).width = 2;   // I
  worksheet.getColumn(10).width = 2;  // J

  // 🔹 Ajustar filas
  worksheet.getRow(1).height = 35; // Título
  for (let i = 2; i < 20; i++) {
    worksheet.getRow(i).height = 15;
  }
}

  /**
   * ✨ Inserta imágenes como objetos en Excel
   */


  /**
   * ✨ Descarga imagen y la convierte a ArrayBuffer para ExcelJS
   */
  private async fetchImageAsBuffer(imageUrl: string): Promise<{ buffer: any, extension: string }> {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = arrayBuffer;
      
      // Detectar extensión
      let extension = 'jpeg';
      const contentType = response.headers.get('content-type')?.toLowerCase() || '';
      const urlLower = imageUrl.toLowerCase();
      
      if (urlLower.endsWith('.png') || contentType.includes('image/png')) extension = 'png';
      else if (urlLower.endsWith('.gif') || contentType.includes('image/gif')) extension = 'gif';
      else if (urlLower.endsWith('.bmp') || contentType.includes('image/bmp')) extension = 'bmp';
      
      return { buffer, extension };
      
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
    this.setCell(worksheet, 'E19:M19', formData.placa); // Placa
    this.setCell(worksheet, 'E20:M20', formData.marca); // Marca
    this.setCell(worksheet, 'E21:M21', formData.modelo); // Modelo
    this.setCell(worksheet, 'R19:AA19', formData.kilometraje); // Kilometraje
    this.setCell(worksheet, 'E8:M8', formData.fecha_inspeccion); // Fecha inspección
    this.setCell(worksheet, 'L4', formData.fecha_vigencia); // Vigencia hasta

    // this.setCell(worksheet, 'B5', formData.licencia_transito); // Licencia tránsito
    // this.setCell(worksheet, 'D5', formData.revision_tecnomecanica); // R. Tecnomecánica
    // this.setCell(worksheet, 'F5', formData.tarjeta_operacion); // Tarjeta operación
    // this.setCell(worksheet, 'H5', formData.color); // Color
    // this.setCell(worksheet, 'J5', formData.codigo_vehiculo); // Código vehículo
    // this.setCell(worksheet, 'L5', formData.capacidad_pasajeros); // Capacidad

    // ✅ DATOS DEL CONDUCTOR
    // ✅ DATOS DEL CONDUCTOR// ✅ DATOS DEL CONDUCTOR
    this.setCell(worksheet, 'E12:AA12', formData.nombre_transportadora); // Transportadora
    this.setCell(worksheet, 'E13:M13', formData.nombres_conductor); // Nombres conductor    
    this.setCell(worksheet, 'U14:AA14', formData.telefono_conductor); // Identificación
    // this.setCell(worksheet, 'H7', formData.fecha_vencimiento_licencia); // V. Licencia

    // // ✅ SISTEMA ELÉCTRICO (Columnas: C=OK, D=Negativo, E=N/A)
    // this.marcarRadio(worksheet, 'C14', 'D14', 'E14', formData.luces_navegacion); // Fila 14 en tu plantilla
    // this.marcarRadio(worksheet, 'C15', 'D15', 'E15', formData.luces_frenado);
    // this.marcarRadio(worksheet, 'C16', 'D16', 'E16', formData.luces_direccionales);
    // this.marcarRadio(worksheet, 'C17', 'D17', 'E17', formData.luz_reversa);
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
  private marcarRadio(
    worksheet: ExcelJS.Worksheet,
    colOk: string,
    colNeg: string,
    colNa: string,
    valor: string
  ): void {
    if (!valor) return;

    // Limpiar todas las opciones primero (importante para radios)
    worksheet.getCell(colOk).value = null;
    worksheet.getCell(colNeg).value = null;
    worksheet.getCell(colNa).value = null;

    // Marcar la opción seleccionada
    if (valor === 'ok') {
      worksheet.getCell(colOk).value = 'X';
    } else if (valor === 'negativo') {
      worksheet.getCell(colNeg).value = 'X';
    } else if (valor === 'na') {
      worksheet.getCell(colNa).value = 'X';
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
  private async insertarImagenesEnHoja(
  worksheet: ExcelJS.Worksheet,
  imageUrls: string[],
  workbook: ExcelJS.Workbook
): Promise<void> {
  
  console.log(`🖼️ Insertando ${imageUrls.length} imágenes en disposición compacta...`);

  // 🔹 POSICIÓN: Mitad de la hoja 2 (ajusta según necesites)
  const startRow = 50;  // Fila donde comenzar (mitad de la página)
  const imageHeightPx = 120;  // Altura reducida (antes 180)
  const imageWidthPx = 250;   // Ancho reducido (antes 600)
  
  // 🔹 Título de sección
  const titleRow = startRow - 3;
  const titleCell = worksheet.getCell(`B${titleRow}`);
  titleCell.value = '📷 Registro Fotográfico de la Inspección';
  titleCell.font = { bold: true, size: 11, color: { argb: 'FF0F0369' } };
  titleCell.alignment = { horizontal: 'center' };
  worksheet.mergeCells(`B${titleRow}:K${titleRow}`);

  // 🔹 Disposición: 3 imágenes en una fila (columnas B, E, H)
  const imagePositions = [
    { col: 1, row: startRow, label: 'Vista Frontal' },      // Columna B
    { col: 4, row: startRow, label: 'Vista Lateral' },      // Columna E  
    { col: 7, row: startRow, label: 'Vista Posterior' }     // Columna H
  ];

  // 🔹 Insertar cada imagen en su posición
  for (let index = 0; index < Math.min(imageUrls.length, 3); index++) {
    const imageUrl = imageUrls[index];
    if (!imageUrl?.trim()) continue;

    const pos = imagePositions[index];

    try {
      // 1. Descargar imagen
      const { buffer, extension } = await this.fetchImageAsBuffer(imageUrl);
      if (!buffer) continue;

      // 2. Agregar al workbook
      const imageId = workbook.addImage({ buffer, extension: 'jpeg' });

      // 3. Insertar en posición específica
      worksheet.addImage(imageId, {
        tl: { col: pos.col, row: pos.row - 1 }, // tl = top-left
        ext: { width: imageWidthPx, height: imageHeightPx },
      });

      // 4. Agregar caption debajo de cada imagen
      const captionRow = pos.row + 8; // 8 filas debajo (120px / 15px por fila ≈ 8)
      const captionCell = worksheet.getCell(`${this.getColumnLetter(pos.col)}${captionRow}`);
      captionCell.value = `Imagen ${index + 1}`;
      captionCell.font = { italic: true, size: 8, color: { argb: 'FF666666' } };
      captionCell.alignment = { horizontal: 'center' };

      console.log(`✅ Imagen ${index + 1} insertada en columna ${pos.col}, fila ${pos.row}`);

    } catch (error) {
      console.warn(`⚠️ No se pudo insertar imagen ${index + 1}:`, error);
    }
  }

  // 🔹 Ajustar altura de filas para que quepan las imágenes
  for (let row = startRow; row < startRow + 10; row++) {
    const worksheetRow = worksheet.getRow(row);
    worksheetRow.height = 18; // Altura estándar
  }
}

/**
 * Helper: Convierte índice de columna a letra (0=A, 1=B, etc.)
 */
private getColumnLetter(colIndex: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (colIndex < 26) {
    return letters[colIndex];
  }
  return letters[Math.floor(colIndex / 26) - 1] + letters[colIndex % 26];
}

}