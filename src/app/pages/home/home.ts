import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { RealtimeInspectionsService } from '../../services/inspections-realtime';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Inspection } from '../../models/inspection.model';
import { SharedService } from '../../services/shared.service';
import { firstValueFrom, Subscription } from 'rxjs';
type ViewMode = 'recent' | 'all' | 'expiry-issues';
@Component({
    selector: 'app-home',
    imports: [CommonModule, RouterModule],
    standalone: true,
    templateUrl: './home.html',
    styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
    sortField: string = 'fecha_vigencia';
    sortDirection: 'asc' | 'desc' = 'asc';
    viewMode: ViewMode = 'recent';
    recentInspections: Inspection[] = [];
    allInspections: Inspection[] = [];
    expiryIssueInspections: Inspection[] = [];
    allInspectionsLoaded: boolean = false;
    currentPage: number = 1;
    pageSize: number = 20;
    totalInspections: number = 0;
    currentMonthInspections: number = 0;
    expiringSoonCount: number = 0;
    expiredCount: number = 0;
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
    constructor(public RealtimeInspectionsService: RealtimeInspectionsService, private router: Router, public sharedService: SharedService, private route: ActivatedRoute, private cdr: ChangeDetectorRef) { }
    private sortList(list: Inspection[]): Inspection[] {
        if (!list || list.length === 0)
            return [];
        const sorted = [...list];
        sorted.sort((a, b) => {
            let valueA = (a as any)[this.sortField];
            let valueB = (b as any)[this.sortField];
            if (!valueA && !valueB)
                return 0;
            if (!valueA)
                return 1;
            if (!valueB)
                return -1;
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
            if (strA < strB)
                return this.sortDirection === 'asc' ? -1 : 1;
            if (strA > strB)
                return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }
    get sortedRecentInspections(): Inspection[] {
        return this.sortList(this.recentInspections);
    }
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
    get sortedExpiryIssues(): Inspection[] {
        return this.sortList(this.expiryIssueInspections);
    }
    sortBy(field: string): void {
        if (this.sortField === field) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        }
        else {
            this.sortField = field;
            this.sortDirection = 'asc';
        }
    }
    isSortedBy(field: string): boolean {
        return this.sortField === field;
    }
    goToPage(page: number): void {
        if (page < 1 || page > this.totalPages)
            return;
        this.currentPage = page;
        this.cdr.detectChanges();
    }
    isExpired(fecha: string | undefined): boolean {
        if (!fecha)
            return false;
        const vencimiento = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return vencimiento < hoy;
    }
    isExpiringSoon(fecha: string | undefined): boolean {
        if (!fecha)
            return false;
        const vencimiento = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
    }
    getDaysUntilExpiry(fecha: string | undefined): number | null {
        if (!fecha)
            return null;
        const vencimiento = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    }
    getDocumentStatusClass(fecha: string | undefined): string {
        if (!fecha)
            return 'bg-secondary-subtle text-secondary';
        const vencimiento = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0)
            return 'bg-danger-subtle text-danger';
        if (diffDays <= 7)
            return 'bg-warning-subtle text-warning';
        if (diffDays <= 30)
            return 'bg-info-subtle text-info';
        return 'bg-success-subtle text-success';
    }
    private getInspectionDateTime(inspection: Inspection): number {
        const candidates = [
            inspection.fecha_inspeccion,
            inspection.created,
            inspection.updated,
        ];
        for (const value of candidates) {
            if (!value)
                continue;
            const time = new Date(value).getTime();
            if (!Number.isNaN(time))
                return time;
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
    showAll(): void {
        this.viewMode = 'all';
        this.currentPage = 1;
        this.sortField = 'numero_certificado';
        this.sortDirection = 'desc';
        this.cdr.detectChanges();
    }
    showRecent(): void {
        this.viewMode = 'recent';
        this.sortField = 'fecha_vigencia';
        this.sortDirection = 'asc';
        this.cdr.detectChanges();
    }
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
                if (!val)
                    return false;
                const diff = new Date(val).getTime() - hoy.getTime();
                return diff < threshold30;
            });
        });
        this.viewMode = 'expiry-issues';
        this.cdr.detectChanges();
    }
    getExpiryAlerts(insp: Inspection): {
        label: string;
        diff: number;
    }[] {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fields: {
            campo: string;
            label: string;
        }[] = [
            { campo: 'fecha_vencimiento_soat', label: 'SOAT' },
            { campo: 'fecha_vencimiento_revision_tecnomecanica', label: 'Tecnomecánica' },
            { campo: 'fecha_vencimiento_tarjeta_operacion', label: 'Tarjeta operación' },
            { campo: 'licencia_vencimiento', label: 'Licencia conducción' },
        ];
        const alerts: {
            label: string;
            diff: number;
        }[] = [];
        for (const { campo, label } of fields) {
            const val = (insp as any)[campo];
            if (!val)
                continue;
            const diff = Math.ceil((new Date(val).getTime() - hoy.getTime()) / 86400000);
            if (diff < 30) {
                alerts.push({ label, diff });
            }
        }
        return alerts;
    }
    ngOnInit(): void {
        this.sharedService.currentRoute = this.route.snapshot.url[0].path;
        this.currentRoute = this.router.url.split('/')[1] || '';
        this.initializeData();
    }
    private async initializeData(): Promise<void> {
        try {
            const sub = this.RealtimeInspectionsService.inspections$.subscribe({
                next: (data) => {
                    const list = Array.isArray(data) ? data : [];
                    if (list.length === 0)
                        return;
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
                    }
                    else {
                        this.currentMonthInspections = list.filter((i) => {
                            if (!i.fecha_inspeccion)
                                return false;
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
            }
            else {
                this._loadAllBackground();
            }
        }
        catch (error) {
            console.error('Error en initializeData:', error);
        }
    }
    private _fullDataAvailable = false;
    private async _loadAllBackground(): Promise<void> {
        try {
            this._fullDataAvailable = true;
            const all = await this.RealtimeInspectionsService.loadAllInspectionsBackground('-created');
            this.allInspections = all;
            this.allInspectionsLoaded = true;
            this._computeStats(all);
            this.cdr.detectChanges();
        }
        catch (error) {
            console.error('Error cargando inspecciones en segundo plano:', error);
        }
    }
    private _computeStats(data: Inspection[]): void {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const latestInspections = this.getLatestInspectionsByPlate(data);
        this.currentMonthInspections = data.filter((inspection) => {
            if (!inspection.fecha_inspeccion)
                return false;
            const d = new Date(inspection.fecha_inspeccion);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        this.expiredCount = latestInspections.filter((i) => {
            if (!i.fecha_vigencia)
                return false;
            return new Date(i.fecha_vigencia) < hoy;
        }).length;
        this.expiringSoonCount = latestInspections.filter((i) => {
            if (!i.fecha_vigencia)
                return false;
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
            if (!fecha)
                return false;
            return new Date(fecha) < hoy;
        }).length;
    }
    private countExpiringDocuments(data: Inspection[], campo: string, dias: number): number {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        return data.filter((inspection) => {
            const fecha = (inspection as any)[campo];
            if (!fecha)
                return false;
            const diff = Math.ceil((new Date(fecha).getTime() - hoy.getTime()) / 86400000);
            return diff >= 0 && diff <= dias;
        }).length;
    }
    private escapeHtml(value: string | number | undefined | null): string {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    private normalizePlate(plate: string | undefined | null): string {
        return (plate || '').trim().toUpperCase();
    }
    private formatSearchDate(fecha: string | undefined): string {
        if (!fecha)
            return 'Sin fecha';
        const date = new Date(fecha);
        if (Number.isNaN(date.getTime()))
            return 'Sin fecha';
        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    }
    private getExpiryBadgeLabel(fecha: string | undefined): string {
        if (!fecha)
            return 'Sin fecha';
        if (this.isExpired(fecha))
            return 'Vencido';
        if (this.isExpiringSoon(fecha))
            return 'Próximo a vencer';
        return 'Vigente';
    }
    private getExpiryBadgeHtml(label: string, fecha: string | undefined): string {
        const status = this.getExpiryBadgeLabel(fecha);
        const statusClass = this.getDocumentStatusClass(fecha);
        const dateText = this.formatSearchDate(fecha);
        return `
      <span class="search-result-chip badge ${statusClass}" title="${this.escapeHtml(dateText)}">
        <span>${this.escapeHtml(label)}</span>
        <strong>${this.escapeHtml(status)}</strong>
      </span>
    `;
    }
    private getInspectionStatusBadgeHtml(status: string | undefined): string {
        const normalized = (status || 'borrador').trim().toLowerCase();
        const label = status || 'borrador';
        const badgeClass = normalized === 'aprobada' || normalized === 'aprbada'
            ? 'bg-success-subtle text-success'
            : normalized === 'rechazada'
                ? 'bg-danger-subtle text-danger'
                : 'bg-secondary-subtle text-secondary';
        return `<span class="search-result-status badge ${badgeClass}">${this.escapeHtml(label)}</span>`;
    }
    private countInspectionsByPlate(inspections: Inspection[], plate: string | undefined): number {
        const normalizedPlate = this.normalizePlate(plate);
        if (!normalizedPlate)
            return 0;
        return inspections.filter((inspection) => this.normalizePlate(inspection.placa) === normalizedPlate).length;
    }
    private getLatestInspectionForPlate(inspections: Inspection[], plate: string | undefined): Inspection | null {
        const normalizedPlate = this.normalizePlate(plate);
        if (!normalizedPlate)
            return null;
        return inspections
            .filter((inspection) => this.normalizePlate(inspection.placa) === normalizedPlate)
            .sort((a, b) => this.getInspectionDateTime(b) - this.getInspectionDateTime(a))[0] || null;
    }
    private buildSearchResultHtml(inspection: Inspection, source: Inspection[], isLatestForPlate: boolean): string {
        const plate = this.normalizePlate(inspection.placa);
        const historicalCount = this.countInspectionsByPlate(source, inspection.placa);
        const phone = inspection.telefono || '';
        const formattedPhone = this.formatPhone(phone);
        const hasPhone = phone.replace(/\D/g, '').length > 0;
        const latestBadge = isLatestForPlate
            ? '<span class="search-result-latest badge bg-primary-subtle text-primary">Más reciente</span>'
            : '';
        const whatsappButton = hasPhone
            ? `<button class="search-result-action swal-whatsapp-btn btn btn-sm btn-outline-success" data-phone="${this.escapeHtml(phone)}">WhatsApp</button>`
            : '';
        const copyPlateButton = plate
            ? `<button class="search-result-action swal-copy-plate-btn btn btn-sm btn-outline-secondary" data-plate="${this.escapeHtml(plate)}">Copiar placa</button>`
            : '';
        return `
      <article class="search-result-card">
        <div class="search-result-header">
          <div class="search-result-title">
            <div class="search-result-plate-row">
              <div class="search-result-plate">${this.escapeHtml(plate || 'Sin placa')}</div>
              ${latestBadge}
            </div>
            <div class="search-result-cert">Cert. ${this.escapeHtml(inspection.numero_certificado || 'Sin certificado')}</div>
          </div>
          ${this.getInspectionStatusBadgeHtml(inspection.estado)}
        </div>

        <div class="search-result-grid">
          <div class="search-result-column">
            <div class="search-result-item">
              <span class="search-result-label">Conductor</span>
              <strong class="search-result-value">${this.escapeHtml(inspection.nombres_conductor || 'Sin nombre')}</strong>
            </div>
            <div class="search-result-item">
              <span class="search-result-label">Identificación</span>
              <strong class="search-result-value">${this.escapeHtml(inspection.identificacion || 'Sin identificación')}</strong>
            </div>
          </div>
          <div class="search-result-column">
            <div class="search-result-item">
              <span class="search-result-label">Teléfono</span>
              <strong class="search-result-value">${this.escapeHtml(formattedPhone)}</strong>
            </div>
            <div class="search-result-item">
              <span class="search-result-label">Fecha insp.</span>
              <strong class="search-result-value">${this.escapeHtml(this.formatSearchDate(inspection.fecha_inspeccion))}</strong>
            </div>
          </div>
          <div class="search-result-column">
            <div class="search-result-item">
              <span class="search-result-label">Vigencia</span>
              <strong class="search-result-value">${this.escapeHtml(this.formatSearchDate(inspection.fecha_vigencia))}</strong>
            </div>
            <div class="search-result-item">
              <span class="search-result-label">Históricas</span>
              <strong class="search-result-value">${historicalCount}</strong>
            </div>
          </div>
        </div>

        <div class="search-result-footer">
          <div class="search-result-chips">
            ${this.getExpiryBadgeHtml('Vigencia', inspection.fecha_vigencia)}
            ${this.getExpiryBadgeHtml('SOAT', inspection.fecha_vencimiento_soat)}
            ${this.getExpiryBadgeHtml('Tecno', inspection.fecha_vencimiento_revision_tecnomecanica)}
            ${this.getExpiryBadgeHtml('Tarjeta', inspection.fecha_vencimiento_tarjeta_operacion)}
            ${this.getExpiryBadgeHtml('Licencia', inspection.licencia_vencimiento)}
          </div>
          <div class="search-result-actions">
          <button class="search-result-action swal-detail-btn btn btn-sm btn-outline-primary" data-id="${this.escapeHtml(inspection.id)}">Ver detalle</button>
          <button class="search-result-action swal-heredar-btn btn btn-sm btn-primary" data-id="${this.escapeHtml(inspection.id)}">Nueva heredada</button>
          ${whatsappButton}
          ${copyPlateButton}
          </div>
        </div>
      </article>
    `;
    }
    private buildSearchGroupTitle(plate: string, source: Inspection[]): string {
        const title = plate === 'SIN_PLACA' ? 'Sin placa' : plate;
        return `
      <div class="search-result-group-title">
        <span>${this.escapeHtml(title)}</span>
        <span class="badge bg-light text-dark border">${this.countInspectionsByPlate(source, plate)} inspecciones</span>
      </div>
    `;
    }
    private buildGroupedSearchResultsHtml(matches: Inspection[], source: Inspection[]): string {
        const grouped = new Map<string, Inspection[]>();
        for (const inspection of matches) {
            const plate = this.normalizePlate(inspection.placa) || 'SIN_PLACA';
            grouped.set(plate, [...(grouped.get(plate) || []), inspection]);
        }
        return [...grouped.entries()]
            .sort(([, inspectionsA], [, inspectionsB]) => {
            const latestA = [...inspectionsA].sort((a, b) => this.getInspectionDateTime(b) - this.getInspectionDateTime(a))[0];
            const latestB = [...inspectionsB].sort((a, b) => this.getInspectionDateTime(b) - this.getInspectionDateTime(a))[0];
            return this.getInspectionDateTime(latestB) - this.getInspectionDateTime(latestA);
        })
            .map(([plate, inspections]) => {
            const sortedInspections = [...inspections].sort((a, b) => this.getInspectionDateTime(b) - this.getInspectionDateTime(a));
            const latest = this.getLatestInspectionForPlate(source, plate);
            return `
          <section class="search-result-group">
            ${this.buildSearchGroupTitle(plate, source)}
            ${sortedInspections.map((inspection) => this.buildSearchResultHtml(inspection, source, !!latest && inspection.id === latest.id)).join('')}
          </section>
        `;
        })
            .join('');
    }
    private openWhatsapp(phone: string): void {
        const clean = phone.replace(/\D/g, '');
        if (!clean)
            return;
        const phoneWithCountry = clean.length === 10 ? `57${clean}` : clean;
        window.open(`https://wa.me/${phoneWithCountry}`, '_blank', 'noopener,noreferrer');
    }
    private async copyPlateToClipboard(plate: string): Promise<void> {
        if (!plate)
            return;
        try {
            await navigator.clipboard.writeText(plate);
        }
        catch {
            const textArea = document.createElement('textarea');
            textArea.value = plate;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }
    async openSearch(): Promise<void> {
        const source = this.allInspectionsLoaded
            ? this.allInspections
            : await firstValueFrom(this.RealtimeInspectionsService.inspections$);
        await Swal.fire({
            title: 'Buscar por placa',
            customClass: {
                popup: 'search-modal',
            },
            html: `
      <div class="search-modal-content">
        <input id="swal-plate-search" class="swal2-input search-modal-input" placeholder="Ej: ABC123">
        <div id="swal-search-results" class="search-modal-results">
          <div class="search-modal-empty">Escribe una placa para buscar.</div>
        </div>
      </div>
    `,
            width: 960,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Cerrar',
            didOpen: () => {
                const input = document.getElementById('swal-plate-search') as HTMLInputElement | null;
                const resultsContainer = document.getElementById('swal-search-results');
                if (!input || !resultsContainer)
                    return;
                const renderResults = (term: string) => {
                    const normalized = term.trim().toLowerCase();
                    if (!normalized) {
                        resultsContainer.innerHTML = `<div class="search-modal-empty">Escribe una placa para buscar.</div>`;
                        return;
                    }
                    const matches = source.filter((inspection) => (inspection.placa || '').toLowerCase().includes(normalized));
                    if (matches.length === 0) {
                        resultsContainer.innerHTML = `<div class="search-modal-empty">No se encontraron inspecciones con esa placa.</div>`;
                        return;
                    }
                    resultsContainer.innerHTML = this.buildGroupedSearchResultsHtml(matches, source);
                    resultsContainer.querySelectorAll('.swal-detail-btn').forEach((btn) => {
                        btn.addEventListener('click', (event: Event) => {
                            const id = (event.currentTarget as HTMLElement).getAttribute('data-id');
                            if (!id)
                                return;
                            Swal.close();
                            this.viewInspection(id);
                        });
                    });
                    resultsContainer.querySelectorAll('.swal-heredar-btn').forEach((btn) => {
                        btn.addEventListener('click', (event: Event) => {
                            const id = (event.currentTarget as HTMLElement).getAttribute('data-id');
                            const selected = matches.find((x) => x.id === id);
                            if (!selected)
                                return;
                            Swal.close();
                            this.createInheritedInspection(selected);
                        });
                    });
                    resultsContainer.querySelectorAll('.swal-whatsapp-btn').forEach((btn) => {
                        btn.addEventListener('click', (event: Event) => {
                            const phone = (event.currentTarget as HTMLElement).getAttribute('data-phone');
                            if (!phone)
                                return;
                            this.openWhatsapp(phone);
                        });
                    });
                    resultsContainer.querySelectorAll('.swal-copy-plate-btn').forEach((btn) => {
                        btn.addEventListener('click', async (event: Event) => {
                            const button = event.currentTarget as HTMLButtonElement;
                            const plate = button.getAttribute('data-plate');
                            if (!plate)
                                return;
                            await this.copyPlateToClipboard(plate);
                            button.textContent = 'Copiada';
                            setTimeout(() => {
                                button.textContent = 'Copiar placa';
                            }, 1200);
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
        if (!phone || phone.trim() === '')
            return 'Sin teléfono';
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 0)
            return 'Sin teléfono';
        if (clean.length === 10)
            return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)} ${clean.slice(6)}`;
        if (clean.length === 7)
            return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
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
