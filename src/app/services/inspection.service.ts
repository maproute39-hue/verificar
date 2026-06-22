import { Injectable } from '@angular/core';
import { Observable, from, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Inspection, CreateInspectionDTO, UpdateInspectionDTO } from '../models/inspection.model';
import PocketBase from 'pocketbase';
const INSPECTION_LIST_FIELDS = [
    'id',
    'created',
    'updated',
    'numero_certificado',
    'placa',
    'telefono',
    'whatsapp',
    'nombres_conductor',
    'identificacion',
    'foto_conductor',
    'fecha_inspeccion',
    'fecha_vigencia',
    'estado',
    'fecha_vencimiento_soat',
    'fecha_vencimiento_revision_tecnomecanica',
    'fecha_vencimiento_tarjeta_operacion',
    'licencia_vencimiento',
    'fecha_vencimiento_licencia',
    'clase_vehiculo',
    'marca',
    'modelo',
    'color',
    'codigo_vehiculo',
].join(',');
@Injectable({
    providedIn: 'root'
})
export class InspectionService {
    public pb: PocketBase;
    private readonly COLLECTION = 'inspections';
    constructor() {
        this.pb = new PocketBase('https://db.buckapi.site:8095');
    }
    private sanitizeListInspection(inspection: Inspection): Inspection {
        return {
            ...inspection,
            firma_conductor: undefined,
            firma_inspector: undefined,
        } as Inspection;
    }
    private sanitizeListInspections(inspections: Inspection[]): Inspection[] {
        return inspections.map((inspection) => this.sanitizeListInspection(inspection));
    }
    async uploadImage(file: File, metadata?: any): Promise<string> {
        try {
            const data: any = {
                image: file,
            };
            console.log('📤 Subiendo imagen:', file.name);
            console.log('📦 Datos:', data);
            const record = await this.pb.collection('images').create(data);
            console.log('✅ Imagen subida con ID:', record.id);
            return record.id;
        }
        catch (error: any) {
            console.error('❌ Error al subir imagen:', error);
            console.error('Response:', error.response);
            console.error('Data:', error.data);
            throw new Error(error.message || 'Error al subir la imagen');
        }
    }
    async uploadMultipleImages(files: File[], metadata?: any): Promise<string[]> {
        const uploadedIds: string[] = [];
        for (const file of files) {
            try {
                const imageId = await this.uploadImage(file, metadata);
                uploadedIds.push(imageId);
            }
            catch (error) {
                console.warn(`Falló al subir ${file.name}:`, error);
            }
        }
        return uploadedIds;
    }
    createInspection(data: CreateInspectionDTO): Observable<Inspection> {
        return from(this.pb.collection(this.COLLECTION).create(data)).pipe(map(record => record as unknown as Inspection), catchError(this.handleError));
    }
    getAllInspections(page: number = 1, perPage: number = 50, sort: string = '-created', filter?: string): Observable<{
        items: Inspection[];
        totalItems: number;
        totalPages: number;
        page: number;
    }> {
        return from(this.pb.collection(this.COLLECTION).getList(page, perPage, {
            sort,
            filter,
            fields: INSPECTION_LIST_FIELDS,
            $autoCancel: false
        })).pipe(map(response => ({
            items: this.sanitizeListInspections(response.items as unknown as Inspection[]),
            totalItems: response.totalItems,
            totalPages: response.totalPages,
            page: response.page
        })), catchError(this.handleError));
    }
    getInspectionById(id: string): Observable<Inspection> {
        return from(this.pb.collection(this.COLLECTION).getOne(id)).pipe(map(record => record as unknown as Inspection), catchError(this.handleError));
    }
    searchByPlaca(placa: string): Observable<Inspection[]> {
        return this.getAllInspections(1, 50, '-created', `placa~"${placa}"`).pipe(map(response => response.items));
    }
    getImageUrl(collectionId: string, recordId: string, filename: string, thumb: string = '0x0'): string {
        return `${this.pb.baseUrl}/api/files/${collectionId}/${recordId}/${filename}?thumb=${thumb}`;
    }
    async getNextCertificateNumberPreview(prefix: string): Promise<string> {
        const secuencia = await this.pb.collection('secuencias').getFirstListItem(`prefijo="${prefix}"`);
        const nuevoNumero = secuencia['ultimo_numero'] + 1;
        return `${prefix} ${String(nuevoNumero).padStart(4, '0')}`;
    }
    async getNextCertificateNumber(prefix: string): Promise<string> {
        const secuencia = await this.pb.collection('secuencias').getFirstListItem(`prefijo="${prefix}"`);
        const nuevoNumero = secuencia['ultimo_numero'] + 1;
        await this.pb.collection('secuencias').update(secuencia.id, {
            ultimo_numero: nuevoNumero
        });
        return `${prefix} ${String(nuevoNumero).padStart(4, '0')}`;
    }
    getInspectionWithImages(id: string): Observable<any> {
        return from(this.pb.collection(this.COLLECTION).getOne(id, {
            expand: 'images'
        })).pipe(map(record => record as unknown as any), catchError(this.handleError));
    }
    async getImageUrls(imageIds: string[]): Promise<string[]> {
        if (!imageIds || imageIds.length === 0)
            return [];
        const urls: string[] = [];
        const collectionId = '5bjt6wpqfj0rnsl';
        for (const imageId of imageIds) {
            try {
                const record = await this.pb.collection('images').getOne(imageId);
                const filename = record['image'];
                const url = this.getImageUrl(collectionId, imageId, filename);
                urls.push(url);
            }
            catch (error) {
                console.error(`Error al obtener imagen ${imageId}:`, error);
            }
        }
        return urls;
    }
    getInspectionsByEstado(estado: string): Observable<Inspection[]> {
        return this.getAllInspections(1, 100, '-created', `estado="${estado}"`).pipe(map(response => response.items));
    }
    updateInspection(id: string, data: UpdateInspectionDTO): Observable<Inspection> {
        return from(this.pb.collection(this.COLLECTION).update(id, data)).pipe(map(record => record as unknown as Inspection), catchError(this.handleError));
    }
    updateEstado(id: string, estado: string): Observable<Inspection> {
        return this.updateInspection(id, { estado });
    }
    deleteInspection(id: string): Observable<boolean> {
        return from(this.pb.collection(this.COLLECTION).delete(id)).pipe(catchError(this.handleError));
    }
    deleteMultipleInspections(ids: string[]): Observable<boolean[]> {
        const deleteObservables = ids.map(id => this.deleteInspection(id));
        return forkJoin(deleteObservables);
    }
    private handleError(error: any) {
        let errorMessage = 'Error desconocido';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        else if (error?.response) {
            const status = error.status || error.response?.code || 500;
            switch (status) {
                case 400:
                    errorMessage = 'Datos inválidos o incompletos';
                    break;
                case 401:
                    errorMessage = 'No autorizado. Por favor inicie sesión';
                    break;
                case 403:
                    errorMessage = 'Acceso denegado';
                    break;
                case 404:
                    errorMessage = 'Recurso no encontrado';
                    break;
                case 409:
                    errorMessage = 'Conflicto: El registro ya existe';
                    break;
                case 500:
                    errorMessage = 'Error interno del servidor';
                    break;
                default:
                    errorMessage = `Error ${status}: ${error.message || 'Error desconocido'}`;
            }
        }
        console.error('Error en InspectionService:', errorMessage, error);
        return throwError(() => new Error(errorMessage));
    }
    validateInspectionData(data: any): {
        valid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];
        if (!data.nombre_transportadora)
            errors.push('Nombre de transportadora es requerido');
        if (!data.nombres_conductor)
            errors.push('Nombre del conductor es requerido');
        if (!data.identificacion)
            errors.push('Identificación es requerida');
        if (!data.telefono)
            errors.push('Teléfono es requerido');
        if (!data.placa)
            errors.push('Placa es requerida');
        if (!data.marca)
            errors.push('Marca es requerida');
        if (!data.modelo)
            errors.push('Modelo es requerido');
        if (data.kilometraje === undefined || data.kilometraje === null)
            errors.push('Kilometraje es requerido');
        return {
            valid: errors.length === 0,
            errors
        };
    }
    getStats(): Observable<any> {
        return this.getAllInspections(1, 1).pipe(map(response => ({
            total: response.totalItems,
            page: response.page,
            totalPages: response.totalPages
        })));
    }
}
