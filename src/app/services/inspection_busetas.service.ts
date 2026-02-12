import { Injectable } from '@angular/core';
import { Observable, from, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Inspection, CreateInspectionDTO, UpdateInspectionDTO } from '../models/inspection.model';
import PocketBase from 'pocketbase';

@Injectable({
  providedIn: 'root'
})
export class InspectionBusetasService {
  private pb: PocketBase;
  private readonly COLLECTION = 'inspections_busetas';
  
  constructor() {
    this.pb = new PocketBase('https://db.buckapi.site:8095');
  }

  // CREATE - Crear nueva inspección
  createInspection(data: CreateInspectionDTO): Observable<Inspection> {
    return from(this.pb.collection(this.COLLECTION).create(data)).pipe(
      map(record => record as unknown as Inspection),
      catchError(this.handleError)
    );
  }

  // READ - Obtener todas las inspecciones
  getAllInspections(
    page: number = 1, 
    perPage: number = 50,
    sort: string = '-created',
    filter?: string
  ): Observable<{ items: Inspection[], totalItems: number, totalPages: number, page: number }> {
    return from(
      this.pb.collection(this.COLLECTION).getList(page, perPage, {
        sort,
        filter,
        $autoCancel: false
      })
    ).pipe(
      map(response => ({
        items: response.items as unknown as Inspection[],
        totalItems: response.totalItems,
        totalPages: response.totalPages,
        page: response.page
      })),
      catchError(this.handleError)
    );
  }

  // READ - Obtener inspección por ID
  getInspectionById(id: string): Observable<Inspection> {
    return from(this.pb.collection(this.COLLECTION).getOne(id)).pipe(
      map(record => record as unknown as Inspection),
      catchError(this.handleError)
    );
  }

  // READ - Buscar inspecciones por placa
  searchByPlaca(placa: string): Observable<Inspection[]> {
    return this.getAllInspections(1, 50, '-created', `placa~"${placa}"`).pipe(
      map(response => response.items)
    );
  }

  // READ - Obtener inspecciones por estado
  getInspectionsByEstado(estado: string): Observable<Inspection[]> {
    return this.getAllInspections(1, 100, '-created', `estado="${estado}"`).pipe(
      map(response => response.items)
    );
  }

  // UPDATE - Actualizar inspección
  updateInspection(id: string, data: UpdateInspectionDTO): Observable<Inspection> {
    return from(this.pb.collection(this.COLLECTION).update(id, data)).pipe(
      map(record => record as unknown as Inspection),
      catchError(this.handleError)
    );
  }

  // UPDATE - Cambiar estado de inspección
  updateEstado(id: string, estado: string): Observable<Inspection> {
    return this.updateInspection(id, { estado });
  }

  // DELETE - Eliminar inspección
  deleteInspection(id: string): Observable<boolean> {
    return from(this.pb.collection(this.COLLECTION).delete(id)).pipe(
      catchError(this.handleError)
    );
  }

  // DELETE - Eliminar múltiples inspecciones
  deleteMultipleInspections(ids: string[]): Observable<boolean[]> {
    const deleteObservables = ids.map(id => this.deleteInspection(id));
    return forkJoin(deleteObservables);
  }

  // Manejo de errores
  private handleError(error: any) {
    let errorMessage = 'Error desconocido';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error?.response) {
      // Error de PocketBase
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
    
    console.error('Error en InspectionBusetasService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  // Validaciones útiles
  validateInspectionData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validaciones básicas
    if (!data.nombre_transportadora) errors.push('Nombre de transportadora es requerido');
    if (!data.nombres_conductor) errors.push('Nombre del conductor es requerido');
    if (!data.identificacion) errors.push('Identificación es requerida');
    if (!data.telefono) errors.push('Teléfono es requerido');
    if (!data.placa) errors.push('Placa es requerida');
    if (!data.marca) errors.push('Marca es requerida');
    if (!data.modelo) errors.push('Modelo es requerido');
    if (data.kilometraje === undefined || data.kilometraje === null) errors.push('Kilometraje es requerido');
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Obtener estadísticas
  getStats(): Observable<any> {
    return this.getAllInspections(1, 1).pipe(
      map(response => ({
        total: response.totalItems,
        page: response.page,
        totalPages: response.totalPages
      }))
    );
  }
}