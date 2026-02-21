/**
 * Módulos necesarios para el componente de detalle de inspección
 */
import { Component, AfterViewInit, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { InspectionService } from '../../services/inspection.service';
import { Inspection } from '../../models/inspection.model';
import { ExcelExportService } from '../../services/excel-export.service';
import { GotenbergService } from '../../services/gotenberg.service';
import { LightboxModule, Lightbox } from 'ngx-lightbox';
import { ChangeDetectorRef } from '@angular/core';
import { NgZone } from '@angular/core';


declare const flatpickr: any;

/**
 * Interfaz que define las opciones de configuración para el componente flatpickr
 * utilizado para la selección de fechas
 */
interface FlatpickrOptions {
  locale?: any;                     // Configuración regional para el calendario
  dateFormat: string;               // Formato de fecha (ej: 'Y-m-d')
  allowInput: boolean;              // Permite la entrada manual de fechas
  clickOpens: boolean;              // Abre el calendario al hacer clic
  disableMobile: boolean;           // Desactiva el selector nativo en móviles
  defaultDate?: string | Date;      // Fecha por defecto
  minDate?: string | Date;          // Fecha mínima seleccionable
  onChange?: (selectedDates: Date[], dateStr: string) => void; // Callback al cambiar fecha
}

/**
 * Componente para mostrar y editar el detalle de una inspección de vehículo
 * Permite visualizar y modificar todos los datos de una inspección existente
 */

@Component({
  selector: 'app-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LightboxModule],
  templateUrl: './detail.html',
  styleUrls: ['./detail.scss'],
  providers: [DatePipe]
})
export class Detail implements OnInit, AfterViewInit {
  // Referencias a los elementos del DOM para los selectores de fecha
  @ViewChild('fechaInspeccion') fechaInspeccionInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaVigencia') fechaVigenciaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaLicencia') fechaLicenciaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaVencimientoSoat') fechaVencimientoSoatInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaVencimientoRevisionTecnomecanica') fechaVencimientoRevisionTecnomecanicaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaVencimientoTarjetaOperacion') fechaVencimientoTarjetaOperacionInput!: ElementRef<HTMLInputElement>;
  inspectionImages: string[] = [];
  isLoadingImages: boolean = false;
  private album: any[] = []; // Para ngx-lightbox


  private flatpickrInstances: any[] = [];

  // Formulario principal de la inspección
  inspectionForm: FormGroup;
  // Formulario separado para el teléfono
  phoneForm: FormGroup;
  // Almacena los datos de la inspección actual
  inspectionData: Inspection | null = null;
  // Bandera para controlar el estado de carga
  isLoading: boolean = false;

  /**
   * Constructor del componente
   * @param fb Servicio para crear formularios reactivos
   * @param inspectionService Servicio para operaciones de inspección
   * @param route Servicio para acceder a los parámetros de la ruta
   * @param router Servicio para navegación programática
   * @param datePipe Servicio para formateo de fechas
   */
  constructor(
    private _lightbox: Lightbox, // ✅ Inyectar Lightbox
    private cdr: ChangeDetectorRef,  // ✅ Inyectar ChangeDetectorRef

    private fb: FormBuilder,
    public inspectionService: InspectionService,
    private route: ActivatedRoute,
    private router: Router,
    private gotenbergService: GotenbergService,        // ✅ Inyectado
    private excelExportService: ExcelExportService,    // ✅ Inyectado
    private datePipe: DatePipe,
    private ngZone: NgZone,

  ) {

    this.excelExportService = new ExcelExportService(this.gotenbergService);

    // Inicialización del formulario principal con sus validaciones
    this.inspectionForm = this.fb.group({
      // Sección: Fechas (todas son campos requeridos)
      fecha_inspeccion: ['', Validators.required],
      fecha_vigencia: ['', Validators.required],
      fecha_vencimiento_licencia: ['', Validators.required],
      fecha_vencimiento_soat: ['', Validators.required],
      fecha_vencimiento_revision_tecnomecanica: ['', Validators.required],
      fecha_vencimiento_tarjeta_operacion: ['', Validators.required],

      // Sección: Información del conductor y transportadora
      nombre_transportadora: ['', [Validators.required, Validators.minLength(3)]],
      nombres_conductor: ['', [Validators.required, Validators.minLength(3)]],
      identificacion: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],

      // Sección: Información del vehículo
      placa: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{6,8}$/)]],
      marca: ['', [Validators.required]],
      modelo: ['', [Validators.required]],
      kilometraje: ['', [Validators.required, Validators.min(0)]],
      color: [''],
      codigo_vehiculo: [''],
      capacidad_pasajeros: [''],
      soat: [''],
      licencia_transito: [''],
      revision_tecnomecanica: [''],
      clase_vehiculo: [''],
      tarjeta_operacion: [''],

      // Sección: Estado y observaciones
      estado: ['borrador'],
      observaciones: [''],

      // === CAMPOS DE INSPECCIÓN DEL VEHÍCULO ===

      // Sistema Eléctrico
      luces_navegacion: [''],
      luces_frenado: [''],
      luces_direccionales: [''],
      luz_reversa: [''],
      luces_estacionamiento: [''],
      luces_posicion: [''],
      luz_antineblina: [''],
      luz_placa: [''],
      tablero_instrumentos: [''],
      bocina: [''],
      bateria: [''],
      aire_acondicionado: [''],

      // Sistema Motor
      aceite_motor: [''],
      aceite_transmision: [''],
      liquido_refrigerante: [''],
      liquido_frenos: [''],
      filtro_aire: [''],
      hidraulico_direccion: [''],
      tension_correas: [''],

      // Carrocería
      parachoque_delantero: [''],
      parachoque_trasero: [''],
      vidrios_seguridad: [''],
      vidrios_laterales: [''],
      limpia_brisas: [''],
      guardabarros: [''],
      estribos_laterales: [''],
      placa_adhesivo: [''],
      chapa_compuerta: [''],

      // Cabina
      tapiceria: [''],
      manijas_seguros: [''],
      vidrios_electricos: [''],
      antideslizantes_pedales: [''],
      freno_mano: [''],
      tablero_instrumentos_interno: [''],

      // Seguridad Activa
      sistema_frenos: [''],
      abs: [''],
      sistema_direccion: [''],
      espejos_laterales: [''],
      espejo_interno: [''],
      freno_mano_seguridad: [''],

      // Seguridad Pasiva
      cinturones_seguridad: [''],
      airbags: [''],
      cadena_sujecion: [''],
      columna_direccion: [''],
      apoyacabezas: [''],
      barra_antivuelco: [''],
      rejilla_vidrio_trasero: [''],

      // Kit de Carretera
      conos_triangular: [''],
      botiquin: [''],
      extintor: [''],
      cunas: [''],
      llanta_repuesto: [''],
      caja_herramientas: [''],
      linterna: [''],
      gato: [''],

      // Parte Baja
      buies_barra: [''],
      buies_tiera: [''],
      cuna_motor: [''],
      guardapolvo_axiales: [''],
      amortiguadores: [''],
      hojas_muelles: [''],
      silenciadores: [''],
      tanques_compresor: [''],

      // Profundidad de Labrado
  

      llanta_di: [''],          // Delantera Izquierda - FALTA
      llanta_dd: [''],          // Delantera Derecha - FALTA (reemplaza llanta_d_ld)
      llanta_tie: [''],         // Trasera Izquierda Exterior - FALTA (reemplaza llanta_t_lie)
      llanta_tde: [''],         // Trasera Derecha Exterior - FALTA
      llanta_tii: [''],         // Trasera Izquierda Interior - FALTA (reemplaza llanta_t_lii)
      llanta_tdi: [''],         // Trasera Derecha Interior - FALTA (reemplaza llanta_t_lid)


      // === PRESIÓN DE AIRE EN LLANTAS (NUEVOS - TODOS FALTAN) ===
      presion_llanta_d_li: [''],    // Delantera Izquierda
      presion_llanta_d_ld: [''],    // Delantera Derecha
      presion_llanta_t_lie: [''],   // Trasera Izquierda Exterior
      presion_llanta_t_lde: [''],   // Trasera Derecha Exterior
      presion_llanta_t_lii: [''],   // Trasera Izquierda Interior
      presion_llanta_t_ldi: [''],   // Trasera Derecha Interior
    });

    this.phoneForm = this.fb.group({
      localNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
    });
  }

  /**
   * Inicializa el componente y se suscribe a los cambios en los parámetros de la ruta
   * Se ejecuta cuando el componente es inicializado
   */private preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = (error) => {
        console.error('Error al cargar la imagen:', url, error);
        resolve(); // Resolvemos igualmente para no bloquear el flujo
      };
    });
  }

  async loadInspectionImages(inspectionId: string): Promise<void> {
    this.isLoadingImages = true;
    this.album = []; // Limpiar álbum
    this.inspectionImages = []; // Limpiar imágenes existentes
    this.cdr.detectChanges();

    try {
      const inspection = await this.inspectionService.pb.collection('inspections').getOne(inspectionId);
      const imageIds = inspection['images'] || [];
      const collectionId = '5bjt6wpqfj0rnsl';

      if (imageIds.length > 0) {
        // Pre-cargar imágenes
        const imagePromises = imageIds.map(async (imageId: string) => {
          try {
            const imageRecord = await this.inspectionService.pb.collection('images').getOne(imageId);
            const filename = imageRecord['image'];

            if (filename) {
              const url = this.inspectionService.getImageUrl(collectionId, imageId, filename);

              // Pre-cargar la imagen
              await this.preloadImage(url);

              return {
                url,
                imageRecord
              };
            }
            return null;
          } catch (error) {
            console.error(`Error al cargar imagen ${imageId}:`, error);
            return null;
          }
        });

        // Esperar a que todas las imágenes se carguen
        const loadedImages = (await Promise.all(imagePromises)).filter(Boolean);

        // Actualizar las imágenes y el álbum
        this.inspectionImages = loadedImages.map(img => img.url);
        this.album = loadedImages.map((img, index) => ({
          src: img.url,
          thumb: img.url,
          // caption: `Imagen ${index + 1}`
        }));

        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
      Swal.fire('Error', 'No se pudieron cargar las imágenes', 'error');
    } finally {
      this.isLoadingImages = false;
      this.cdr.detectChanges();
    }
  }
  async testGotenberg(): Promise<void> {
    try {
      // Crear un blob falso de Excel
      const testBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      console.log('🔄 Probando conexión con Gotenberg...');
      const result = await this.gotenbergService.convertXlsxToPdf(testBlob).toPromise();
      console.log('✅ Gotenberg responde correctamente', result);
    } catch (error) {
      console.error('❌ Error de conexión:', error);
    }
  }
  /**
   * Carga las imágenes de la inspección
   */
  /**
   * Maneja errores al cargar imágenes
   */
  onImageError(event: any): void {
    event.target.src = 'assets/images/placeholder.jpg'; // Imagen placeholder
    event.target.onerror = null; // Evitar bucle infinito
  }
  // async loadInspectionImages(inspectionId: string): Promise<void> {
  //   this.isLoadingImages = true;

  //   try {
  //     // Obtener la inspección con imágenes expandidas
  //     const inspection = await this.inspectionService.pb.collection('inspections').getOne(inspectionId, {
  //       expand: 'images'
  //     });

  //     const collectionId = '5bjt6wpqfj0rnsl'; // ID de la colección 'images'

  //     if (inspection.expand?.['images']) {
  //       const images = Array.isArray(inspection.expand['images']) 
  //         ? inspection.expand['images'] 
  //         : [inspection.expand['images']];

  //       // Construir URLs y álbum para lightbox
  //       this.inspectionImages = images.map((img: any) => {
  //         const url = this.inspectionService.getImageUrl(collectionId, img.id, img.image);

  //         // Agregar al álbum para lightbox
  //         this.album.push({
  //           src: url,
  //           thumb: url,
  //           caption: `Imagen de inspección`
  //         });

  //         return url;
  //       });
  //     }

  //     console.log('Imágenes cargadas:', this.inspectionImages.length);

  //   } catch (error) {
  //     console.error('Error al cargar imágenes:', error);
  //     Swal.fire('Error', 'No se pudieron cargar las imágenes', 'error');
  //   } finally {
  //     this.isLoadingImages = false;
  //   }
  // }
  // async loadInspectionImages(inspectionId: string): Promise<void> {
  //   this.isLoadingImages = true;
  //   this.album = []; // Limpiar álbum

  //   try {
  //     // Obtener la inspección (sin expand, ya tenemos los IDs)
  //     const inspection = await this.inspectionService.pb.collection('inspections').getOne(inspectionId);

  //     const imageIds = inspection['images'] || [];
  //     const collectionId = '5bjt6wpqfj0rnsl'; // ID de la colección 'images'

  //     console.log('IDs de imágenes:', imageIds);

  //     if (imageIds.length > 0) {
  //       // Cargar cada imagen individualmente
  //       for (const imageId of imageIds) {
  //         try {
  //           const imageRecord = await this.inspectionService.pb.collection('images').getOne(imageId);

  //           // El campo 'image' contiene el nombre del archivo
  //           const filename = imageRecord['image'];

  //           if (filename) {
  //             const url = this.inspectionService.getImageUrl(collectionId, imageId, filename);

  //             this.inspectionImages.push(url);
  //             this.album.push({
  //               src: url,
  //               thumb: url,
  //               caption: `Imagen ${this.inspectionImages.length}`
  //             });
  //           }
  //         } catch (error) {
  //           console.error(`Error al cargar imagen ${imageId}:`, error);
  //         }
  //       }
  //     }

  //     console.log('Imágenes cargadas:', this.inspectionImages.length);
  //     console.log('Álbum:', this.album);

  //   } catch (error) {
  //     console.error('Error al cargar imágenes:', error);
  //     Swal.fire('Error', 'No se pudieron cargar las imágenes', 'error');
  //   } finally {
  //     this.isLoadingImages = false;
  //   }
  // }
  // async loadInspectionImages(inspectionId: string): Promise<void> {
  //   this.isLoadingImages = true;
  //   this.album = []; // Limpiar álbum
  //   this.inspectionImages = []; // Limpiar imágenes existentes

  //   // Forzar la detección de cambios
  //   this.cdr.detectChanges();

  //   try {
  //     // Obtener la inspección (sin expand, ya tenemos los IDs)
  //     const inspection = await this.inspectionService.pb.collection('inspections').getOne(inspectionId);

  //     const imageIds = inspection['images'] || [];
  //     const collectionId = '5bjt6wpqfj0rnsl'; // ID de la colección 'images'

  //     console.log('IDs de imágenes:', imageIds);

  //     if (imageIds.length > 0) {
  //       // Cargar cada imagen individualmente
  //       for (const imageId of imageIds) {
  //         try {
  //           const imageRecord = await this.inspectionService.pb.collection('images').getOne(imageId);

  //           // El campo 'image' contiene el nombre del archivo
  //           const filename = imageRecord['image'];

  //           if (filename) {
  //             const url = this.inspectionService.getImageUrl(collectionId, imageId, filename);

  //             this.inspectionImages = [...this.inspectionImages, url];
  //             this.album = [...this.album, {
  //               src: url,
  //               thumb: url,
  //               caption: `Imagen ${this.inspectionImages.length}`
  //             }];

  //             // Forzar la detección de cambios después de cada imagen
  //             this.cdr.detectChanges();
  //           }
  //         } catch (error) {
  //           console.error(`Error al cargar imagen ${imageId}:`, error);
  //         }
  //       }
  //     }

  //     console.log('Imágenes cargadas:', this.inspectionImages.length);

  //   } catch (error) {
  //     console.error('Error al cargar imágenes:', error);
  //     Swal.fire('Error', 'No se pudieron cargar las imágenes', 'error');
  //   } finally {
  //     this.isLoadingImages = false;
  //     // Forzar la detección de cambios final
  //     this.cdr.detectChanges();
  //   }
  // }
  /**
   * Abre el lightbox en una imagen específica
   */
  openImageModal(imageUrl: string, index: number): void {
    // Crear array de imágenes para navegación
    const images = this.inspectionImages;

    let currentIndex = index;

    const showImage = () => {
      Swal.fire({
        title: `Imagen ${currentIndex + 1} de ${images.length}`,
        imageUrl: images[currentIndex],
        imageAlt: 'Imagen de inspección',
        imageWidth: '100%',
        imageHeight: 'auto',
        showConfirmButton: true,
        confirmButtonText: 'Anterior',
        confirmButtonColor: '#0f0369', // Color azul para el botón Anterior
        showCancelButton: currentIndex > 0,
        cancelButtonText: 'Cerrar',
        cancelButtonColor: '#d33',     // Color rojo para el botón Cerrar
        showDenyButton: currentIndex < images.length - 1,
        denyButtonText: 'Siguiente',
        denyButtonColor: '#5cb85c',    // Color verde para el botón Siguiente
        background: 'rgba(0,0,0,0.95)',
        padding: '0',
        width: '90%',
        customClass: {
          container: 'image-modal-fullscreen',
          image: 'modal-image'
        },
        didOpen: () => {
          // Agregar estilos personalizados
          const style = document.createElement('style');
          style.textContent = `
      .image-modal-fullscreen {
        z-index: 9999 !important;
      }
      .modal-image {
        max-height: 80vh !important;
        object-fit: contain !important;
      }
      /* Estilos personalizados para los botones */
      .swal2-styled.swal2-confirm {
        background-color: #0f0369 !important;
      }
      .swal2-styled.swal2-deny {
        background-color: #5cb85c !important;
      }
      .swal2-styled.swal2-cancel {
        background-color: #d33 !important;
      }
      /* Cambiar color al pasar el mouse */
      .swal2-styled.swal2-confirm:hover {
        background-color: #0f0369 !important;
      }
      .swal2-styled.swal2-deny:hover {
        background-color: #4cae4c !important;
      }
      .swal2-styled.swal2-cancel:hover {
        background-color: #c12e2e !important;
      }
    `;
          document.head.appendChild(style);
        },
        preConfirm: () => {
          return Swal.getDenyButton() ? 'next' : 'prev';
        }
      }).then((result) => {
        if (result.isDenied && currentIndex < images.length - 1) {
          currentIndex++;
          showImage();
        } else if (result.isConfirmed && currentIndex > 0) {
          currentIndex--;
          showImage();
        }
      });
    };

    showImage();
  }

  openLightbox(index: number): void {
    // ✅ Ejecutar fuera de Angular zone y luego volver
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.ngZone.run(() => {
          this._lightbox.open(this.album, index);
          this.cdr.detectChanges();
        });
      }, 10);
    });
  }
  /**
   * Cierra el lightbox
   */
  closeLightbox(): void {
    this._lightbox.close();
  }
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        // Si hay un ID en la ruta, carga los datos de la inspección
        this.loadInspection(id);
      } else {
        // Si no hay ID, redirige al listado de inspecciones
        this.router.navigate(['/inspections']);
      }
    });
  }
  /**
   * Se ejecuta después de que la vista ha sido inicializada
   * Configura los selectores de fecha una vez que la vista está lista
   */
  ngAfterViewInit(): void {
    // Inicializamos los date pickers pero NO los configuramos todavía
    setTimeout(() => {
      this.initializeDatePickers();
    }, 0);
  }
  /**
   * Carga los datos de una inspección existente desde el servidor
   * @param id Identificador único de la inspección a cargar
   */
  // private loadInspection(id: string): void {
  //   this.isLoading = true;  // Activa el indicador de carga
  //   this.inspectionService.getInspectionById(id).subscribe({
  //     next: (data) => {
  //       // Al recibir los datos, los asigna al formulario
  //       this.inspectionData = data;
  //       this.prepareFormData(data);
  //       this.isLoading = false;  // Desactiva el indicador de carga
  //     },
  //     error: (error) => {
  //       console.error('Error al cargar la inspección:', error);
  //       // Muestra un mensaje de error al usuario
  //       Swal.fire('Error', 'No se pudo cargar la inspección', 'error');
  //       // Redirige al listado de inspecciones
  //       this.router.navigate(['/inspections']);
  //     }
  //   });
  // }
  //   private loadInspection(id: string): void {
  //   this.isLoading = true;

  //   this.inspectionService.getInspectionById(id).subscribe({
  //     next: (data) => {
  //       this.inspectionData = data;
  //       this.prepareFormData(data);
  //       this.isLoading = false;

  //       // ✅ Cargar imágenes después de cargar la inspección
  //       this.loadInspectionImages(id);
  //     },
  //     error: (error) => {
  //       console.error('Error al cargar la inspección:', error);
  //       Swal.fire('Error', 'No se pudo cargar la inspección', 'error');
  //       this.router.navigate(['/inspections']);
  //     }
  //   });
  // }
  private loadInspection(id: string): void {
    this.isLoading = true;

    this.inspectionService.getInspectionById(id).subscribe({
      next: async (data) => {
        this.inspectionData = data;
        this.prepareFormData(data);
        this.isLoading = false;

        // Esperar un pequeño retraso para asegurar que la vista se ha actualizado
        await new Promise(resolve => setTimeout(resolve, 100));

        // Cargar imágenes después de cargar la inspección
        await this.loadInspectionImages(id);

        // Forzar la detección de cambios
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar la inspección:', error);
        Swal.fire('Error', 'No se pudo cargar la inspección', 'error');
        this.router.navigate(['/inspections']);
      }
    });
  }
  /**
   * Prepara los datos de la inspección para mostrarlos en el formulario
   * @param data Datos de la inspección recibidos del servidor
   */
  private prepareFormData(data: any): void {
    console.log('Datos de la inspección recibidos:', data);

    // Combina los datos del vehículo con los datos principales de la inspección
    if (data.expand?.vehiculo) {
      data = { ...data, ...data.expand.vehiculo };
      delete data.expand;  // Elimina la propiedad expand que ya no es necesaria
    } else if (data.vehiculo) {
      // Formato alternativo para compatibilidad
      data = { ...data, ...data.vehiculo };
    }

    const formattedData = { ...data };
    // Lista de campos que contienen fechas que necesitan formateo
    const dateFields = [
      'fecha_inspeccion',
      'fecha_vigencia',
      'fecha_vencimiento_licencia',
      'fecha_vencimiento_soat',
      'fecha_vencimiento_revision_tecnomecanica',
      'fecha_vencimiento_tarjeta_operacion'
    ];

    // Formatea todas las fechas al formato YYYY-MM-DD
    dateFields.forEach(field => {
      if (formattedData[field]) {
        formattedData[field] = this.formatDate(formattedData[field]);
      }
    });

    console.log('Datos formateados para el formulario:', formattedData);

    // Actualiza el formulario con los datos formateados
    this.inspectionForm.patchValue(formattedData, { emitEvent: false });

    // Actualiza el formulario del teléfono si existe
    if (formattedData.telefono) {
      this.phoneForm.patchValue({
        telefono: formattedData.telefono
      }, { emitEvent: false });
    }
  }

  /**
   * Navega de regreso a la lista de inspecciones
   */
  goBack(): void {
    this.router.navigate(['/inspecciones']);
  }

  /**
   * Abre el diálogo de impresión del navegador
   */
  printInspection(): void {
    window.print();
  }

  /**
   * Formatea una cadena de fecha al formato YYYY-MM-DD
   * @param dateString Cadena de fecha a formatear
   * @returns Cadena de fecha formateada o cadena vacía si no hay fecha
   */
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return this.datePipe.transform(date, 'yyyy-MM-dd') || '';
  }

  /**
   * Inicializa los selectores de fecha (datepickers) en el formulario
   */
  private initializeDatePickers(): void {
    // Configuración común para todos los selectores de fecha
    const dateOptions: FlatpickrOptions = {
      dateFormat: 'Y-m-d',  // Formato de fecha
      allowInput: true,     // Permite entrada manual
      clickOpens: true,     // Abre el calendario al hacer clic
      disableMobile: true   // Desactiva el selector nativo en móviles
    };

    // Inicializa cada selector de fecha con las opciones configuradas
    this.initDatePicker(this.fechaInspeccionInput, dateOptions);
    this.initDatePicker(this.fechaVigenciaInput, dateOptions);
    this.initDatePicker(this.fechaLicenciaInput, dateOptions);
    this.initDatePicker(this.fechaVencimientoSoatInput, dateOptions);
    this.initDatePicker(this.fechaVencimientoRevisionTecnomecanicaInput, dateOptions);
    this.initDatePicker(this.fechaVencimientoTarjetaOperacionInput, dateOptions);
  }

  /**
   * Inicializa un selector de fecha individual
   * @param element Referencia al elemento input del formulario
   * @param options Opciones de configuración para flatpickr
   */
  private initDatePicker(element: ElementRef, options: FlatpickrOptions): void {
    // Verifica que el elemento exista antes de inicializar
    if (element && element.nativeElement) {
      flatpickr(element.nativeElement, options);
    }
  }

  // async imprimirInspeccion(): Promise<void> {
  //   try {
  //     // Mostrar SweetAlert de carga al inicio
  //     Swal.fire({
  //       title: 'Procesando...',
  //       text: 'Exportando datos de la inspección, por favor espere',
  //       allowOutsideClick: false,
  //       didOpen: () => {
  //         Swal.showLoading();
  //       }
  //     });

  //     // Exportar TODO en un solo archivo con ambos datos
  //     await this.excelExportService.exportarDatosConductor({
  //       nombre_transportadora: this.inspectionForm.get('nombre_transportadora')?.value,
  //       nombres_conductor: this.inspectionForm.get('nombres_conductor')?.value,
  //       telefono_conductor: this.inspectionForm.get('telefono')?.value,
  //       placa: this.inspectionForm.get('placa')?.value,
  //       marca: this.inspectionForm.get('marca')?.value,
  //       modelo: this.inspectionForm.get('modelo')?.value,
  //       color: this.inspectionForm.get('color')?.value,
  //       codigo_vehiculo: this.inspectionForm.get('codigo_vehiculo')?.value,
  //       kilometraje: this.inspectionForm.get('kilometraje')?.value,
  //       fecha_inspeccion: this.inspectionForm.get('fecha_inspeccion')?.value,
  //       fecha_vigencia: this.inspectionForm.get('fecha_vigencia')?.value,
  //       fecha_vencimiento_licencia: this.inspectionForm.get('fecha_vencimiento_licencia')?.value,
  //       fecha_vencimiento_soat: this.inspectionForm.get('fecha_vencimiento_soat')?.value,
  //       fecha_vencimiento_revision_tecnomecanica: this.inspectionForm.get('fecha_vencimiento_revision_tecnomecanica')?.value,
  //       fecha_vencimiento_tarjeta_operacion: this.inspectionForm.get('fecha_vencimiento_tarjeta_operacion')?.value,



  //       estado: 'borrador',

  //       capacidad_pasajeros: Number(this.inspectionForm.get('capacidad_pasajeros')?.value),

  //       llanta_di: Number(this.inspectionForm.get('llanta_di')?.value),
  //       llanta_dd: Number(this.inspectionForm.get('llanta_dd')?.value),
  //       llanta_tie: Number(this.inspectionForm.get('llanta_tie')?.value),
  //       llanta_tde: Number(this.inspectionForm.get('llanta_tde')?.value),
  //       llanta_tli: Number(this.inspectionForm.get('llanta_tli')?.value),
  //       llanta_tlii: Number(this.inspectionForm.get('llanta_tlii')?.value),
  //       llanta_tlid: Number(this.inspectionForm.get('llanta_tlid')?.value),
  //       llanta_t_lie: Number(this.inspectionForm.get('llanta_t_lie')?.value),
  //       llanta_t_lii: Number(this.inspectionForm.get('llanta_t_lii')?.value),
  //       llanta_t_lid: Number(this.inspectionForm.get('llanta_t_lid')?.value),

  //     });

  //     // Cerrar el SweetAlert de carga
  //     Swal.close();

  //     // Mostrar mensaje de éxito
  //     Swal.fire('Éxito', 'Inspección exportada correctamente', 'success');

  //   } catch (error) {
  //     // Cerrar el SweetAlert de carga en caso de error
  //     Swal.close();

  //     console.error('Error al imprimir inspección:', error);
  //     const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al procesar la solicitud';
  //     Swal.fire('Error', errorMessage, 'error');
  //   }
  // }


  // imprimirInspeccion(): void {
  //   window.print();
  // }
  // async imprimirInspeccion(): Promise<void> {
  //   try {
  //     // Mostrar SweetAlert de carga
  //     Swal.fire({
  //       title: 'Generando PDF...',
  //       html: 'Procesando datos de la inspección<br><small>Esto puede tomar unos segundos</small>',
  //       allowOutsideClick: false,
  //       didOpen: () => {
  //         Swal.showLoading();
  //       }
  //     });

  //     // 1. Obtener los datos del formulario
  //     const formData = {
  //       nombre_transportadora: this.inspectionForm.get('nombre_transportadora')?.value,
  //       nombres_conductor: this.inspectionForm.get('nombres_conductor')?.value,
  //       telefono_conductor: this.inspectionForm.get('telefono')?.value,
  //       placa: this.inspectionForm.get('placa')?.value,
  //       marca: this.inspectionForm.get('marca')?.value,
  //       modelo: this.inspectionForm.get('modelo')?.value,
  //       color: this.inspectionForm.get('color')?.value,
  //       codigo_vehiculo: this.inspectionForm.get('codigo_vehiculo')?.value,
  //       kilometraje: this.inspectionForm.get('kilometraje')?.value,
  //       fecha_inspeccion: this.inspectionForm.get('fecha_inspeccion')?.value,
  //       fecha_vigencia: this.inspectionForm.get('fecha_vigencia')?.value,
  //       fecha_vencimiento_licencia: this.inspectionForm.get('fecha_vencimiento_licencia')?.value,
  //       fecha_vencimiento_soat: this.inspectionForm.get('fecha_vencimiento_soat')?.value,
  //       fecha_vencimiento_revision_tecnomecanica: this.inspectionForm.get('fecha_vencimiento_revision_tecnomecanica')?.value,
  //       fecha_vencimiento_tarjeta_operacion: this.inspectionForm.get('fecha_vencimiento_tarjeta_operacion')?.value,
  //       estado: 'borrador',
  //       capacidad_pasajeros: Number(this.inspectionForm.get('capacidad_pasajeros')?.value),
  //       llanta_di: Number(this.inspectionForm.get('llanta_di')?.value),
  //       llanta_dd: Number(this.inspectionForm.get('llanta_dd')?.value),
  //       llanta_tie: Number(this.inspectionForm.get('llanta_tie')?.value),
  //       llanta_tde: Number(this.inspectionForm.get('llanta_tde')?.value),
  //       llanta_tli: Number(this.inspectionForm.get('llanta_tli')?.value),
  //       llanta_tlii: Number(this.inspectionForm.get('llanta_tlii')?.value),
  //       llanta_tlid: Number(this.inspectionForm.get('llanta_tlid')?.value),
  //       llanta_t_lie: Number(this.inspectionForm.get('llanta_t_lie')?.value),
  //       llanta_t_lii: Number(this.inspectionForm.get('llanta_t_lii')?.value),
  //       llanta_t_lid: Number(this.inspectionForm.get('llanta_t_lid')?.value),
  //     };

  //     // 2. Generar PDF usando el nuevo método
  //     await this.excelExportService.exportarDatosConductorComoPdf(formData);

  //     // 3. Cerrar SweetAlert de carga
  //     Swal.close();

  //     // 4. Mostrar mensaje de éxito
  //     Swal.fire({
  //       icon: 'success',
  //       title: '¡PDF generado!',
  //       text: 'El documento ha sido descargado correctamente',
  //       timer: 2000,
  //       showConfirmButton: false
  //     });

  //   } catch (error) {
  //     // Cerrar SweetAlert en caso de error
  //     Swal.close();

  //     console.error('Error al generar PDF:', error);

  //     // Mostrar mensaje de error al usuario
  //     const errorMessage = error instanceof Error ? error.message : 'Error al generar el PDF';
  //     Swal.fire({
  //       icon: 'error',
  //       title: 'Error',
  //       text: errorMessage,
  //       confirmButtonText: 'Aceptar'
  //     });
  //   }
  // }

  async imprimirInspeccion(): Promise<void> {
  try {
    Swal.fire({
      title: 'Generando PDF...',
      html: 'Procesando datos e imágenes...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    // 1. Recolectar datos del formulario
    const formData = {
      nombre_transportadora: this.inspectionForm.get('nombre_transportadora')?.value,
      nombres_conductor: this.inspectionForm.get('nombres_conductor')?.value,
      telefono_conductor: this.inspectionForm.get('telefono')?.value,
      placa: this.inspectionForm.get('placa')?.value,
      marca: this.inspectionForm.get('marca')?.value,
      modelo: this.inspectionForm.get('modelo')?.value,
      color: this.inspectionForm.get('color')?.value,
      codigo_vehiculo: this.inspectionForm.get('codigo_vehiculo')?.value,
      kilometraje: this.inspectionForm.get('kilometraje')?.value,
      capacidad_pasajeros: Number(this.inspectionForm.get('capacidad_pasajeros')?.value),
      fecha_inspeccion: this.inspectionForm.get('fecha_inspeccion')?.value,
      fecha_vigencia: this.inspectionForm.get('fecha_vigencia')?.value,
      // ... agrega más campos si los necesitas
    };

    // 2. ✅ Pasar las URLs de imágenes que ya tienes cargadas
    const imageUrls = this.inspectionImages; // ← Ya las tienes en el componente

    // 3. ✅ LLAMAR AL NUEVO MÉTODO CON IMÁGENES
    await this.excelExportService.exportarDatosConductorComoPdfConImagenes(
      formData, 
      imageUrls
    );

    Swal.close();
    Swal.fire('Éxito', 'PDF con imágenes generado', 'success');

  } catch (error) {
    Swal.close();
    Swal.fire('Error', error instanceof Error ? error.message : 'Error al generar PDF', 'error');
  }
}
}
