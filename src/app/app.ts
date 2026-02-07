import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from './components/header/header';
import { Sidebar } from './components/sidebar/sidebar';
import { Footer } from './components/footer/footer';
import { ScriptLoaderService, ScriptConfig } from './services/script-loader.service.ts';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Sidebar, Footer, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  providers: [ScriptLoaderService]
})
export class App implements OnInit {
  protected readonly title = signal('verificar');
  
  constructor(
    public router: Router,
    private scriptLoader: ScriptLoaderService
  ) {}

  shouldHideLayout(): boolean {
    const currentRoute = this.router.url;
    return ['/login', '/register', ''].includes(currentRoute);
  }

  // Lista de scripts a cargar de forma diferida
  private readonly scripts: ScriptConfig[] = [
    { src: 'assets/libs/sortable/Sortable.min.js', attrs: { async: true } },
    { src: 'assets/libs/chartjs/chart.js', attrs: { async: true } },
    { src: 'assets/libs/flatpickr/flatpickr.min.js', attrs: { defer: true } },
    { src: 'assets/libs/apexcharts/apexcharts.min.js', attrs: { async: true } },
    { src: 'assets/libs/datatables/datatables.min.js', attrs: { defer: true } },
    { src: 'assets/js/dashboard/dashboard.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/todolist.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/apexcharts.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/dashboard-sales.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/dashboard-sales2.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/dashboard-sales3.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/datatable.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/dropzone.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/feather.min.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/full-calendar.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/leaflet.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/leaflet.markercluster-src.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/leaflet.polylineoffset.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/map-vector.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/moment.min.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/notifications.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/scrollbar.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/select2.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/sidebar.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/sweetalert2.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/tooltip-init.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/vector-map-custom.js', attrs: { defer: true } },
    { src: 'assets/js/plugins/vectormap-script.js', attrs: { defer: true } },
    { src: 'assets/js/script.js', attrs: { defer: true } },
    { src: 'assets/js/sidebarmenu.js', attrs: { defer: true } },
    { src: 'assets/js/tinymce/tinymce.min.js', attrs: { defer: true } },
    { src: 'assets/js/tinymce/plugins/code/plugin.min.js', attrs: { defer: true } }
  ];

  async ngOnInit() {
    // Cargar scripts de forma secuencial para evitar sobrecarga
    // for (const script of this.scripts) {
    //   try {
    //     await this.scriptLoader.loadScript(script.src, script.attrs || {});
    //   } catch (error: unknown) {
    //     console.error(`Error al cargar el script ${script.src}:`, error);
    //   }
    // }
    // console.log('Proceso de carga de scripts completado');
  }
}
