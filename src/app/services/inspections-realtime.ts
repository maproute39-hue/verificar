import { Injectable, OnDestroy } from '@angular/core';
import PocketBase, { RecordSubscription } from 'pocketbase';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Inspection } from '../models/inspection.model';

// Actualizamos la interfaz para extender de RecordSubscription
export interface RealtimeEvent extends Omit<RecordSubscription<Inspection>, 'action'> {
  action: 'create' | 'update' | 'delete';
  record: Inspection;
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeInspectionsService implements OnDestroy {
  private pb: PocketBase;
  private readonly COLLECTION = 'inspections';
  private isSubscribed = false;
  
  // Subject para la lista completa de inspecciones
  private inspectionsSubject = new BehaviorSubject<Inspection[]>([]);
  public inspections$: Observable<Inspection[]> = this.inspectionsSubject.asObservable();
  
  // Subject para eventos en tiempo real individuales
  private eventsSubject = new Subject<RealtimeEvent>();
  public events$: Observable<RealtimeEvent> = this.eventsSubject.asObservable();
  
  // Subject para errores
  private errorSubject = new Subject<Error>();
  public errors$: Observable<Error> = this.errorSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);

  public get isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  /**
   * Elimina una inspección por su ID
   * @param id ID de la inspección a eliminar
   * @returns Promesa que se resuelve cuando se completa la eliminación
   */
  // public async deleteInspection(id: string): Promise<boolean> {
  //   try {
  //     await this.pb.collection(this.COLLECTION).delete(id);
  //     return true;
  //   } catch (error) {
  //     console.error('Error al eliminar la inspección:', error);
  //     throw error;
  //   }
  // }


/**
 * Elimina una inspección por su ID
 * @param id ID de la inspección a eliminar (record.id de PocketBase)
 * @returns Promesa que se resuelve cuando se completa la eliminación
 */
async deleteInspection(id: string): Promise<void> {
  try {
    // ✅ 1. Eliminar en PocketBase
    await this.pb.collection(this.COLLECTION).delete(id);
    
    // ✅ 2. NO actualizar manualmente la lista aquí
    // El evento realtime 'delete' se encargará de actualizar inspectionsSubject
    // a través de handleRealtimeEvent(), evitando duplicados
    
    console.log(`[RealtimeInspectionsService] Inspección ${id} eliminada exitosamente`);
    
  } catch (error) {
    console.error('[RealtimeInspectionsService] Error al eliminar:', error);
    this.errorSubject.next(error instanceof Error ? error : new Error(String(error)));
    throw error; // Propagar el error para que el componente lo maneje
  }
}


  constructor() {
    this.pb = new PocketBase('https://db.buckapi.site:8095');
    
    this.pb.authStore.onChange((token, model) => {
      if (!token && this.isSubscribed) {
        console.warn('[RealtimeInspectionsService] Sesión expirada, suscripciones pausadas');
        this.unsubscribeAll();
      }
    });
    this.subscribe();
  }

async subscribe(autoLoad: boolean = true): Promise<void> {
  if (this.isSubscribed) {
    console.log('[RealtimeInspectionsService] Ya está suscrito');
    return;
  }

  try {
    // ✅ Validación estricta de autenticación
    if (!this.pb.authStore.isValid) {
      const error = new Error('Autenticación requerida para suscripción realtime');
      console.warn('[RealtimeInspectionsService]', error.message);
      this.errorSubject.next(error);
      return;
    }

    // ✅ Suscribirse a eventos realtime
    this.pb.collection(this.COLLECTION).subscribe('*', (event: RecordSubscription<Inspection>) => {
      if (['create', 'update', 'delete'].includes(event.action)) {
        const mappedEvent: RealtimeEvent = {
          ...event,
          action: event.action as 'create' | 'update' | 'delete'
        };
        console.log('[Realtime] Evento recibido:', mappedEvent.action, mappedEvent.record.id);
        this.eventsSubject.next(mappedEvent);
        this.handleRealtimeEvent(mappedEvent);
      }
    });

    this.isSubscribed = true;
    console.log('[RealtimeInspectionsService] ✓ Suscripción activa');

    if (autoLoad) {
      await this.loadInspections();
    }
  } catch (error) {
    this.handleError(error as Error);
    throw error;
  }
}

// ✅ Método para cancelar suscripción manualmente (útil para testing o logout)
unsubscribe(): void {
  try {
    this.pb.collection(this.COLLECTION).unsubscribe();
    this.isSubscribed = false;
    console.log('[RealtimeInspectionsService] ✗ Suscripción cancelada');
  } catch (error) {
    this.handleError(error as Error);
  }
}
  /**
   * Manejar eventos en tiempo real
   */
/**
 * Manejar eventos en tiempo real
 */
private handleRealtimeEvent(event: RealtimeEvent): void {
  const currentInspections = this.inspectionsSubject.value;

  switch (event.action) {
    case 'create':
      // Agregar al inicio (más reciente primero)
      this.inspectionsSubject.next([event.record, ...currentInspections]);
      break;

    case 'update':
      // Buscar y actualizar el registro usando event.record.id (estándar PocketBase)
      const updatedList = currentInspections.map(insp =>
        insp.id === event.record.id ? event.record : insp
      );
      this.inspectionsSubject.next(updatedList);
      break;

    case 'delete':
      // ✅ Eliminar usando event.record.id (NO id_inspeccion)
      this.inspectionsSubject.next(
        currentInspections.filter(insp => insp.id !== event.record.id)
      );
      console.log(`[Realtime] Inspección ${event.record.id} eliminada de la lista local`);
      break;
  }
}
  /**
   * Cargar lista completa de inspecciones
   */
  async loadInspections(sort: string = '-created'): Promise<void> {
    try {
      const records = await this.pb
        .collection(this.COLLECTION)
        .getFullList<Inspection>(200, { sort });
      
      console.log(`[RealtimeInspectionsService] Cargadas ${records.length} inspecciones`);
      this.inspectionsSubject.next(records);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Obtener inspecciones con paginación
   */
  async getInspectionsPaginated(
    page: number = 1,
    perPage: number = 50,
    sort: string = '-created',
    filter?: string
  ): Promise<{ items: Inspection[], totalItems: number, totalPages: number }> {
    try {
      const response = await this.pb.collection(this.COLLECTION).getList(page, perPage, {
        sort,
        filter
      });
      
      return {
        items: response.items as Inspection[],
        totalItems: response.totalItems,
        totalPages: response.totalPages
      };
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Obtener una inspección por ID
   */
  async getInspectionById(id: string): Promise<Inspection> {
    try {
      const record = await this.pb.collection(this.COLLECTION).getOne<Inspection>(id);
      return record;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Desuscribirse de todos los eventos
   */
  unsubscribeAll(): void {
    try {
      this.pb.collection(this.COLLECTION).unsubscribe();
      this.isSubscribed = false;
      console.log('[RealtimeInspectionsService] ✗ Suscripciones eliminadas');
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Verificar si está suscrito actualmente
   */
  isCurrentlySubscribed(): boolean {
    return this.isSubscribed;
  }

  /**
   * Autenticar usuario (deberías hacer esto desde un servicio de autenticación)
   */
  async authenticate(email: string, password: string): Promise<void> {
    try {
      await this.pb.collection('users').authWithPassword(email, password);
      console.log('[RealtimeInspectionsService] ✓ Autenticación exitosa');
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.unsubscribeAll();
    this.pb.authStore.clear();
    this.inspectionsSubject.next([]);
    console.log('[RealtimeInspectionsService] ✓ Sesión cerrada');
  }

  /**
   * Verificar si hay usuario autenticado
   */
  isAuthenticated(): boolean {
    return this.pb.authStore.isValid;
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser() {
    return this.pb.authStore.model;
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(error: any): void {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[RealtimeInspectionsService] Error:', err);
    this.errorSubject.next(err);
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
    this.inspectionsSubject.complete();
    this.eventsSubject.complete();
    this.errorSubject.complete();
  }
}