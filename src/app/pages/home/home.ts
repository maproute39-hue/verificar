import { Component, OnInit } from '@angular/core';
import { RealtimeInspectionsService } from '../../services/inspections-realtime';
import { CommonModule } from '@angular/common';
import { Router,ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Inspection } from '../../models/inspection.model';
import { SharedService } from '../../services/shared.service';
import { firstValueFrom } from 'rxjs';
@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterModule, RouterLink], standalone: true,

  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  approvedCount: number = 0;
  rejectedCount: number = 0;
  inspections: Inspection[] = [];
  totalInspections: number = 0;
  currentMonthInspections: number = 0;
  filteredInspections: Inspection[] = [];

  currentRoute: string = '';
  constructor(
    public RealtimeInspectionsService: RealtimeInspectionsService,
    private router: Router,
    public sharedService: SharedService,
    private route: ActivatedRoute  
  ) { }
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
  // this.router.navigate(['/heredada'], {
  //   state: {
  //     inheritedInspection: {
  //       sourceInspectionId: inspection.id,
  //       placa: inspection.placa || '',
  //       nombres_conductor: inspection.nombres_conductor || '',
  //       identificacion: inspection.identificacion || ''
  //     }
  //   }
  // });
  
this.router.navigate(['/heredada'], {
  state: {
    inheritedInspection: inspection
  }
});
}
  /**
   * Navega a la página de detalle de una inspección
   * @param id Identificador único de la inspección
   */
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

  /**
   * Elimina una inspección después de confirmación
   * @param id Identificador único de la inspección a eliminar
   */
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
          Swal.fire(
            '¡Eliminado!',
            'La inspección ha sido eliminada.',
            'success'
          );
        }).catch(error => {
          console.error('Error al eliminar la inspección:', error);
          Swal.fire(
            'Error',
            'No se pudo eliminar la inspección',
            'error'
          );
        });
      }
    });
  }
  formatPhone(phone: string | undefined | null): string {
  // ✅ Manejar todos los casos
  if (!phone || phone.trim() === '') {
    return 'Sin teléfono';
  }
  
  // Limpiar el número (quitar todo lo que no sea dígito)
  const clean = phone.replace(/\D/g, '');
  
  // Si está vacío después de limpiar
  if (clean.length === 0) {
    return 'Sin teléfono';
  }
  
  // Formato colombiano móvil: (300) 123 4567
  if (clean.length === 10) {
    return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)} ${clean.slice(6)}`;
  }
  
  // Teléfono fijo: (123) 4567
  if (clean.length === 7) {
    return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
  }
  
  // Si tiene el 57 al inicio (12 dígitos)
  if (clean.length === 12 && clean.startsWith('57')) {
    const without57 = clean.slice(2);
    return `(${without57.slice(0, 3)}) ${without57.slice(3, 6)} ${without57.slice(6)}`;
  }
  
  // Retornar original si no coincide
  return phone;
}

  /**
   * Detiene la propagación del evento para evitar que se active el click en la fila
   * @param event Evento del DOM
   */
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
    // Suscribirse a los datos del servicio
    this.RealtimeInspectionsService.inspections$.subscribe({
      next: (data) => {
        this.inspections = data;
        this.totalInspections = data.length; // Actualiza el contador
        this.currentMonthInspections = data.filter((inspection) => {
          if (!inspection.fecha_inspeccion) return false; // Si no hay fecha, no la contamos

          const inspectionDate = new Date(inspection.fecha_inspeccion);
          const currentDate = new Date();

          return inspectionDate.getMonth() === currentDate.getMonth() &&
            inspectionDate.getFullYear() === currentDate.getFullYear();
        }).length;
      },
      error: (error) => {
        console.error('Error al cargar inspecciones:', error);
      }
    });
  }
}
