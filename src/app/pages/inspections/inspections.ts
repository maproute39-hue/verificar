import { Component, OnInit } from '@angular/core';
import { RealtimeInspectionsService } from '../../services/inspections-realtime';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Inspection } from '../../models/inspection.model';
import Swal from 'sweetalert2';
import { SharedService } from '../../services/shared.service';
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
    public realtimeInspectionsService: RealtimeInspectionsService,
    private router: Router,
    public sharedService: SharedService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.sharedService.currentRoute = this.route.snapshot.url[0].path;
    console.log(this.sharedService.currentRoute);
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

async deleteInspection(event: Event, id: string | undefined): Promise<void> {
  event.stopPropagation();
  
  if (!id) {
    console.error('No se pudo obtener el ID de la inspección');
    return;
  }

  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      // ✅ 1. Eliminar en el backend
      await this.realtimeInspectionsService.deleteInspection(id);
      
      // ✅ 2. ACTUALIZAR LISTAS LOCALES INMEDIATAMENTE
      this.inspections = this.inspections.filter(insp => insp.id_inspeccion !== id);
      this.filteredInspections = this.filteredInspections.filter(insp => insp.id_inspeccion !== id);
      
      // ✅ 3. Recalcular contadores
      this.totalInspections = this.inspections.length;
      
      this.currentMonthInspections = this.inspections.filter((inspection) => {
        if (!inspection.fecha_inspeccion) return false;
        const inspectionDate = new Date(inspection.fecha_inspeccion);
        const currentDate = new Date();
        return inspectionDate.getMonth() === currentDate.getMonth() &&
               inspectionDate.getFullYear() === currentDate.getFullYear();
      }).length;
      
      // ✅ 4. Mostrar confirmación breve y no intrusiva
      Swal.fire({
        title: 'Eliminada',
        text: 'La inspección ha sido eliminada',
        icon: 'success',
        confirmButtonText: 'Aceptar',
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
