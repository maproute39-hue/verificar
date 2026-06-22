import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { GotenbergService } from './gotenberg.service';
@Injectable({
    providedIn: 'root'
})
export class ExcelExportService {
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const base64String = base64.includes(',')
            ? base64.split(',')[1]
            : base64;
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
    constructor(private gotenbergService: GotenbergService) { }
    async exportarDatosConductor(formData: {
        nombre_transportadora?: string;
        firma_conductor?: string;
        firma_inspector?: string;
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
            const templateFile = await this.loadTemplateFromAssets();
            const arrayBuffer = await templateFile.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);
            console.log('✅ Workbook cargado');
            console.log('📋 Hojas disponibles:', workbook.worksheets.map(ws => ws.name));
            const worksheet = workbook.getWorksheet('FIRST_PAGE');
            if (!worksheet) {
                console.warn('⚠️ Hoja "FIRST_PAGE" no encontrada por nombre, intentando por índice...');
                const fallbackSheet = workbook.getWorksheet('FIRST_PAGE');
                if (!fallbackSheet) {
                    throw new Error('No se encontró la hoja "FIRST_PAGE" ni la hoja 2 en el archivo Excel');
                }
                this.procesarHoja(fallbackSheet, formData);
            }
            else {
                this.procesarHoja(worksheet, formData);
            }
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const filename = `Inspeccion_${this.getCurrentDate()}.xlsx`;
            saveAs(blob, filename);
            console.log('✅ Archivo exportado exitosamente con TODOS los estilos preservados');
        }
        catch (error) {
            console.error('❌ Error al exportar:', error);
            throw new Error(`Error al generar el archivo Excel: ${error instanceof Error ? error.message : error}`);
        }
    }
    async generarXlsxConductorConImagenes(formData: any, imageUrls: string[] = []): Promise<Blob> {
        try {
            console.log(`🔍 Generando XLSX con datos + ${imageUrls.length} imágenes...`);
            const templateFile = await this.loadTemplateFromAssets();
            const arrayBuffer = await templateFile.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);
            const worksheetCamioneta = workbook.getWorksheet('FIRST_PAGE');
            if (!worksheetCamioneta) {
                throw new Error('No se encontró la hoja "FIRST_PAGE" en la plantilla');
            }
            console.log('✅ Procesando hoja "FIRST_PAGE" con datos del formulario...');
            this.procesarHoja(worksheetCamioneta, formData);
            const worksheetImagenes = workbook.getWorksheet('SECOND_PAGE');
            if (!worksheetImagenes) {
                throw new Error('No se encontró la hoja "SECOND_PAGE" en la plantilla');
            }
            console.log('✅ Procesando hoja "SECOND_PAGE" con datos del formulario...');
            this.procesarHoja(worksheetImagenes, formData);
            if (formData.firma_conductor) {
                await this.insertarFirmaConductor(worksheetImagenes, formData.firma_conductor, workbook);
            }
            if (formData.firma_inspector) {
                await this.insertarFirmaInspector(worksheetImagenes, formData.firma_inspector, workbook);
            }
            console.log('✅ Procesando hoja "SECOND_PAGE" con fotografías...');
            if (imageUrls && imageUrls.length > 0) {
                await this.insertarTresImagenesPosicionesFijas(worksheetImagenes, imageUrls, workbook);
            }
            else {
                console.warn('⚠️ No hay imágenes para insertar');
            }
            const imagenesParaInsertar = this.normalizarImagenes(imageUrls);
            console.log(`🖼️ Imágenes a insertar: ${imagenesParaInsertar.length} (normalizadas)`);
            if (imagenesParaInsertar.length > 0) {
                await this.insertarTresImagenesPosicionesFijas(worksheetImagenes, imagenesParaInsertar, workbook);
            }
            else {
                console.warn('⚠️ No hay imágenes para insertar');
            }
            const buffer = await workbook.xlsx.writeBuffer();
            console.log('✅ XLSX generado exitosamente con datos e imágenes');
            return new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
        }
        catch (error) {
            console.error('❌ Error al generar XLSX con imágenes:', error);
            throw error;
        }
    }
    private normalizarImagenes(imageUrls: string[] = []): string[] {
        const DEFAULT_IMAGE = '/assets/images/no_image.png';
        if (!imageUrls || imageUrls.length === 0) {
            return [DEFAULT_IMAGE, DEFAULT_IMAGE, DEFAULT_IMAGE];
        }
        const result = imageUrls.slice(0, 3);
        while (result.length < 3) {
            result.push(DEFAULT_IMAGE);
        }
        return result;
    }
    private async insertarTresImagenesPosicionesFijas(worksheet: ExcelJS.Worksheet, imageUrls: string[], workbook: ExcelJS.Workbook): Promise<void> {
        console.log(`🖼️ Insertando ${Math.min(imageUrls.length, 3)} imágenes en posiciones fijas...`);
        const posiciones = [
            { rango: 'D23:L27', descripcion: 'Imagen 1 - Vista frontal/lateral' },
            { rango: 'N23:AA27', descripcion: 'Imagen 2 - Vista lateral/posterior' },
            { rango: 'D30:L34', descripcion: 'Imagen 3 - Motor/detalle' }
        ];
        for (let index = 0; index < Math.min(imageUrls.length, 3); index++) {
            const imageUrl = imageUrls[index];
            if (!imageUrl?.trim()) {
                console.warn(`⚠️ Imagen ${index + 1}: URL vacía`);
                continue;
            }
            const posicion = posiciones[index];
            console.log(`📥 Procesando ${posicion.descripcion}: ${imageUrl}`);
            try {
                const imageData = await this.fetchImageAsBuffer(imageUrl);
                if (!imageData?.buffer) {
                    console.error(`❌ ${posicion.descripcion}: No se obtuvo buffer`);
                    continue;
                }
                console.log(`✅ ${posicion.descripcion} descargada (${imageData.buffer.byteLength} bytes)`);
                const imageId = workbook.addImage({
                    buffer: imageData.buffer,
                    extension: 'jpeg'
                });
                worksheet.addImage(imageId, posicion.rango);
                console.log(`✅ ${posicion.descripcion} insertada en ${posicion.rango}`);
            }
            catch (error) {
                console.error(`❌ Error insertando ${posicion.descripcion}:`, error);
            }
        }
        console.log('✅ Proceso de inserción de imágenes completado');
    }
    private async fetchImageAsBuffer(imageUrl: string): Promise<{
        buffer: ArrayBuffer;
        extension: string;
    }> {
        try {
            const response = await fetch(imageUrl, { mode: 'cors' });
            if (!response.ok)
                throw new Error(`HTTP ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            let extension = 'jpeg';
            const contentType = response.headers.get('content-type')?.toLowerCase() || '';
            const urlLower = imageUrl.toLowerCase();
            if (urlLower.endsWith('.png') || contentType.includes('image/png')) {
                extension = 'png';
            }
            else if (urlLower.endsWith('.gif') || contentType.includes('image/gif')) {
                extension = 'gif';
            }
            else if (urlLower.endsWith('.bmp') || contentType.includes('image/bmp')) {
                extension = 'bmp';
            }
            return { buffer: arrayBuffer, extension };
        }
        catch (error) {
            console.error('❌ Error al descargar imagen:', imageUrl, error);
            throw error;
        }
    }
    async exportarDatosConductorComoPdfConImagenes(formData: any, imageUrls: string[] = []): Promise<void> {
        try {
            if (!this.gotenbergService) {
                throw new Error('GotenbergService no está disponible');
            }
            console.log(`🔍 Generando PDF con ${imageUrls.length} imágenes...`);
            const xlsxBlob = await this.generarXlsxConductorConImagenes(formData, imageUrls);
            const pdfBlob = await this.gotenbergService.convertXlsxToPdf(xlsxBlob).toPromise();
            const placa = formData.placa?.replace(/\s+/g, '_') || 'inspeccion';
            const fecha = this.getCurrentDate();
            this.gotenbergService.downloadBlob(pdfBlob!, `Inspeccion_${placa}_${fecha}_CON_SECOND_PAGE.pdf`);
            console.log('✅ PDF con imágenes generado');
        }
        catch (error) {
            console.error('❌ Error al generar PDF con imágenes:', error);
            throw new Error(`Error: ${error instanceof Error ? error.message : error}`);
        }
    }
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
            const templateFile = await this.loadTemplateFromAssets();
            const arrayBuffer = await templateFile.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);
            const worksheet = workbook.getWorksheet('FIRST_PAGE');
            if (!worksheet) {
                console.warn('⚠️ Hoja "FIRST_PAGE" no encontrada por nombre, intentando por índice...');
                const fallbackSheet = workbook.getWorksheet(1);
                if (!fallbackSheet) {
                    throw new Error('No se encontró la hoja "FIRST_PAGE" ni la hoja 2 en el archivo Excel');
                }
                this.procesarHoja(fallbackSheet, formData);
            }
            else {
                this.procesarHoja(worksheet, formData);
            }
            const buffer = await workbook.xlsx.writeBuffer();
            return new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
        }
        catch (error) {
            console.error('❌ Error al generar XLSX:', error);
            throw new Error(`Error al generar el archivo Excel: ${error instanceof Error ? error.message : error}`);
        }
    }
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
            if (!this.gotenbergService) {
                throw new Error('GotenbergService no está disponible. Por favor, inyecta el servicio en el constructor.');
            }
            console.log('🔍 Generando PDF con Gotenberg...');
            const xlsxBlob = await this.generarXlsxConductor(formData);
            const pdfBlob = await this.gotenbergService.convertXlsxToPdf(xlsxBlob).toPromise();
            const placa = formData.placa || 'inspeccion';
            const fecha = this.getCurrentDate();
            this.gotenbergService.downloadBlob(pdfBlob!, `Inspeccion_${placa}_${fecha}.pdf`);
            console.log('✅ PDF generado y descargado exitosamente');
        }
        catch (error) {
            console.error('❌ Error al generar PDF:', error);
            throw new Error(`Error al generar el PDF: ${error instanceof Error ? error.message : error}`);
        }
    }
    async exportarInspeccionCompleta(formData: any): Promise<void> {
        try {
            const templateFile = await this.loadTemplateFromAssets();
            const arrayBuffer = await templateFile.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(arrayBuffer);
            let worksheet = workbook.getWorksheet('FIRST_PAGE');
            if (!worksheet) {
                console.warn('⚠️ Hoja "FIRST_PAGE" no encontrada, usando segunda hoja por índice');
                worksheet = workbook.getWorksheet(2);
            }
            if (!worksheet) {
                throw new Error('No se encontró la hoja de destino en la plantilla Excel');
            }
            this.procesarHoja(worksheet, formData);
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const filename = `Inspeccion_${formData.placa || this.getCurrentDate()}.xlsx`;
            saveAs(blob, filename);
            console.log('✅ Inspección completa exportada exitosamente');
        }
        catch (error) {
            console.error('Error al exportar inspección completa:', error);
            throw error;
        }
    }
    private procesarHojaImagenes(worksheet: ExcelJS.Worksheet, formData: any): void {
        console.log('✏️ Procesando hoja SECOND_PAGE...');
        if (formData.estado) {
            this.marcarEstadoAprobacion(worksheet, formData.estado);
            const estadoLower = formData.estado.toLowerCase().trim();
            if (estadoLower === 'rechazada' || estadoLower === 'rechazado' || estadoLower === 'no') {
                this.agregarNotaReinspeccion(worksheet);
            }
        }
        this.marcarRadio(worksheet, 'H9', 'J9', 'L9', formData.freno_mano_seguridad);
        this.marcarRadio(worksheet, 'H11', 'J11', 'L11', formData.liquido_frenos);
        this.marcarRadio(worksheet, 'H13', 'J13', 'L13', formData.pedal_frenos);
        this.marcarRadio(worksheet, 'H15', 'J15', 'L15', formData.bomba_frenos);
        this.marcarRadio(worksheet, 'W9', 'Y9', 'AA9', formData.caja_deposito);
        this.marcarRadio(worksheet, 'W11', 'Y11', 'AA11', formData.terminales);
        this.marcarRadio(worksheet, 'W13', 'Y13', 'AA13', formData.barras_bujes);
        this.marcarRadio(worksheet, 'W15', 'Y15', 'AA15', formData.protectores);
        this.marcarRadio(worksheet, 'W19', 'Y19', 'AA19', formData.hidraulico_direccion);
        this.marcarRadio(worksheet, 'W17', 'Y17', 'AA17', formData.columna_direccion);
        this.setCell(worksheet, 'U30', formData.llanta_di);
        this.setCell(worksheet, 'Y30', formData.llanta_dd);
        this.setCell(worksheet, 'U31', formData.llanta_tie);
        this.setCell(worksheet, 'Y31', formData.llanta_tde);
        this.setCell(worksheet, 'U32', formData.llanta_tii);
        this.setCell(worksheet, 'Y32', formData.llanta_tdi);
        this.setCell(worksheet, 'U35', formData.presion_llanta_d_li);
        this.setCell(worksheet, 'Y35', formData.presion_llanta_d_ld);
        this.setCell(worksheet, 'U36', formData.presion_llanta_t_lie);
        this.setCell(worksheet, 'Y36', formData.presion_llanta_t_lde);
        this.setCell(worksheet, 'U37', formData.presion_llanta_t_lii);
        this.setCell(worksheet, 'Y37', formData.presion_llanta_t_ldi);
        this.setCell(worksheet, 'D44:AA51', formData.observaciones);
        console.log('✅ Hoja SECOND_PAGE procesada exitosamente');
    }
    private procesarHoja(worksheet: ExcelJS.Worksheet, formData: any): void {
        console.log('✏️ Escribiendo datos en hoja:', worksheet.name);
        if (worksheet.name === 'SECOND_PAGE') {
            this.procesarHojaImagenes(worksheet, formData);
            return;
        }
        if (worksheet.name === 'FIRST_PAGE') {
            this.procesarHojaCamioneta(worksheet, formData);
        }
    }
    private async insertarFirmaInspector(worksheet: ExcelJS.Worksheet, firmaBase64: string | null | undefined, workbook: ExcelJS.Workbook): Promise<void> {
        if (!firmaBase64) {
            console.warn('⚠️ No hay firma del inspector para insertar');
            return;
        }
        try {
            console.log('🖊️ Insertando firma del inspector...');
            const buffer = this.base64ToArrayBuffer(firmaBase64);
            const imageId = workbook.addImage({
                buffer: buffer,
                extension: 'png'
            });
            worksheet.addImage(imageId, 'O57:AA59');
            worksheet.getRow(57).height = 30;
            worksheet.getRow(58).height = 30;
            worksheet.getRow(59).height = 30;
            console.log('✅ Firma del inspector insertada en O57:AA59');
        }
        catch (error) {
            console.error('❌ Error al insertar firma del inspector:', error);
        }
    }
    private async insertarFirmaConductor(worksheet: ExcelJS.Worksheet, firmaBase64: string | null | undefined, workbook: ExcelJS.Workbook): Promise<void> {
        if (!firmaBase64) {
            console.warn('⚠️ No hay firma del conductor para insertar');
            return;
        }
        try {
            console.log('🖊️ Insertando firma del conductor...');
            const buffer = this.base64ToArrayBuffer(firmaBase64);
            const imageId = workbook.addImage({
                buffer: buffer,
                extension: 'png',
            });
            worksheet.addImage(imageId, 'E57:L59');
            worksheet.getRow(57).height = 30;
            worksheet.getRow(58).height = 30;
            worksheet.getRow(59).height = 30;
            console.log('✅ Firma del conductor insertada correctamente');
        }
        catch (error) {
            console.error('❌ Error al insertar firma:', error);
        }
    }
    private procesarHojaCamioneta(worksheet: ExcelJS.Worksheet, formData: any): void {
        console.log('✏️ Escribiendo datos en hoja:', worksheet.name);
        this.setCell(worksheet, 'E11:O11', formData.propietario);
        this.setCell(worksheet, 'V11:AA11', formData.documento_propietario);
        this.setCell(worksheet, 'E20:M20', formData.placa);
        this.setCell(worksheet, 'E21:M21', formData.marca);
        this.setCell(worksheet, 'E22:M22', formData.modelo);
        this.setCell(worksheet, 'V20:AA20', formData.kilometraje);
        this.setCell(worksheet, 'E8:M8', formData.fecha_inspeccion);
        this.setCell(worksheet, 'Q8:AA8', formData.fecha_vigencia);
        this.setCell(worksheet, 'J23:M23', formData.fecha_vencimiento_soat);
        this.setCell(worksheet, 'J24:M24', formData.fecha_vencimiento_revision_tecnomecanica);
        this.setCell(worksheet, 'J25:M25', formData.fecha_vencimiento_tarjeta_operacion);
        this.setCell(worksheet, 'V21:AA21', formData.licencia_transito);
        this.setCell(worksheet, 'E24:H24', formData.revision_tecnomecanica);
        this.setCell(worksheet, 'E25:H25', formData.tarjeta_operacion);
        this.setCell(worksheet, 'V23:AA23', formData.color);
        this.setCell(worksheet, 'V24:AA24', formData.codigo_vehiculo);
        this.setCell(worksheet, 'V25:AA25', formData.capacidad_pasajeros);
        this.setCell(worksheet, 'V22:AA22', formData.clase_vehiculo);
        this.setCell(worksheet, 'E23:H23', formData.soat);
        this.setCell(worksheet, 'E15:M15', formData.identificacion);
        this.setCell(worksheet, 'E13:AA13', formData.nombre_transportadora);
        this.setCell(worksheet, 'E14:M14', formData.nombres_conductor);
        this.setCell(worksheet, 'U15:AA15', formData.telefono_conductor);
        this.setCell(worksheet, 'U14:AA14', formData.fecha_vencimiento_licencia);
        this.marcarRadio(worksheet, 'H38', 'J38', 'L38', formData.luces_navegacion);
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
        this.marcarRadio(worksheet, 'H82', 'J82', 'L82', formData.parachoque_delantero);
        this.marcarRadio(worksheet, 'H84', 'J84', 'L84', formData.parachoque_trasero);
        this.marcarRadio(worksheet, 'H86', 'J86', 'L86', formData.vidrios_seguridad);
        this.marcarRadio(worksheet, 'H88', 'J88', 'L88', formData.vidrios_laterales);
        this.marcarRadio(worksheet, 'H90', 'J90', 'L90', formData.limpia_brisas);
        this.marcarRadio(worksheet, 'H92', 'J92', 'L92', formData.guardabarros);
        this.marcarRadio(worksheet, 'H94', 'J94', 'L94', formData.estribos_laterales);
        this.marcarRadio(worksheet, 'H96', 'J96', 'L96', formData.placa_adhesivo);
        this.marcarRadio(worksheet, 'H98', 'J98', 'L98', formData.chapa_compuerta);
        this.marcarRadio(worksheet, 'H106', 'J106', 'L106', formData.tapiceria);
        this.marcarRadio(worksheet, 'H108', 'J108', 'L108', formData.manijas_seguros);
        this.marcarRadio(worksheet, 'H110', 'J110', 'L110', formData.vidrios_electricos);
        this.marcarRadio(worksheet, 'H112', 'J112', 'L112', formData.antideslizantes_pedales);
        this.marcarRadio(worksheet, 'H114', 'J114', 'L114', formData.tablero_instrumentos);
        this.marcarRadio(worksheet, 'H66', 'J66', 'L66', formData.aceite_motor);
        this.marcarRadio(worksheet, 'H68', 'J68', 'L68', formData.aceite_transmision);
        this.marcarRadio(worksheet, 'H70', 'J70', 'L70', formData.liquido_refrigerante);
        this.marcarRadio(worksheet, 'H72', 'J72', 'L72', formData.tension_correas);
        this.marcarRadio(worksheet, 'H74', 'J74', 'L74', formData.filtro_aire);
        this.marcarRadio(worksheet, 'W50', 'Y50', 'AA50', formData.cinturones_seguridad);
        this.marcarRadio(worksheet, 'W52', 'Y52', 'AA52', formData.airbags);
        this.marcarRadio(worksheet, 'W54', 'Y54', 'AA54', formData.cadena_sujecion);
        this.marcarRadio(worksheet, 'W56', 'Y56', 'AA56', formData.apoyacabezas);
        this.marcarRadio(worksheet, 'W58', 'Y58', 'AA58', formData.barra_antivuelco);
        this.marcarRadio(worksheet, 'W60', 'Y60', 'AA60', formData.rejilla_vidrio_trasero);
        this.marcarRadio(worksheet, 'W38', 'Y38', 'AA38', formData.espejo_interno);
        this.marcarRadio(worksheet, 'W40', 'Y40', 'AA40', formData.abs);
        this.marcarRadio(worksheet, 'W42', 'Y42', 'AA42', formData.espejos_laterales);
        this.marcarRadio(worksheet, 'W66', 'Y66', 'AA66', formData.conos_triangular);
        this.marcarRadio(worksheet, 'W68', 'Y68', 'AA68', formData.botiquin);
        this.marcarRadio(worksheet, 'W70', 'Y70', 'AA70', formData.extintor);
        this.marcarRadio(worksheet, 'W72', 'Y72', 'AA72', formData.cunas);
        this.marcarRadio(worksheet, 'W74', 'Y74', 'AA74', formData.llanta_repuesto);
        this.marcarRadio(worksheet, 'W76', 'Y76', 'AA76', formData.caja_herramientas);
        this.marcarRadio(worksheet, 'W78', 'Y78', 'AA78', formData.linterna);
        this.marcarRadio(worksheet, 'W80', 'Y80', 'AA80', formData.gato);
        this.marcarRadio(worksheet, 'W88', 'Y88', 'AA88', formData.buies_barra);
        this.marcarRadio(worksheet, 'W90', 'Y90', 'AA90', formData.buies_tiera);
        this.marcarRadio(worksheet, 'W92', 'Y92', 'AA92', formData.cuna_motor);
        this.marcarRadio(worksheet, 'W94', 'Y94', 'AA94', formData.guardapolvo_axiales);
        this.marcarRadio(worksheet, 'W96', 'Y96', 'AA96', formData.amortiguadores);
        this.marcarRadio(worksheet, 'W98', 'Y98', 'AA98', formData.hojas_muelles);
        this.marcarRadio(worksheet, 'W100', 'Y100', 'AA100', formData.silenciadores);
        this.marcarRadio(worksheet, 'W102', 'Y102', 'AA102', formData.tanques_compresor);
        this.setCell(worksheet, 'X4:AA6', formData.numero_certificado);
        console.log('✅ Todos los datos escritos exitosamente');
    }
    private setCell(worksheet: ExcelJS.Worksheet, address: string, value: any): void {
        if (value == null || value === '')
            return;
        const cell = worksheet.getCell(address);
        cell.value = value;
        if (cell.style && Object.keys(cell.style).length > 0) {
        }
    }
    private marcarRadio(worksheet: ExcelJS.Worksheet, colOk: string, colNeg: string, colNa: string, valor: string): void {
        if (!valor)
            return;
        worksheet.getCell(colOk).value = null;
        worksheet.getCell(colNeg).value = null;
        worksheet.getCell(colNa).value = null;
        const CHECK = '✓';
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
    private marcarEstadoAprobacion(worksheet: ExcelJS.Worksheet, estado: string): void {
        if (!estado) {
            console.warn('⚠️ No se proporcionó estado para aprobación');
            return;
        }
        const CHECK = '✓';
        const cellF21 = worksheet.getCell('F37');
        const cellH21 = worksheet.getCell('H37');
        cellF21.value = null;
        cellH21.value = null;
        const estadoLower = estado.toLowerCase().trim();
        if (estadoLower === 'aprobada' || estadoLower === 'aprobado' || estadoLower === 'si' || estadoLower === 'sí') {
            cellF21.value = CHECK;
            console.log(`✅ Estado: "${estado}" → Marcado con ✓ en F21 (APROBADA)`);
        }
        else if (estadoLower === 'rechazada' || estadoLower === 'rechazado' || estadoLower === 'no') {
            cellH21.value = CHECK;
            console.log(`✅ Estado: "${estado}" → Marcado con ✓ en H21 (RECHAZADA)`);
        }
        else {
            console.warn(`⚠️ Estado no reconocido: "${estado}". Valores válidos: aprobada/aprobado/sí, rechazada/rechazado/no`);
        }
    }
    private agregarNotaReinspeccion(worksheet: ExcelJS.Worksheet): void {
        const notaTexto = 'Nota: En caso de NO aprobar la inspección realizada tiene hasta 15 días hábiles para realizar las respectivas correcciones a los defectos señalados y realizar la reinspección sin ningún costo adicional.';
        try {
            worksheet.mergeCells('D39:AA42');
            const notaCell = worksheet.getCell('D39');
            notaCell.value = notaTexto;
            notaCell.alignment = {
                vertical: 'top',
                horizontal: 'left',
                wrapText: true
            };
            notaCell.font = {
                name: 'Calibri',
                size: 9,
                bold: false,
                italic: false,
                color: { argb: 'FFFF0000' }
            };
            notaCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFACD' }
            };
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
            worksheet.getRow(24).height = 35;
            worksheet.getRow(25).height = 35;
            console.log('✅ Nota de reinspección agregada en D24:AA25');
        }
        catch (error) {
            console.error('❌ Error al agregar nota de reinspección:', error);
        }
    }
    async loadTemplateFromAssets(): Promise<File> {
        try {
            console.log('📂 Cargando plantilla desde assets...');
            const path = '/assets/templates/inspection.xlsx';
            console.log('🔍 Cargando:', path);
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: No se encontró la plantilla en ${path}`);
            }
            const blob = await response.blob();
            console.log('✅ Plantilla cargada exitosamente');
            return new File([blob], 'INSPECCION MECANICA VEHICULAR 2025.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        }
        catch (error) {
            console.error('❌ Error al cargar plantilla:', error);
            throw new Error(`No se pudo cargar la plantilla Excel: ${error}`);
        }
    }
    private getCurrentDate(): string {
        const date = new Date();
        return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    }
}
