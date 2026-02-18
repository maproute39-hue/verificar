import { Injectable } from '@angular/core';
import { Observable, from, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Inspection, CreateInspectionDTO, UpdateInspectionDTO } from '../models/inspection.model';
import PocketBase from 'pocketbase';

@Injectable({
  providedIn: 'root'
})
export class InspectionService {
  public pb: PocketBase;
  private readonly COLLECTION = 'inspections';
  
  constructor() {
    this.pb = new PocketBase('https://db.buckapi.site:8095');
  }
  // async uploadImage(file: File, metadata?: {
  //   type?: string;
  //   inspectionId?: string;
  //   userId?: string;
  //   description?: string;
  // }): Promise<string> {
  //   try {
  //     // Preparar datos del record en la colección 'images'
  //     const formData = new FormData();
  //     formData.append('image', file); // 'image' debe coincidir con el campo file en PocketBase
      
  //     // Campos adicionales opcionales
  //     if (metadata?.type) formData.append('type', metadata.type);
  //     if (metadata?.inspectionId) formData.append('inspection_id', metadata.inspectionId);
  //     // if (metadata?.userId) formData.append('user_id', metadata.userId);
  //     if (metadata?.description) formData.append('description', metadata.description);
  //     // formData.append('uploaded_at', new Date().toISOString());

  //     // Crear el record en la colección 'images'
  //     const record = await this.pb.collection('images').create(formData);
      
  //     // Retornar el ID de la imagen subida
  //     return record.id;
      
  //   } catch (error: any) {
  //     console.error('Error al subir imagen:', error);
  //     throw new Error(error.message || 'Error al subir la imagen');
  //   }
  // }
async uploadImage(file: File, metadata?: any): Promise<string> {
  try {
    const data: any = {
      image: file, // ← Solo el archivo
    };

    console.log('📤 Subiendo imagen:', file.name);
    console.log('📦 Datos:', data);

    const record = await this.pb.collection('images').create(data);
    
    console.log('✅ Imagen subida con ID:', record.id);
    return record.id;
    
  } catch (error: any) {
    console.error('❌ Error al subir imagen:', error);
    console.error('Response:', error.response);
    console.error('Data:', error.data);
    throw new Error(error.message || 'Error al subir la imagen');
  }
}
  // === MÉTODO PARA SUBIR MÚLTIPLES IMÁGENES ===
  
  async uploadMultipleImages(files: File[], metadata?: any): Promise<string[]> {
    const uploadedIds: string[] = [];
    
    for (const file of files) {
      try {
        const imageId = await this.uploadImage(file, metadata);
        uploadedIds.push(imageId);
      } catch (error) {
        console.warn(`Falló al subir ${file.name}:`, error);
        // Opcional: decidir si continuar o lanzar error
        // throw error; // Descomenta si quieres que falle todo si una imagen falla
      }
    }
    
    return uploadedIds;
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
// inspection.service.ts

// // Método para obtener URL de una imagen
// getImageUrl(collectionId: string, recordId: string, filename: string, thumb: string = '0x0'): string {
//   // thumb: '0x0' = tamaño original, '100x100' = thumbnail, etc.
//   return `${this.pb.baseUrl}/api/files/${collectionId}/${recordId}/${filename}?thumb=${thumb}`;
// }
// Método para obtener URL de una imagen
getImageUrl(collectionId: string, recordId: string, filename: string, thumb: string = '0x0'): string {
  return `${this.pb.baseUrl}/api/files/${collectionId}/${recordId}/${filename}?thumb=${thumb}`;
}

// Método para obtener inspección con imágenes expandidas
getInspectionWithImages(id: string): Observable<any> {
  return from(
    this.pb.collection(this.COLLECTION).getOne(id, {
      expand: 'images' // Esto expande la relación
    })
  ).pipe(
    map(record => record as unknown as any),
    catchError(this.handleError)
  );
}

// Método para obtener URLs de imágenes desde un array de IDs
async getImageUrls(imageIds: string[]): Promise<string[]> {
  if (!imageIds || imageIds.length === 0) return [];
  
  const urls: string[] = [];
  const collectionId = '5bjt6wpqfj0rnsl'; // ID de la colección 'images'
  
  for (const imageId of imageIds) {
    try {
      const record = await this.pb.collection('images').getOne(imageId);
      // El campo 'image' contiene el filename
      const filename = record['image'];
      const url = this.getImageUrl(collectionId, imageId, filename);
      urls.push(url);
    } catch (error) {
      console.error(`Error al obtener imagen ${imageId}:`, error);
    }
  }
  
  return urls;
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
    
    console.error('Error en InspectionService:', errorMessage, error);
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