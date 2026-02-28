import { Component, OnInit,NgZone } from '@angular/core';
import { RealtimeInspectionsService } from '../../services/inspections-realtime';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Inspection } from '../../models/inspection.model';
import Swal from 'sweetalert2';
import { SharedService } from '../../services/shared.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-inspections',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './inspections.html',
  styleUrl: './inspections.scss',
})
export class Inspections implements OnInit {
  inspections: Inspection[] = [];
  totalInspections: number = 0;
  currentMonthInspections: number = 0;
  filteredInspections: Inspection[] = [];
  searchTerm: string = '';

  constructor(
      private ngZone: NgZone,  // ✅ Agregar esto
 private cdr: ChangeDetectorRef,
    public realtimeInspectionsService: RealtimeInspectionsService,
    private router: Router,
    public sharedService: SharedService,
    private route: ActivatedRoute
  ) { }

ngOnInit(): void {
  this.sharedService.currentRoute = this.route.snapshot.url[0].path;
  console.log(this.sharedService.currentRoute);
  
  // ✅ 1. Suscribirse a eventos realtime (esto también carga datos si autoLoad=true)
  this.realtimeInspectionsService.subscribe(true).catch(error => {
    console.error('Error al suscribirse a realtime:', error);
  });
  
  // ✅ 2. Inicializar la suscripción a la lista de inspecciones
  this.initializeData();
}
pending(){
  Swal.fire({
    title: 'Opcion por implementar',
    text: 'Se implementara en el despliegue final',
    icon: 'warning',

  })
}
private initializeData(): void {
  this.realtimeInspectionsService.inspections$.subscribe({
    next: (data) => {
      // ✅ Ejecutar dentro de Angular's zone para activar change detection
      this.ngZone.run(() => {
        this.inspections = data;
        this.filteredInspections = [...data];
        this.totalInspections = data.length;
        
        this.currentMonthInspections = data.filter((inspection) => {
          if (!inspection.fecha_inspeccion) return false;
          
          const inspectionDate = new Date(inspection.fecha_inspeccion);
          const currentDate = new Date();
          
          return inspectionDate.getMonth() === currentDate.getMonth() &&
                 inspectionDate.getFullYear() === currentDate.getFullYear();
        }).length;
              this.cdr.detectChanges(); // ✅ Fuerza la actualización de la vista

      });
    },
    error: (error) => {
      console.error('Error al cargar inspecciones:', error);
    }
  });
}

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredInspections = [...this.inspections];
      return;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredInspections = this.inspections.filter(inspection => 
      (inspection.id_inspeccion?.toLowerCase().includes(term)) ||
      (inspection.estado?.toLowerCase().includes(term)) ||
      (inspection.vehiculo?.placa?.toLowerCase().includes(term)) ||
      (inspection.vehiculo?.marca?.toLowerCase().includes(term)) ||
      (inspection.vehiculo?.modelo?.toLowerCase().includes(term))
    );
  }

  viewInspection(id: string | undefined): void {
    if (!id) {
      console.error('No se pudo obtener el ID de la inspección');
      return;
    }
    this.router.navigate(['/detail', id]);
  }

// En tu componente inspections.ts
async deleteInspection(event: Event, id: string | undefined): Promise<void> {
  event.stopPropagation();
  
  if (!id) {
    console.error('No se pudo obtener el ID de la inspección');
    return;
  }

  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción no se puede deshacer. La inspección será eliminada permanentemente.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      // ✅ Asegúrate que 'id' sea el record.id de PocketBase (NO id_inspeccion)
      await this.realtimeInspectionsService.deleteInspection(id);
      
      // ✅ NO necesitas actualizar la lista manualmente aquí
      // La suscripción realtime ya lo hará automáticamente
      
      Swal.fire({
        title: 'Eliminada',
        text: 'La inspección ha sido eliminada',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      
    } catch (error) {
      console.error('Error al eliminar la inspección:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar la inspección',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    }
  }
}
}
