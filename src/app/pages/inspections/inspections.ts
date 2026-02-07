import { Component, OnInit } from '@angular/core';
import { RealtimeInspectionsService } from '../../services/inspections-realtime';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Inspection } from '../../models/inspection.model';

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
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeData();
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
}
