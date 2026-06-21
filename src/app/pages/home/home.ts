import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { RealtimeInspectionsService } from '../../services/inspections-realtime';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Inspection } from '../../models/inspection.model';
import { SharedService } from '../../services/shared.service';
import { firstValueFrom, Subscription } from 'rxjs';

/** Modos de visualización de la tabla */
type ViewMode = 'recent' | 'all' | 'expiry-issues';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule],
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  // ── Ordenamiento ─────────────────────────────────────────────────────────────
  sortField: string = 'fecha_vigencia';
  sortDirection: 'asc' | 'desc' = 'asc';

  // ── Estado de la vista ───────────────────────────────────────────────────────
  viewMode: ViewMode = 'recent';

  /** Las 10 inspecciones más recientes (primer render) */
  recentInspections: Inspection[] = [];

  /** Todas las inspecciones descargadas en segundo plano */
  allInspections: Inspection[] = [];

  /** Inspecciones con problemas de vigencia (modo filtro) */
  expiryIssueInspections: Inspection[] = [];

  /** Indica si las inspecciones completas ya están disponibles */
  allInspectionsLoaded: boolean = false;

  // ── Paginación ───────────────────────────────────────────────────────────────
  currentPage: number = 1;
  pageSize: number = 20;

  // ── Estadísticas ─────────────────────────────────────────────────────────────
  totalInspections: number = 0;
  currentMonthInspections: number = 0;

  // ── Contadores de vencimientos ───────────────────────────────────────────────
  expiringSoonCount: number = 0;
  expiredCount: number = 0;

  // ── Contadores de documentos críticos ────────────────────────────────────────
  soatExpiredCount: number = 0;
  soatExpiringCount: number = 0;
  tecnomecanicaExpiredCount: number = 0;
  tecnomecanicaExpiringCount: number = 0;
  tarjetaOperacionExpiredCount: number = 0;
  tarjetaOperacionExpiringCount: number = 0;
  licenciaExpiredCount: number = 0;
  licenciaExpiringCount: number = 0;

  Math = Math;
  currentRoute: string = '';

  private subscriptions = new Subscription();

  constructor(
    public RealtimeInspectionsService: RealtimeInspectionsService,
    private router: Router,
    public sharedService: SharedService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  // ── Helpers de ordenamiento ──────────────────────────────────────────────────

  private sortList(list: Inspection[]): Inspection[] {
    if (!list || list.length === 0) return [];
    const sorted = [...list];
    sorted.sort((a, b) => {
      let valueA = (a as any)[this.sortField];
      let valueB = (b as any)[this.sortField];

      if (!valueA && !valueB) return 0;
      if (!valueA) return 1;
      if (!valueB) return -1;

      if (this.sortField.includes('fecha') || this.sortField === 'licencia_vencimiento') {
        const dateA = new Date(valueA).getTime();
        const dateB = new Date(valueB).getTime();
        return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return this.sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
      }

      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();
      if (strA < strB) return this.sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  /** Lista mostrada en modo "recientes" (10) */
  get sortedRecentInspections(): Inspection[] {
    return this.sortList(this.recentInspections);
  }

  /** Página actual del modo "ver todas" */
  get pagedInspections(): Inspection[] {
    const sorted = this.sortList(this.allInspections);
    const start = (this.currentPage - 1) * this.pageSize;
    return sorted.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.allInspections.length / this.pageSize);
  }

  get pagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  /** Lista del modo "problemas de vigencia" */
  get sortedExpiryIssues(): Inspection[] {
    return this.sortList(this.expiryIssueInspections);
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  }

  isSortedBy(field: string): boolean {
    return this.sortField === field;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.cdr.detectChanges();
  }

  // ── Métodos de fechas ────────────────────────────────────────────────────────

  isExpired(fecha: string | undefined): boolean {
    if (!fecha) return false;
    const vencimiento = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return vencimiento < hoy;
  }

  isExpiringSoon(fecha: string | undefined): boolean {
    if (!fecha) return false;
    const vencimiento = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }

  getDaysUntilExpiry(fecha: string | undefined): number | null {
    if (!fecha) return null;
    const vencimiento = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDocumentStatusClass(fecha: string | undefined): string {
    if (!fecha) return 'bg-secondary-subtle text-secondary';
    const vencimiento = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'bg-danger-subtle text-danger';
    if (diffDays <= 7) return 'bg-warning-subtle text-warning';
    if (diffDays <= 30) return 'bg-info-subtle text-info';
    return 'bg-success-subtle text-success';
  }

  private getInspectionDateTime(inspection: Inspection): number {
    const candidates = [
      inspection.fecha_inspeccion,
      inspection.created,
      inspection.updated,
    ];

    for (const value of candidates) {
      if (!value) continue;
      const time = new Date(value).getTime();
      if (!Number.isNaN(time)) return time;
    }

    return 0;
  }

  getLatestInspectionsByPlate(inspections: Inspection[]): Inspection[] {
    const latestByPlate = new Map<string, Inspection>();
    const withoutPlate: Inspection[] = [];

    for (const inspection of inspections) {
      const plate = (inspection.placa || '').trim().toUpperCase();

      if (!plate) {
        withoutPlate.push(inspection);
        continue;
      }

      const current = latestByPlate.get(plate);
      if (!current || this.getInspectionDateTime(inspection) > this.getInspectionDateTime(current)) {
        latestByPlate.set(plate, inspection);
      }
    }

    return [...latestByPlate.values(), ...withoutPlate];
  }

  // ── Modos de vista ───────────────────────────────────────────────────────────

  /** Cambiar a modo "ver todas" con paginación */
/** Cambiar a modo "ver todas" con paginación */
showAll(): void {
  this.viewMode = 'all';
  this.currentPage = 1;
  // Ordenar por número de certificado
  this.sortField = 'numero_certificado';
  this.sortDirection = 'desc';
  this.cdr.detectChanges();
}

  /** Volver al listado de las 10 recientes */
  showRecent(): void {
    this.viewMode = 'recent';
      this.sortField = 'fecha_vigencia';
  this.sortDirection = 'asc';
    this.cdr.detectChanges();
  }

  /**
   * Filtrar y mostrar únicamente inspecciones con problemas de vigencia.
   * Incluye: fecha_vigencia vencida/próxima a vencer Y documentos críticos
   * vencidos/próximos a vencer.
   */
  showExpiryIssues(): void {
    const source = this.allInspectionsLoaded ? this.allInspections : this.recentInspections;
    const latestInspections = this.getLatestInspectionsByPlate(source);

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const threshold30 = 30 * 24 * 60 * 60 * 1000;

    const criticalFields = [
      'fecha_vigencia',
      'fecha_vencimiento_soat',
      'fecha_vencimiento_revision_tecnomecanica',
      'fecha_vencimiento_tarjeta_operacion',
      'licencia_vencimiento',
    ];

    this.expiryIssueInspections = latestInspections.filter((insp) => {
      return criticalFields.some((campo) => {
        const val = (insp as any)[campo];
        if (!val) return false;
        const diff = new Date(val).getTime() - hoy.getTime();
        return diff < threshold30;
      });
    });

    this.viewMode = 'expiry-issues';
    this.cdr.detectChanges();
  }

  /**
   * Devuelve alertas únicamente de documentos críticos (NO de fecha_vigencia,
   * que ya se muestra con color y texto en la celda de Vigencia).
   * Usado en el modo expiry-issues para informar qué documento específico tiene el problema.
   */
  getExpiryAlerts(insp: Inspection): { label: string; diff: number }[] {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fields: { campo: string; label: string }[] = [
      { campo: 'fecha_vencimiento_soat',                   label: 'SOAT' },
      { campo: 'fecha_vencimiento_revision_tecnomecanica', label: 'Tecnomecánica' },
      { campo: 'fecha_vencimiento_tarjeta_operacion',      label: 'Tarjeta operación' },
      { campo: 'licencia_vencimiento',                     label: 'Licencia conducción' },
    ];

    const alerts: { label: string; diff: number }[] = [];

    for (const { campo, label } of fields) {
      const val = (insp as any)[campo];
      if (!val) continue;
      const diff = Math.ceil((new Date(val).getTime() - hoy.getTime()) / 86400000);
      if (diff < 30) {
        alerts.push({ label, diff });
      }
    }

    return alerts;
  }

  // ── Inicialización ───────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.sharedService.currentRoute = this.route.snapshot.url[0].path;
    this.currentRoute = this.router.url.split('/')[1] || '';
    this.initializeData();
  }

  private async initializeData(): Promise<void> {
    try {
      // 1. Suscribirse PRIMERO
      const sub = this.RealtimeInspectionsService.inspections$.subscribe({
        next: (data) => {
          const list = Array.isArray(data) ? data : [];
          if (list.length === 0) return;

          const sortedByDate = [...list].sort((a, b) => {
            const da = new Date((a as any)['created'] || '').getTime();
            const db = new Date((b as any)['created'] || '').getTime();
            return db - da;
          });

          this.recentInspections = sortedByDate.slice(0, 10);
          this.totalInspections = list.length;

          if (this._fullDataAvailable || this.RealtimeInspectionsService.hasFullInspectionsLoaded()) {
            this.allInspections = list;
            this.allInspectionsLoaded = true;
            this._computeStats(list);
          } else {
            // Solo recientes: no actualizar contadores del alert aún
            this.currentMonthInspections = list.filter((i) => {
              if (!i.fecha_inspeccion) return false;
              const d = new Date(i.fecha_inspeccion);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length;
          }

          this.cdr.detectChanges();
        },
        error: (error) => console.error('Error al cargar inspecciones:', error),
      });
      this.subscriptions.add(sub);

      // 2. Cargar datos iniciales
      const cachedFullInspections = this.RealtimeInspectionsService.getCachedFullInspections();
      if (cachedFullInspections && cachedFullInspections.length > 0) {
        this._fullDataAvailable = true;
        this.allInspections = cachedFullInspections;
        this.allInspectionsLoaded = true;
        this._computeStats(cachedFullInspections);
        this.cdr.detectChanges();
        return;
      }

      if (this.RealtimeInspectionsService.isFullLoadInProgress()) {
        await this._loadAllBackground();
        return;
      }

      const { fromCache } = await this.RealtimeInspectionsService.loadRecentInspections(10, '-created');

      if (fromCache) {
        this._fullDataAvailable = true;
        this.allInspections = this.RealtimeInspectionsService.getCurrentInspectionsSnapshot();
        this.allInspectionsLoaded = true;
        this._computeStats(this.allInspections);
        this.cdr.detectChanges();
      } else {
        this._loadAllBackground();
      }

    } catch (error) {
      console.error('Error en initializeData:', error);
    }
  }

  /** Flag interno: indica que el próximo emit del BehaviorSubject es el set completo */
  private _fullDataAvailable = false;

  private async _loadAllBackground(): Promise<void> {
    try {
      this._fullDataAvailable = true;
      const all = await this.RealtimeInspectionsService.loadAllInspectionsBackground('-created');
      // El emit ya ocurrió en loadAllInspectionsBackground vía inspectionsSubject.next()
      // pero forzamos aquí también por si la suscripción no disparó cdr
      this.allInspections = all;
      this.allInspectionsLoaded = true;
      this._computeStats(all);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error cargando inspecciones en segundo plano:', error);
    }
  }

  private _computeStats(data: Inspection[]): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const latestInspections = this.getLatestInspectionsByPlate(data);

    this.currentMonthInspections = data.filter((inspection) => {
      if (!inspection.fecha_inspeccion) return false;
      const d = new Date(inspection.fecha_inspeccion);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    this.expiredCount = latestInspections.filter((i) => {
      if (!i.fecha_vigencia) return false;
      return new Date(i.fecha_vigencia) < hoy;
    }).length;

    this.expiringSoonCount = latestInspections.filter((i) => {
      if (!i.fecha_vigencia) return false;
      const diff = Math.ceil((new Date(i.fecha_vigencia).getTime() - hoy.getTime()) / 86400000);
      return diff >= 0 && diff <= 30;
    }).length;

    this.soatExpiredCount = this.countExpiredDocuments(latestInspections, 'fecha_vencimiento_soat');
    this.soatExpiringCount = this.countExpiringDocuments(latestInspections, 'fecha_vencimiento_soat', 30);
    this.tecnomecanicaExpiredCount = this.countExpiredDocuments(latestInspections, 'fecha_vencimiento_revision_tecnomecanica');
    this.tecnomecanicaExpiringCount = this.countExpiringDocuments(latestInspections, 'fecha_vencimiento_revision_tecnomecanica', 30);
    this.tarjetaOperacionExpiredCount = this.countExpiredDocuments(latestInspections, 'fecha_vencimiento_tarjeta_operacion');
    this.tarjetaOperacionExpiringCount = this.countExpiringDocuments(latestInspections, 'fecha_vencimiento_tarjeta_operacion', 30);
    this.licenciaExpiredCount = this.countExpiredDocuments(latestInspections, 'licencia_vencimiento');
    this.licenciaExpiringCount = this.countExpiringDocuments(latestInspections, 'licencia_vencimiento', 30);
  }

  private countExpiredDocuments(data: Inspection[], campo: string): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return data.filter((inspection) => {
      const fecha = (inspection as any)[campo];
      if (!fecha) return false;
      return new Date(fecha) < hoy;
    }).length;
  }

  private countExpiringDocuments(data: Inspection[], campo: string, dias: number): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return data.filter((inspection) => {
      const fecha = (inspection as any)[campo];
      if (!fecha) return false;
      const diff = Math.ceil((new Date(fecha).getTime() - hoy.getTime()) / 86400000);
      return diff >= 0 && diff <= dias;
    }).length;
  }

  // ── Acciones ─────────────────────────────────────────────────────────────────

  async openSearch(): Promise<void> {
    const source = this.allInspectionsLoaded
      ? this.allInspections
      : await firstValueFrom(this.RealtimeInspectionsService.inspections$);

    await Swal.fire({
      title: 'Buscar por placa',
      html: `
      <div class="text-start">
        <input id="swal-plate-search" class="swal2-input" placeholder="Ej: ABC123" style="margin: 0 auto 1rem auto;">
        <div id="swal-search-results" style="
          max-height: 350px;
          overflow-y: auto;
          text-align: left;
          border: 1px solid #eee;
          border-radius: 10px;
          padding: 8px;
          background: #fafafa;
        ">
          <div style="padding: 12px; color: #666;">Escribe una placa para buscar.</div>
        </div>
      </div>
    `,
      width: 800,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      didOpen: () => {
        const input = document.getElementById('swal-plate-search') as HTMLInputElement | null;
        const resultsContainer = document.getElementById('swal-search-results');
        if (!input || !resultsContainer) return;

        const renderResults = (term: string) => {
          const normalized = term.trim().toLowerCase();
          if (!normalized) {
            resultsContainer.innerHTML = `<div style="padding: 12px; color: #666;">Escribe una placa para buscar.</div>`;
            return;
          }
          const matches = source.filter((inspection) =>
            (inspection.placa || '').toLowerCase().includes(normalized)
          );
          if (matches.length === 0) {
            resultsContainer.innerHTML = `<div style="padding: 12px; color: #999;">No se encontraron inspecciones con esa placa.</div>`;
            return;
          }
          resultsContainer.innerHTML = matches.map((inspection) => `
          <div style="border:1px solid #e9ecef;border-radius:10px;background:#fff;padding:12px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:start;flex-wrap:wrap;">
              <div>
                <div style="font-weight:700;font-size:15px;color:#0d6efd;">${inspection.placa || 'Sin placa'}</div>
                <div style="font-size:14px;color:#333;margin-top:4px;"><strong>Conductor:</strong> ${inspection.nombres_conductor || 'Sin nombre'}</div>
                <div style="font-size:14px;color:#333;"><strong>ID:</strong> ${inspection.identificacion || 'Sin identificación'}</div>
                <div style="font-size:13px;color:#666;"><strong>Estado:</strong> ${inspection.estado || 'borrador'}</div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="swal-detail-btn btn btn-sm btn-outline-primary" data-id="${inspection.id}">Ver detalle</button>
                <button class="swal-heredar-btn btn btn-sm btn-primary" data-id="${inspection.id}">Nueva heredada</button>
              </div>
            </div>
          </div>`).join('');

          resultsContainer.querySelectorAll('.swal-detail-btn').forEach((btn) => {
            btn.addEventListener('click', (event: Event) => {
              const id = (event.currentTarget as HTMLElement).getAttribute('data-id');
              if (!id) return;
              Swal.close();
              this.viewInspection(id);
            });
          });
          resultsContainer.querySelectorAll('.swal-heredar-btn').forEach((btn) => {
            btn.addEventListener('click', (event: Event) => {
              const id = (event.currentTarget as HTMLElement).getAttribute('data-id');
              const selected = matches.find((x) => x.id === id);
              if (!selected) return;
              Swal.close();
              this.createInheritedInspection(selected);
            });
          });
        };
        input.addEventListener('input', () => renderResults(input.value));
      },
    });
  }

  createInheritedInspection(inspection: Inspection): void {
    this.router.navigate(['/heredada'], { state: { inheritedInspection: inspection } });
  }

  viewInspection(id: string | undefined): void {
    if (!id) {
      console.warn('No se proporcionó un ID de inspección');
      return;
    }
    this.router.navigate(['/detail', id]);
  }

  pending(): void {
    Swal.fire({
      title: 'Opcion por implementar',
      text: 'Se implementara en el despliegue final',
      icon: 'warning',
    });
  }

  deleteInspection(id: string | undefined): void {
    if (!id) {
      console.warn('No se proporcionó un ID de inspección para eliminar');
      return;
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.RealtimeInspectionsService.deleteInspection(id)
          .then(() => Swal.fire('¡Eliminado!', 'La inspección ha sido eliminada.', 'success'))
          .catch((error) => {
            console.error('Error al eliminar la inspección:', error);
            Swal.fire('Error', 'No se pudo eliminar la inspección', 'error');
          });
      }
    });
  }

  formatPhone(phone: string | undefined | null): string {
    if (!phone || phone.trim() === '') return 'Sin teléfono';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 0) return 'Sin teléfono';
    if (clean.length === 10) return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)} ${clean.slice(6)}`;
    if (clean.length === 7) return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
    if (clean.length === 12 && clean.startsWith('57')) {
      const without57 = clean.slice(2);
      return `(${without57.slice(0, 3)}) ${without57.slice(3, 6)} ${without57.slice(6)}`;
    }
    return phone;
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
