import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RealtimeInspectionsService } from '../../services/inspections-realtime';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Inspection } from '../../models/inspection.model';
import { SharedService } from '../../services/shared.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, RouterLink],
  standalone: true,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  // Propiedades de ordenamiento
  sortField: string = 'fecha_vigencia';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Datos
  inspections: Inspection[] = [];
  totalInspections: number = 0;
  currentMonthInspections: number = 0;
  
  // Contadores de vencimientos
  expiringSoonCount: number = 0;
  expiredCount: number = 0;
  
  // Contadores de documentos críticos
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

  constructor(
    public RealtimeInspectionsService: RealtimeInspectionsService,
    private router: Router,
    public sharedService: SharedService,
    
    private route: ActivatedRoute,
      private cdr: ChangeDetectorRef  // ✅ Agregar esto

  ) { }

  // ✅ GETTER que se reevalúa automáticamente cuando cambian los datos
  get sortedInspections(): Inspection[] {
    if (!this.inspections || !Array.isArray(this.inspections) || this.inspections.length === 0) {
      return [];
    }

    const sorted = [...this.inspections];
    
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
    return diffDays >= 0 && diffDays <= 7;
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
    
    if (diffDays < 0) {
      return 'bg-danger-subtle text-danger';
    } else if (diffDays <= 7) {
      return 'bg-warning-subtle text-warning';
    } else if (diffDays <= 30) {
      return 'bg-info-subtle text-info';
    }
    return 'bg-success-subtle text-success';
  }

  async openSearch(): Promise<void> {
    const allInspections = await firstValueFrom(this.RealtimeInspectionsService.inspections$);

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
            resultsContainer.innerHTML = `
            <div style="padding: 12px; color: #666;">Escribe una placa para buscar.</div>
          `;
            return;
          }

          const matches = allInspections.filter((inspection) =>
            (inspection.placa || '').toLowerCase().includes(normalized)
          );

          if (matches.length === 0) {
            resultsContainer.innerHTML = `
            <div style="padding: 12px; color: #999;">
              No se encontraron inspecciones con esa placa.
            </div>
          `;
            return;
          }

          resultsContainer.innerHTML = matches.map((inspection) => `
          <div class="search-result-card" style="
            border: 1px solid #e9ecef;
            border-radius: 10px;
            background: #fff;
            padding: 12px;
            margin-bottom: 10px;
          ">
            <div style="display:flex; justify-content:space-between; gap:10px; align-items:start; flex-wrap:wrap;">
              <div>
                <div style="font-weight:700; font-size:15px; color:#0d6efd;">
                  ${inspection.placa || 'Sin placa'}
                </div>
                <div style="font-size:14px; color:#333; margin-top:4px;">
                  <strong>Conductor:</strong> ${inspection.nombres_conductor || 'Sin nombre'}
                </div>
                <div style="font-size:14px; color:#333;">
                  <strong>ID:</strong> ${inspection.identificacion || 'Sin identificación'}
                </div>
                <div style="font-size:13px; color:#666;">
                  <strong>Estado:</strong> ${inspection.estado || 'borrador'}
                </div>
              </div>

              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button 
                  class="swal-detail-btn btn btn-sm btn-outline-primary" 
                  data-id="${inspection.id}">
                  Ver detalle
                </button>
                <button 
                  class="swal-heredar-btn btn btn-sm btn-primary" 
                  data-id="${inspection.id}">
                  Nueva heredada
                </button>
              </div>
            </div>
          </div>
        `).join('');

          resultsContainer.querySelectorAll('.swal-detail-btn').forEach((btn) => {
            btn.addEventListener('click', (event: Event) => {
              const target = event.currentTarget as HTMLElement;
              const id = target.getAttribute('data-id');
              if (!id) return;

              Swal.close();
              this.viewInspection(id);
            });
          });

          resultsContainer.querySelectorAll('.swal-heredar-btn').forEach((btn) => {
            btn.addEventListener('click', (event: Event) => {
              const target = event.currentTarget as HTMLElement;
              const id = target.getAttribute('data-id');
              const selected = matches.find(x => x.id === id);

              if (!selected) return;

              Swal.close();
              this.createInheritedInspection(selected);
            });
          });
        };

        input.addEventListener('input', () => {
          renderResults(input.value);
        });
      }
    });
  }

  createInheritedInspection(inspection: Inspection): void {
    this.router.navigate(['/heredada'], {
      state: {
        inheritedInspection: inspection
      }
    });
  }

  viewInspection(id: string | undefined): void {
    if (!id) {
      console.warn('No se proporcionó un ID de inspección');
      return;
    }
    this.router.navigate(['/detail', id]);
  }

  pending() {
    Swal.fire({
      title: 'Opcion por implementar',
      text: 'Se implementara en el despliegue final',
      icon: 'warning',
    })
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
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.RealtimeInspectionsService.deleteInspection(id).then(() => {
          Swal.fire('¡Eliminado!', 'La inspección ha sido eliminada.', 'success');
        }).catch(error => {
          console.error('Error al eliminar la inspección:', error);
          Swal.fire('Error', 'No se pudo eliminar la inspección', 'error');
        });
      }
    });
  }

  formatPhone(phone: string | undefined | null): string {
    if (!phone || phone.trim() === '') {
      return 'Sin teléfono';
    }
    
    const clean = phone.replace(/\D/g, '');
    
    if (clean.length === 0) {
      return 'Sin teléfono';
    }
    
    if (clean.length === 10) {
      return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)} ${clean.slice(6)}`;
    }
    
    if (clean.length === 7) {
      return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
    }
    
    if (clean.length === 12 && clean.startsWith('57')) {
      const without57 = clean.slice(2);
      return `(${without57.slice(0, 3)}) ${without57.slice(3, 6)} ${without57.slice(6)}`;
    }
    
    return phone;
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  ngOnInit(): void {
    this.sharedService.currentRoute = this.route.snapshot.url[0].path;
    console.log(this.sharedService.currentRoute);
    this.currentRoute = this.router.url.split('/')[1] || '';
    
    this.initializeData();
  }

private initializeData(): void {
  this.RealtimeInspectionsService.inspections$.subscribe({
    next: (data) => {
      // ✅ UNA SOLA ASIGNACIÓN
      this.inspections = Array.isArray(data) ? data : [];
      this.totalInspections = this.inspections.length;
      
      this.currentMonthInspections = this.inspections.filter((inspection) => {
        if (!inspection.fecha_inspeccion) return false;

        const inspectionDate = new Date(inspection.fecha_inspeccion);
        const currentDate = new Date();

        return inspectionDate.getMonth() === currentDate.getMonth() &&
          inspectionDate.getFullYear() === currentDate.getFullYear();
      }).length;

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      this.expiredCount = this.inspections.filter(inspection => {
        if (!inspection.fecha_vigencia) return false;
        const vencimiento = new Date(inspection.fecha_vigencia);
        return vencimiento < hoy;
      }).length;

      this.expiringSoonCount = this.inspections.filter(inspection => {
        if (!inspection.fecha_vigencia) return false;
        const vencimiento = new Date(inspection.fecha_vigencia);
        const diffDays = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
      }).length;

      this.soatExpiredCount = this.countExpiredDocuments(this.inspections, 'fecha_vencimiento_soat');
      this.soatExpiringCount = this.countExpiringDocuments(this.inspections, 'fecha_vencimiento_soat', 30);
      
      this.tecnomecanicaExpiredCount = this.countExpiredDocuments(this.inspections, 'fecha_vencimiento_revision_tecnomecanica');
      this.tecnomecanicaExpiringCount = this.countExpiringDocuments(this.inspections, 'fecha_vencimiento_revision_tecnomecanica', 30);
      
      this.tarjetaOperacionExpiredCount = this.countExpiredDocuments(this.inspections, 'fecha_vencimiento_tarjeta_operacion');
      this.tarjetaOperacionExpiringCount = this.countExpiringDocuments(this.inspections, 'fecha_vencimiento_tarjeta_operacion', 30);
      
      this.licenciaExpiredCount = this.countExpiredDocuments(this.inspections, 'licencia_vencimiento');
      this.licenciaExpiringCount = this.countExpiringDocuments(this.inspections, 'licencia_vencimiento', 30);

      // ✅ FORZAR DETECCIÓN DE CAMBIOS
      this.cdr.detectChanges();
    },
    error: (error) => {
      console.error('Error al cargar inspecciones:', error);
    }
  });
}

  private countExpiredDocuments(data: Inspection[], campo: string): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return data.filter(inspection => {
      const fecha = (inspection as any)[campo];
      if (!fecha) return false;
      const vencimiento = new Date(fecha);
      return vencimiento < hoy;
    }).length;
  }

  private countExpiringDocuments(data: Inspection[], campo: string, dias: number): number {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    return data.filter(inspection => {
      const fecha = (inspection as any)[campo];
      if (!fecha) return false;
      const vencimiento = new Date(fecha);
      const diffDays = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= dias;
    }).length;
  }
}