import { Injectable, OnDestroy } from '@angular/core';
import PocketBase, { RecordSubscription } from 'pocketbase';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Inspection } from '../models/inspection.model';
import Swal from 'sweetalert2';

export interface RealtimeEvent extends Omit<RecordSubscription<Inspection>, 'action'> {
  action: 'create' | 'update' | 'delete';
  record: Inspection;
}

/** Estructura guardada en localStorage */
interface CacheEntry {
  data: Inspection[];
  timestamp: number; // ms epoch
}

@Injectable({
  providedIn: 'root',
})
export class RealtimeInspectionsService implements OnDestroy {
  private pb: PocketBase;
  private readonly COLLECTION = 'inspections';
  private isSubscribed = false;

  // ── Caché localStorage ───────────────────────────────────────────────────────
  private readonly CACHE_KEY = 'inspections_cache';
  /** Tiempo de vida del caché en milisegundos (5 minutos) */
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  // ── Subjects ─────────────────────────────────────────────────────────────────
  private inspectionsSubject = new BehaviorSubject<Inspection[]>([]);
  public inspections$: Observable<Inspection[]> = this.inspectionsSubject.asObservable();

  private eventsSubject = new Subject<RealtimeEvent>();
  public events$: Observable<RealtimeEvent> = this.eventsSubject.asObservable();

  private errorSubject = new Subject<Error>();
  public errors$: Observable<Error> = this.errorSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public get isLoading$(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }

  // ── Métodos de caché ─────────────────────────────────────────────────────────

  /** Lee el caché; retorna null si no existe o está expirado */
  private readCache(): Inspection[] | null {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (!raw) return null;
      const entry: CacheEntry = JSON.parse(raw);
      const age = Date.now() - entry.timestamp;
      if (age > this.CACHE_TTL_MS) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  /** Guarda la lista en localStorage con timestamp */
  private writeCache(data: Inspection[]): void {
    try {
      const entry: CacheEntry = { data, timestamp: Date.now() };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(entry));
    } catch (e) {
      // localStorage puede fallar en modo privado o si está lleno; ignorar silenciosamente
      console.warn('[Cache] No se pudo escribir en localStorage:', e);
    }
  }

  /** Invalida el caché (llamado al crear, actualizar o eliminar) */
  invalidateCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  /** Cuántos ms hace que se cargó el caché; null si no hay caché */
  cacheAge(): number | null {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (!raw) return null;
      const entry: CacheEntry = JSON.parse(raw);
      return Date.now() - entry.timestamp;
    } catch {
      return null;
    }
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
    // Solo activa la suscripción realtime; la carga de datos la inicia el componente
    this.subscribe(false);
  }

async subscribe(autoLoad: boolean = false): Promise<void> {
if (this.isSubscribed) {
  console.log('[RealtimeInspectionsService] Ya está suscrito');

  if (autoLoad && this.inspectionsSubject.value.length === 0) {
    await this.loadInspections();
  }

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
      const newList = [event.record, ...currentInspections];
      this.inspectionsSubject.next(newList);
      this.writeCache(newList);
      break;

    case 'update':
      const updatedList = currentInspections.map(insp =>
        insp.id === event.record.id ? event.record : insp
      );
      this.inspectionsSubject.next(updatedList);
      this.writeCache(updatedList);
      break;

    case 'delete':
      const filteredList = currentInspections.filter(insp => insp.id !== event.record.id);
      this.inspectionsSubject.next(filteredList);
      this.writeCache(filteredList);
      console.log(`[Realtime] Inspección ${event.record.id} eliminada de la lista local`);
      break;
  }
}
  /**
   * Cargar todas las inspecciones en segundo plano sin mostrar modal Swal.
   * Si hay caché válido lo usa directamente; si no, va al servidor.
   */
  async loadAllInspectionsBackground(sort: string = '-created'): Promise<Inspection[]> {
    // Intentar desde caché primero
    const cached = this.readCache();
    if (cached && cached.length > 0) {
      console.log(`[Cache] Usando caché con ${cached.length} inspecciones`);
      this.inspectionsSubject.next(cached);
      return cached;
    }

    // Sin caché válido: pedir al servidor
    try {
      const records = await this.pb
        .collection(this.COLLECTION)
        .getFullList<Inspection>(800, { sort });

      this.inspectionsSubject.next(records);
      this.writeCache(records);
      console.log(`[RealtimeInspectionsService] Background: ${records.length} inspecciones cargadas y cacheadas`);
      return records;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * Cargar las N inspecciones más recientes (carga inicial rápida).
   * Si hay caché válido, toma los primeros N registros del caché.
   * Retorna { items, fromCache } para que el componente sepa si ya tiene el set completo.
   */
  async loadRecentInspections(
    limit: number = 10,
    sort: string = '-created'
  ): Promise<{ items: Inspection[]; fromCache: boolean }> {
    // Intentar desde caché primero
    const cached = this.readCache();
    if (cached && cached.length > 0) {
      console.log(`[Cache] Recientes desde caché (${cached.length} total)`);
      this.inspectionsSubject.next(cached); // publicar el set completo
      return { items: cached.slice(0, limit), fromCache: true };
    }

    // Sin caché: pedir solo los N al servidor
    try {
      this.loadingSubject.next(true);
      const response = await this.pb
        .collection(this.COLLECTION)
        .getList<Inspection>(1, limit, { sort });

      this.inspectionsSubject.next(response.items);
      console.log(`[RealtimeInspectionsService] ${response.items.length} inspecciones recientes cargadas`);
      return { items: response.items, fromCache: false };
    } catch (error) {
      this.handleError(error);
      throw error;
    } finally {
      this.loadingSubject.next(false);
    }
  }

  /**
   * Cargar lista completa de inspecciones
   */
 async loadInspections(sort: string = '-created'): Promise<void> {
  try {
    this.loadingSubject.next(true);

    Swal.fire({
      title: 'Cargando inspecciones',
      html: `
        <p>Estamos consultando el servidor...</p>
        <div style="width:100%; background:#eee; border-radius:12px; overflow:hidden;">
          <div id="swal-progress-bar" style="
            width:0%;
            height:10px;
            background:#1eb41e;
            transition:width .3s ease;
          "></div>
        </div>
        <small id="swal-progress-text">Preparando conexión...</small>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();

        let progress = 0;
        const interval = setInterval(() => {
          progress = Math.min(progress + 8, 90);

          const bar = document.getElementById('swal-progress-bar');
          const text = document.getElementById('swal-progress-text');

          if (bar) bar.style.width = `${progress}%`;
          if (text) text.innerText = `Cargando datos... ${progress}%`;

          if (!Swal.isVisible()) clearInterval(interval);
        }, 250);
      }
    });

    const records = await this.pb
      .collection(this.COLLECTION)
      .getFullList<Inspection>(200, { sort });

    this.inspectionsSubject.next(records);

    const bar = document.getElementById('swal-progress-bar');
    const text = document.getElementById('swal-progress-text');

    if (bar) bar.style.width = '100%';
    if (text) text.innerText = `Listo. ${records.length} inspecciones cargadas.`;

    await new Promise(resolve => setTimeout(resolve, 500));

    Swal.close();

    console.log(`[RealtimeInspectionsService] Cargadas ${records.length} inspecciones`);

  } catch (error) {
    Swal.fire({
      title: 'Error al cargar',
      text: 'No se pudieron cargar las inspecciones desde el servidor.',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });

    this.handleError(error);
    throw error;

  } finally {
    this.loadingSubject.next(false);
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