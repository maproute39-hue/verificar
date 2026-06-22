import { Injectable, OnDestroy } from '@angular/core';
import PocketBase, { RecordSubscription } from 'pocketbase';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Inspection } from '../models/inspection.model';
import Swal from 'sweetalert2';
export interface RealtimeEvent extends Omit<RecordSubscription<Inspection>, 'action'> {
    action: 'create' | 'update' | 'delete';
    record: Inspection;
}
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
interface CacheEntry {
    data: Inspection[];
    timestamp: number;
    complete?: boolean;
}
@Injectable({
    providedIn: 'root',
})
export class RealtimeInspectionsService implements OnDestroy {
    private pb: PocketBase;
    private readonly COLLECTION = 'inspections';
    private isSubscribed = false;
    private readonly CACHE_KEY = 'inspections_cache';
    private readonly CACHE_TTL_MS = 5 * 60 * 1000;
    private allInspectionsLoaded = false;
    private fullLoadPromise: Promise<Inspection[]> | null = null;
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
    private readCache(): Inspection[] | null {
        try {
            const raw = localStorage.getItem(this.CACHE_KEY);
            if (!raw)
                return null;
            const entry: CacheEntry = JSON.parse(raw);
            if (entry.complete === false)
                return null;
            const age = Date.now() - entry.timestamp;
            if (age > this.CACHE_TTL_MS) {
                localStorage.removeItem(this.CACHE_KEY);
                return null;
            }
            const sanitizedData = this.sanitizeListInspections(entry.data);
            try {
                localStorage.setItem(this.CACHE_KEY, JSON.stringify({ ...entry, data: sanitizedData }));
            }
            catch {
            }
            return sanitizedData;
        }
        catch {
            return null;
        }
    }
    private writeCache(data: Inspection[], complete: boolean = true): void {
        try {
            const entry: CacheEntry = {
                data: this.sanitizeListInspections(data),
                timestamp: Date.now(),
                complete,
            };
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(entry));
        }
        catch (e) {
            console.warn('[Cache] No se pudo escribir en localStorage:', e);
        }
    }
    invalidateCache(): void {
        localStorage.removeItem(this.CACHE_KEY);
        this.allInspectionsLoaded = false;
    }
    hasFullInspectionsCache(): boolean {
        if (this.allInspectionsLoaded && this.inspectionsSubject.value.length > 0)
            return true;
        return !!this.readCache();
    }
    hasFullInspectionsLoaded(): boolean {
        return this.allInspectionsLoaded && this.inspectionsSubject.value.length > 0;
    }
    isFullLoadInProgress(): boolean {
        return this.fullLoadPromise !== null;
    }
    getCurrentInspectionsSnapshot(): Inspection[] {
        return this.inspectionsSubject.value;
    }
    getCachedFullInspections(): Inspection[] | null {
        const cached = this.readCache();
        if (!cached || cached.length === 0)
            return null;
        this.allInspectionsLoaded = true;
        this.inspectionsSubject.next(cached);
        return cached;
    }
    cacheAge(): number | null {
        try {
            const raw = localStorage.getItem(this.CACHE_KEY);
            if (!raw)
                return null;
            const entry: CacheEntry = JSON.parse(raw);
            return Date.now() - entry.timestamp;
        }
        catch {
            return null;
        }
    }
    async deleteInspection(id: string): Promise<void> {
        try {
            await this.pb.collection(this.COLLECTION).delete(id);
            console.log(`[RealtimeInspectionsService] Inspección ${id} eliminada exitosamente`);
        }
        catch (error) {
            console.error('[RealtimeInspectionsService] Error al eliminar:', error);
            this.errorSubject.next(error instanceof Error ? error : new Error(String(error)));
            throw error;
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
            if (!this.pb.authStore.isValid) {
                const error = new Error('Autenticación requerida para suscripción realtime');
                console.warn('[RealtimeInspectionsService]', error.message);
                this.errorSubject.next(error);
                return;
            }
            this.pb.collection(this.COLLECTION).subscribe('*', (event: RecordSubscription<Inspection>) => {
                if (['create', 'update', 'delete'].includes(event.action)) {
                    const sanitizedRecord = this.sanitizeListInspection(event.record);
                    const mappedEvent: RealtimeEvent = {
                        ...event,
                        action: event.action as 'create' | 'update' | 'delete',
                        record: sanitizedRecord,
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
        }
        catch (error) {
            this.handleError(error as Error);
            throw error;
        }
    }
    unsubscribe(): void {
        try {
            this.pb.collection(this.COLLECTION).unsubscribe();
            this.isSubscribed = false;
            console.log('[RealtimeInspectionsService] ✗ Suscripción cancelada');
        }
        catch (error) {
            this.handleError(error as Error);
        }
    }
    private handleRealtimeEvent(event: RealtimeEvent): void {
        const currentInspections = this.inspectionsSubject.value;
        const sanitizedRecord = this.sanitizeListInspection(event.record);
        switch (event.action) {
            case 'create':
                const newList = [sanitizedRecord, ...currentInspections];
                this.inspectionsSubject.next(newList);
                if (this.allInspectionsLoaded) {
                    this.writeCache(newList);
                }
                else {
                    localStorage.removeItem(this.CACHE_KEY);
                }
                break;
            case 'update':
                const updatedList = currentInspections.map(insp => insp.id === sanitizedRecord.id ? sanitizedRecord : insp);
                this.inspectionsSubject.next(updatedList);
                if (this.allInspectionsLoaded) {
                    this.writeCache(updatedList);
                }
                else {
                    localStorage.removeItem(this.CACHE_KEY);
                }
                break;
            case 'delete':
                const filteredList = currentInspections.filter(insp => insp.id !== event.record.id);
                this.inspectionsSubject.next(filteredList);
                if (this.allInspectionsLoaded) {
                    this.writeCache(filteredList);
                }
                else {
                    localStorage.removeItem(this.CACHE_KEY);
                }
                console.log(`[Realtime] Inspección ${event.record.id} eliminada de la lista local`);
                break;
        }
    }
    async loadAllInspectionsBackground(sort: string = '-created'): Promise<Inspection[]> {
        if (this.allInspectionsLoaded && this.inspectionsSubject.value.length > 0) {
            return this.inspectionsSubject.value;
        }
        const cached = this.readCache();
        if (cached && cached.length > 0) {
            console.log(`[Cache] Usando caché con ${cached.length} inspecciones`);
            this.allInspectionsLoaded = true;
            this.inspectionsSubject.next(cached);
            return cached;
        }
        if (this.fullLoadPromise) {
            console.log('[RealtimeInspectionsService] Reutilizando carga completa en curso');
            return this.fullLoadPromise;
        }
        this.fullLoadPromise = (async () => {
            const records = await this.pb
                .collection(this.COLLECTION)
                .getFullList<Inspection>(800, {
                sort,
                fields: INSPECTION_LIST_FIELDS,
            });
            const sanitizedRecords = this.sanitizeListInspections(records);
            this.allInspectionsLoaded = true;
            this.inspectionsSubject.next(sanitizedRecords);
            this.writeCache(sanitizedRecords);
            console.log(`[RealtimeInspectionsService] Background: ${sanitizedRecords.length} inspecciones cargadas y cacheadas`);
            return sanitizedRecords;
        })();
        try {
            return await this.fullLoadPromise;
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
        finally {
            this.fullLoadPromise = null;
        }
    }
    async loadRecentInspections(limit: number = 10, sort: string = '-created'): Promise<{
        items: Inspection[];
        fromCache: boolean;
    }> {
        const cached = this.readCache();
        if (cached && cached.length > 0) {
            console.log(`[Cache] Recientes desde caché (${cached.length} total)`);
            this.allInspectionsLoaded = true;
            this.inspectionsSubject.next(cached);
            return { items: cached.slice(0, limit), fromCache: true };
        }
        try {
            this.loadingSubject.next(true);
            const response = await this.pb
                .collection(this.COLLECTION)
                .getList<Inspection>(1, limit, {
                sort,
                fields: INSPECTION_LIST_FIELDS,
            });
            const items = this.sanitizeListInspections(response.items);
            this.inspectionsSubject.next(items);
            this.allInspectionsLoaded = false;
            console.log(`[RealtimeInspectionsService] ${items.length} inspecciones recientes cargadas`);
            return { items, fromCache: false };
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
        finally {
            this.loadingSubject.next(false);
        }
    }
    async loadInspections(sort: string = '-created'): Promise<void> {
        const cached = this.getCachedFullInspections();
        if (cached && cached.length > 0) {
            console.log(`[Cache] Carga completa desde caché (${cached.length} inspecciones)`);
            return;
        }
        if (this.fullLoadPromise) {
            await this.fullLoadPromise;
            return;
        }
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
                        if (bar)
                            bar.style.width = `${progress}%`;
                        if (text)
                            text.innerText = `Cargando datos... ${progress}%`;
                        if (!Swal.isVisible())
                            clearInterval(interval);
                    }, 250);
                }
            });
            this.fullLoadPromise = this.pb
                .collection(this.COLLECTION)
                .getFullList<Inspection>(200, {
                sort,
                fields: INSPECTION_LIST_FIELDS,
            });
            const records = this.sanitizeListInspections(await this.fullLoadPromise);
            this.allInspectionsLoaded = true;
            this.inspectionsSubject.next(records);
            this.writeCache(records);
            const bar = document.getElementById('swal-progress-bar');
            const text = document.getElementById('swal-progress-text');
            if (bar)
                bar.style.width = '100%';
            if (text)
                text.innerText = `Listo. ${records.length} inspecciones cargadas.`;
            await new Promise(resolve => setTimeout(resolve, 500));
            Swal.close();
            console.log(`[RealtimeInspectionsService] Cargadas ${records.length} inspecciones`);
        }
        catch (error) {
            Swal.fire({
                title: 'Error al cargar',
                text: 'No se pudieron cargar las inspecciones desde el servidor.',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
            this.handleError(error);
            throw error;
        }
        finally {
            this.fullLoadPromise = null;
            this.loadingSubject.next(false);
        }
    }
    async getInspectionsPaginated(page: number = 1, perPage: number = 50, sort: string = '-created', filter?: string): Promise<{
        items: Inspection[];
        totalItems: number;
        totalPages: number;
    }> {
        try {
            const response = await this.pb.collection(this.COLLECTION).getList(page, perPage, {
                sort,
                filter,
                fields: INSPECTION_LIST_FIELDS,
            });
            return {
                items: this.sanitizeListInspections(response.items as Inspection[]),
                totalItems: response.totalItems,
                totalPages: response.totalPages
            };
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    async getInspectionById(id: string): Promise<Inspection> {
        try {
            const record = await this.pb.collection(this.COLLECTION).getOne<Inspection>(id);
            return record;
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    unsubscribeAll(): void {
        try {
            this.pb.collection(this.COLLECTION).unsubscribe();
            this.isSubscribed = false;
            console.log('[RealtimeInspectionsService] ✗ Suscripciones eliminadas');
        }
        catch (error) {
            this.handleError(error);
        }
    }
    isCurrentlySubscribed(): boolean {
        return this.isSubscribed;
    }
    async authenticate(email: string, password: string): Promise<void> {
        try {
            await this.pb.collection('users').authWithPassword(email, password);
            console.log('[RealtimeInspectionsService] ✓ Autenticación exitosa');
        }
        catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    logout(): void {
        this.unsubscribeAll();
        this.pb.authStore.clear();
        this.inspectionsSubject.next([]);
        this.allInspectionsLoaded = false;
        this.fullLoadPromise = null;
        console.log('[RealtimeInspectionsService] ✓ Sesión cerrada');
    }
    isAuthenticated(): boolean {
        return this.pb.authStore.isValid;
    }
    getCurrentUser() {
        return this.pb.authStore.model;
    }
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
