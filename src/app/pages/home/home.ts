import { Component, OnInit } from '@angular/core';
import { RealtimeInspectionsService } from '../../services/inspections-realtime';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { Inspection } from '../../models/inspection.model';
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

  constructor(
    public RealtimeInspectionsService: RealtimeInspectionsService,
    private router: Router
  ) { }

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
