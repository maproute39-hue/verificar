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
import { Subscription } from 'rxjs';

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
  hasChanges: boolean = false;
  private formSubscription?: Subscription;
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
      propietario: ['', [Validators.required]],
      documento_propietario: ['', [Validators.required]],

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
      filtro_aire: [''],
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
      // freno_mano: [''],
      tablero_instrumentos_interno: [''],

      // Seguridad Activa
      // sistema_frenos: [''],
      abs: [''],
      // sistema_direccion: [''],
      espejos_laterales: [''],
      espejo_interno: [''],

      // Seguridad Pasiva
      cinturones_seguridad: [''],
      airbags: [''],
      cadena_sujecion: [''],
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
      numero_certificado: [''],


      // SISTEMA DE FRENOS
      freno_mano_seguridad: [''],
      liquido_frenos: [''],
      bomba_frenos: [''],
      pedal_frenos: [''],


      //SISTEMA DE DIRECCION
      caja_deposito: [''],
      terminales: [''],
      barras_bujes: [''],
      protectores: [''],
      hidraulico_direccion: [''],
      columna_direccion: [''],



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
  //   async saveChanges(): Promise<void> {
  //   if (!this.inspectionForm.valid) {
  //     Swal.fire('Validación', 'Por favor completa los campos requeridos', 'warning');
  //     return;
  //   }

  //   try {
  //     Swal.fire({
  //       title: 'Guardando...',
  //       html: 'Procesando cambios de la inspección',
  //       allowOutsideClick: false,
  //       didOpen: () => Swal.showLoading()
  //     });

  //     const id = this.route.snapshot.paramMap.get('id');
  //     if (!id) throw new Error('No hay ID de inspección');

  //     // Obtener los valores del formulario
  //     const formData = { ...this.inspectionForm.value };

  //     // ✅ Aquí llamas a tu servicio para actualizar la inspección
  //     // Ejemplo con PocketBase:
  //     await this.inspectionService.pb.collection('inspections').update(id, formData);

  //     // ✅ Si también manejas imágenes, aquí podrías agregar esa lógica

  //     // Marcar el formulario como "limpio" para ocultar el botón
  //     this.inspectionForm.markAsPristine();
  //     this.hasChanges = false;

  //     Swal.fire('Éxito', 'Cambios guardados correctamente', 'success');

  //   } catch (error) {
  //     console.error('Error al guardar:', error);
  //     Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
  //   }
  // }
  // async saveChanges(): Promise<void> {
  //   if (!this.inspectionForm.valid) {
  //     Swal.fire('Validación', 'Por favor completa los campos requeridos', 'warning');
  //     return;
  //   }

  //   try {
  //     Swal.fire({
  //       title: 'Guardando...',
  //       html: 'Procesando cambios de la inspección',
  //       allowOutsideClick: false,
  //       didOpen: () => Swal.showLoading()
  //     });

  //     const id = this.route.snapshot.paramMap.get('id');
  //     if (!id) throw new Error('No hay ID de inspección');

  //     // Obtener los valores del formulario
  //     const formData = { ...this.inspectionForm.value };

  //     // 🎯 CALCULAR EL ESTADO AUTOMÁTICAMENTE
  //     formData.estado = this.calcularEstadoInspeccion(formData);

  //     // Mostrar mensaje informativo sobre el estado calculado
  //     const estadoTexto = {
  //       'aprobada': '✅ Inspección aprobada',
  //       'rechazada': '❌ Inspección rechazada',
  //       'borrador': '📝 Guardado como borrador'
  //     };

  //     // ✅ Actualizar en PocketBase con el estado calculado
  //     await this.inspectionService.pb.collection('inspections').update(id, formData);

  //     // Marcar el formulario como "limpio" para ocultar el botón
  //     this.inspectionForm.markAsPristine();
  //     this.phoneForm.markAsPristine();
  //     this.hasChanges = false;

  //     // Mostrar confirmación con el estado resultante
  //     Swal.fire({
  //       icon: formData.estado === 'rechazada' ? 'warning' : 'success',
  //       title: 'Éxito',
  //       text: `Cambios guardados. ${estadoTexto[formData.estado as keyof typeof estadoTexto]}`,
  //       confirmButtonColor: formData.estado === 'rechazada' ? '#ffc107' : '#198754'
  //     });

  //   } catch (error) {
  //     console.error('Error al guardar:', error);
  //     Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
  //   }
  // }
  async saveChanges(): Promise<void> {
    // if (!this.inspectionForm.valid) {
    //   Swal.fire('Validación', 'Por favor completa los campos requeridos', 'warning');
    //   return;
    // }

    try {
      Swal.fire({
        title: 'Guardando...',
        html: 'Procesando cambios de la inspección',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const id = this.route.snapshot.paramMap.get('id');
      if (!id) throw new Error('No hay ID de inspección');

      // Obtener los valores del formulario
      const formData = { ...this.inspectionForm.value };

      // 🎯 CALCULAR EL ESTADO AUTOMÁTICAMENTE
      formData.estado = this.calcularEstadoInspeccion(formData);

      // ✅ Actualizar en PocketBase con el estado calculado
      const updatedRecord = await this.inspectionService.pb.collection('inspections').update(id, formData);

      // 🔄 ACTUALIZAR EL FORMULARIO CON LOS DATOS REFRESCADOS DEL SERVIDOR
      this.actualizarFormularioConDatosActualizados(updatedRecord);

      // Marcar el formulario como "limpio" para ocultar el botón
      this.inspectionForm.markAsPristine();
      this.phoneForm.markAsPristine();
      this.hasChanges = false;

      // Mostrar confirmación con el estado resultante
      const estadoTexto = {
        // Opción 2 - Más básico
        'aprobada': '[✓] Inspección APROBADA',
        'rechazada': '[✗] Inspección RECHAZADA',
        'borrador': '[✎] Guardado como BORRADOR'

      };

      Swal.fire({
        icon: formData.estado === 'rechazada' ? 'warning' : 'success',
        title: 'Éxito',
        text: `Cambios guardados ${estadoTexto[formData.estado as keyof typeof estadoTexto]}`,
        confirmButtonColor: formData.estado === 'rechazada' ? '#ffc107' : '#198754'
      });

    } catch (error) {
      console.error('Error al guardar:', error);
      Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
    }
  }
  /**
   * Actualiza el formulario con los datos más recientes del servidor
   * después de una operación de guardado exitosa
   * @param updatedRecord - Registro actualizado recibido de PocketBase
   */
  private actualizarFormularioConDatosActualizados(updatedRecord: any): void {
    console.log('🔄 Actualizando formulario con datos del servidor...', updatedRecord);

    // Combinar datos principales con datos del vehículo si existen
    let dataParaFormulario = { ...updatedRecord };

    if (updatedRecord.expand?.vehiculo) {
      dataParaFormulario = { ...updatedRecord, ...updatedRecord.expand.vehiculo };
    } else if (updatedRecord.vehiculo) {
      dataParaFormulario = { ...updatedRecord, ...updatedRecord.vehiculo };
    }

    // Formatear fechas al formato YYYY-MM-DD para compatibilidad con flatpickr
    const dateFields = [
      'fecha_inspeccion', 'fecha_vigencia', 'fecha_vencimiento_licencia',
      'fecha_vencimiento_soat', 'fecha_vencimiento_revision_tecnomecanica',
      'fecha_vencimiento_tarjeta_operacion'
    ];

    dateFields.forEach(field => {
      if (dataParaFormulario[field]) {
        dataParaFormulario[field] = this.formatDate(dataParaFormulario[field]);
      }
    });

    // ✅ Actualizar formulario principal SIN emitir eventos para evitar bucles
    this.inspectionForm.patchValue(dataParaFormulario, { emitEvent: false });

    // ✅ Actualizar formulario de teléfono si existe el campo
    if (dataParaFormulario.telefono) {
      this.phoneForm.patchValue({
        localNumber: dataParaFormulario.telefono.replace('+57', '') // Ajustar según tu formato
      }, { emitEvent: false });
    }

    // ✅ Actualizar la referencia local de datos
    this.inspectionData = dataParaFormulario;

    console.log('✅ Formulario actualizado con datos del servidor');
  }
  /**
   * Muestra alerta cuando se intenta exportar una inspección en estado borrador
   */
  public showNoExport(): void {
    Swal.fire({
      title: '<i class="fas fa-file-pdf text-danger"></i> Exportación no disponible',
      html: `
      <div class="py-2">
        <p class="mb-3">La inspección no puede ser exportada porque está en estado de <strong class="text-warning">Borrador</strong>.</p>
        <div class="alert alert-light border small mb-0">
          <i class="fas fa-lightbulb text-warning me-2"></i>
          Complete la inspección marcando todos los ítems (C/N/C/N/A) y guarde los cambios para habilitar la exportación.
        </div>
      </div>
    `,
      icon: 'warning',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#02376b',
      showCancelButton: true,
      cancelButtonText: 'Ir a editar',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Opcional: redirigir o enfocar algún campo
        console.log('Usuario cerró la alerta');
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Opcional: scroll a la sección de inspección
        console.log('Usuario quiere editar');
      }
    });
  }
  /**
   * Muestra alerta detallada con los campos pendientes cuando se intenta exportar en estado borrador
   * @param formData - Datos actuales del formulario de inspección
   */
  public showNoExportWithDetails(formData: any): void {
    // Lista de campos de inspección agrupados por categoría para mejor visualización
    const inspectionFieldsByCategory = {
      '⚡ Sistema Eléctrico': [
        'luces_navegacion', 'luces_frenado', 'luces_direccionales', 'luz_reversa',
        'luces_estacionamiento', 'luces_posicion', 'luz_antineblina', 'luz_placa',
        'tablero_instrumentos', 'bocina', 'bateria', 'aire_acondicionado'
      ],
      '🔧 Sistema Motor': [
        'aceite_motor', 'aceite_transmision', 'liquido_refrigerante',
        'filtro_aire', 'tension_correas'
      ],
      '🚗 Carrocería': [
        'parachoque_delantero', 'parachoque_trasero', 'vidrios_seguridad', 'vidrios_laterales',
        'limpia_brisas', 'guardabarros', 'estribos_laterales', 'placa_adhesivo', 'chapa_compuerta'
      ],
      '🎛️ Cabina': [
        'tapiceria', 'manijas_seguros', 'vidrios_electricos', 'antideslizantes_pedales',
        // 'freno_mano',
        'tablero_instrumentos_interno'
      ],
      '🛡️ Seguridad Activa': [
        'abs',
        //  'sistema_direccion',
        'espejos_laterales',
        'espejo_interno',
      ],
      '🪑 Seguridad Pasiva': [
        'cinturones_seguridad', 'airbags', 'cadena_sujecion',
        'apoyacabezas', 'barra_antivuelco', 'rejilla_vidrio_trasero'
      ],
      '🧰 Kit de Carretera': [
        'conos_triangular', 'botiquin', 'extintor', 'cunas', 'llanta_repuesto',
        'caja_herramientas', 'linterna', 'gato'
      ],
      '🔩 Parte Baja': [
        'buies_barra', 'buies_tiera', 'cuna_motor', 'guardapolvo_axiales',
        'amortiguadores', 'hojas_muelles', 'silenciadores', 'tanques_compresor'
      ],
      '🔩 Sistema de frenos': [
        'liquido_frenos',
        'pedal_frenos',
        'bomba_frenos',
        'freno_mano_seguridad'
      ],
      '🔩 Sistema de Dirección': [
        'caja_deposito',
        'terminales',
        'barras_bujes',
        'protectores',
        'hidraulico_direccion',
        'columna_direccion',
      ],
    };

    // 🔍 Identificar campos vacíos por categoría
    const missingByCategory: { [category: string]: string[] } = {};
    let totalMissing = 0;

    Object.entries(inspectionFieldsByCategory).forEach(([category, fields]) => {
      const missing = fields.filter(field => !formData[field] || formData[field] === '');
      if (missing.length > 0) {
        missingByCategory[category] = missing;
        totalMissing += missing.length;
      }
    });

    // 📋 Mapeo de nombres técnicos a nombres legibles para el usuario
    const fieldLabels: { [key: string]: string } = {
      'luces_navegacion': 'Luces de navegación',
      'luces_frenado': 'Luces de frenado',
      'luces_direccionales': 'Luces direccionales',
      'luz_reversa': 'Luz de reversa',
      'luces_estacionamiento': 'Luces de estacionamiento',
      'luces_posicion': 'Luces de posición',
      'luz_antineblina': 'Luz antineblina',
      'luz_placa': 'Luz de placa',
      'tablero_instrumentos': 'Tablero de instrumentos',
      'bocina': 'Bocina',
      'bateria': 'Batería',
      'aire_acondicionado': 'Aire acondicionado',
      'aceite_motor': 'Aceite del motor',
      'aceite_transmision': 'Aceite de transmisión',
      'liquido_refrigerante': 'Líquido refrigerante',
      'liquido_frenos': 'Líquido de frenos',
      'filtro_aire': 'Filtro de aire',
      'hidraulico_direccion': 'Hidráulico de dirección',
      'tension_correas': 'Tensión de correas',
      'parachoque_delantero': 'Parachoques delantero',
      'parachoque_trasero': 'Parachoques trasero',
      'vidrios_seguridad': 'Vidrios de seguridad',
      'vidrios_laterales': 'Vidrios laterales',
      'limpia_brisas': 'Limpia brisas',
      'guardabarros': 'Guardabarros',
      'estribos_laterales': 'Estribos laterales',
      'placa_adhesivo': 'Placa adhesiva',
      'chapa_compuerta': 'Chapa compuerta',
      'tapiceria': 'Tapicería',
      'manijas_seguros': 'Manijas y seguros',
      'vidrios_electricos': 'Vidrios eléctricos',
      'antideslizantes_pedales': 'Antideslizantes de pedales',
      // 'freno_mano': 'Freno de mano',
      'tablero_instrumentos_interno': 'Tablero interno',
      'sistema_frenos': 'Sistema de frenos',
      'abs': 'Sistema ABS',
      'sistema_direccion': 'Sistema de dirección',
      'espejos_laterales': 'Espejos laterales',
      'espejo_interno': 'Espejo interno',

      'caja_deposito': 'Estado de la caja y depósito hidráulico',
      'temrinales': 'Terminales',
      'barras_bujes': 'Barras y bujes de torsión',
      'protectores': 'Protectores de caja de dirección',

      'freno_mano_seguridad': 'Freno de seguridad',
      'cinturones_seguridad': 'Cinturones de seguridad',
      'airbags': 'Airbags',
      'cadena_sujecion': 'Cadena de sujeción',
      'columna_direccion': 'Columna de dirección',
      'apoyacabezas': 'Apoyacabezas',
      'barra_antivuelco': 'Barra antivuelco',
      'rejilla_vidrio_trasero': 'Rejilla vidrio trasero',
      'conos_triangular': 'Conos/triángulos',
      'botiquin': 'Botiquín',
      'extintor': 'Extintor',
      'cunas': 'Cuñas de bloqueo',
      'llanta_repuesto': 'Llanta de repuesto',
      'caja_herramientas': 'Caja de herramientas',
      'linterna': 'Linterna',
      'gato': 'Gato elevador',
      'buies_barra': 'Buies barra estabilizadora',
      'buies_tiera': 'Buies de tierra',
      'cuna_motor': 'Cuna de motor',
      'guardapolvo_axiales': 'Guardapolvo axiales',
      'amortiguadores': 'Amortiguadores',
      'hojas_muelles': 'Hojas de muelles',
      'silenciadores': 'Silenciadores',
      'tanques_compresor': 'Tanques compresor'
    };

    // 🎨 Construir el HTML del mensaje
    let missingHtml = `<div class="text-start"><p class="mb-2">Para exportar a PDF, completa los siguientes ítems:</p>`;

    Object.entries(missingByCategory).forEach(([category, fields]) => {
      missingHtml += `<div class="mb-2"><strong class="text-primary">${category}</strong><ul class="mb-0 small ps-3">`;
      fields.slice(0, 5).forEach(field => { // Mostrar máximo 5 por categoría para no saturar
        const label = fieldLabels[field] || field;
        missingHtml += `<li class="text-muted">• ${label}</li>`;
      });
      if (fields.length > 5) {
        missingHtml += `<li class="text-muted fst-italic">• y ${fields.length - 5} más...</li>`;
      }
      missingHtml += `</ul></div>`;
    });

    missingHtml += `</div>`;

    // 🚨 Mostrar SweetAlert con detalles
    Swal.fire({
      title: `<i class="fas fa-clipboard-list text-warning"></i> Inspección incompleta`,
      html: missingHtml,
      icon: 'warning',
      width: '600px',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#02376b',
      showCancelButton: true,
      cancelButtonText: 'Ir a completar',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
      backdrop: true,
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed) {
        // Usuario cerró la alerta
        console.log('Usuario cerró la alerta de campos pendientes');
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Usuario quiere ir a completar → hacer scroll a la sección de inspección
        const inspectionSection = document.querySelector('#electrico');
        if (inspectionSection) {
          inspectionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Resaltar visualmente la sección
          inspectionSection.classList.add('bg-light', 'p-2', 'rounded');
          setTimeout(() => {
            inspectionSection.classList.remove('bg-light', 'p-2', 'rounded');
          }, 2000);
        }
      }
    });
  }
  // IMPORTANTE: Limpiar la suscripción para evitar memory leaks
  ngOnDestroy(): void {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
  }/**
 * Previsualiza el estado que tendría la inspección con los cambios actuales
 * (sin guardar, solo para mostrar al usuario)
 */
  previsualizarEstado(): 'aprobada' | 'rechazada' | 'borrador' {
    const formData = { ...this.inspectionForm.value };
    return this.calcularEstadoInspeccion(formData);
  }
  ngOnInit(): void {
    // Suscribirse a los cambios del formulario principal
    this.formSubscription = this.inspectionForm.valueChanges.subscribe(() => {
      // El formulario se marca como 'dirty' cuando el usuario modifica algún valor
      this.hasChanges = this.inspectionForm.dirty;
    });

    this.phoneForm.valueChanges.subscribe(() => {
      // El formulario se marca como 'dirty' cuando el usuario modifica algún valor
      this.hasChanges = this.phoneForm.dirty;
    });
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
   * Calcula el estado de la inspección según las reglas de negocio:
   * - 'borrador': Si hay al menos 1 campo de inspección sin seleccionar (vacío)
   * - 'rechazada': Si hay al menos 1 campo con valor 'negativo' (N/C)
   * - 'aprobada': Si todos los campos tienen valor seleccionado y ninguno es 'negativo'
   */
  private calcularEstadoInspeccion(formData: any): 'aprobada' | 'rechazada' | 'borrador' {
    // Lista de todos los campos de inspección con opciones C/N/C/N/A (radio buttons)
    // Excluye campos numéricos (profundidad de labrado, presión) y campos de texto/fecha
    const inspectionFields = [
      // Sistema Eléctrico
      'luces_navegacion', 'luces_frenado', 'luces_direccionales', 'luz_reversa',
      'luces_estacionamiento', 'luces_posicion', 'luz_antineblina', 'luz_placa',
      'tablero_instrumentos', 'bocina', 'bateria', 'aire_acondicionado',

      // Sistema Motor
      'aceite_motor', 'aceite_transmision', 'liquido_refrigerante',
      'filtro_aire', 'tension_correas',

      // Carrocería
      'parachoque_delantero', 'parachoque_trasero', 'vidrios_seguridad', 'vidrios_laterales',
      'limpia_brisas', 'guardabarros', 'estribos_laterales', 'placa_adhesivo', 'chapa_compuerta',

      // Cabina
      'tapiceria', 'manijas_seguros', 'vidrios_electricos', 'antideslizantes_pedales',
      // 'freno_mano', 
      'tablero_instrumentos_interno',

      // Seguridad Activa
      // 'sistema_frenos',
      'abs',
      // 'sistema_direccion', 
      'espejos_laterales',
      'espejo_interno',

      // Seguridad Pasiva
      'cinturones_seguridad', 'airbags', 'cadena_sujecion',
      'apoyacabezas', 'barra_antivuelco', 'rejilla_vidrio_trasero',

      // Kit de Carretera
      'conos_triangular', 'botiquin', 'extintor', 'cunas', 'llanta_repuesto',
      'caja_herramientas', 'linterna', 'gato',

      // Parte Baja
      'buies_barra', 'buies_tiera', 'cuna_motor', 'guardapolvo_axiales',
      'amortiguadores', 'hojas_muelles', 'silenciadores', 'tanques_compresor',

      // Sistema de fresno
      'freno_mano_seguridad',
      'liquido_frenos', 'bomba_frenos', 'pedal_frenos',

      //sistema de direccion
      'caja_deposito',
      'terminales',
      'barras_bujes',
      'protectores',

      'columna_direccion',
      'hidraulico_direccion',
    ];

    // 🔍 Verificar campos vacíos (sin seleccionar C/N/C/N/A)
    const emptyFields = inspectionFields.filter(field =>
      !formData[field] || formData[field] === ''
    );

    // 🔍 Verificar campos con "negativo" (N/C)
    const negativeFields = inspectionFields.filter(field =>
      formData[field] === 'negativo'
    );

    // 📋 Regla 1: Si hay al menos 1 campo vacío → BORRADOR
    if (emptyFields.length > 0) {
      console.log(`📝 Estado: borrador (${emptyFields.length} campos pendientes)`);
      return 'borrador';
    }

    // 📋 Regla 2: Si hay al menos 1 campo con "negativo" → RECHAZADA
    if (negativeFields.length > 0) {
      console.log(`❌ Estado: rechazada (${negativeFields.length} ítems no cumplen)`);
      return 'rechazada';
    }

    // 📋 Regla 3: Todos completos y sin negativos → APROBADA
    console.log(`✅ Estado: aprobada (todos los ítems verificados)`);
    return 'aprobada';
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



  async imprimirInspeccion(): Promise<void> {
    try {
      // ✅ Validar estado antes de generar PDF
      const estadoActual = this.inspectionForm.get('estado')?.value;

      if (estadoActual === 'borrador') {
        // 🎯 Mostrar alerta detallada con campos pendientes
        const formData = { ...this.inspectionForm.value };
        this.showNoExportWithDetails(formData);
        return; // Detiene la ejecución
      }
      Swal.fire({
        title: 'Generando PDF...',
        html: 'Procesando datos e imágenes...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // 1. Recolectar datos del formulario
      const formData = {
        // 📋 DATOS DEL PROPIETARIO
        propietario: this.inspectionForm.get('propietario')?.value,
        documento_propietario: this.inspectionForm.get('documento_propietario')?.value,

        // 🚗 DATOS DEL VEHÍCULO
        placa: this.inspectionForm.get('placa')?.value,
        marca: this.inspectionForm.get('marca')?.value,
        modelo: this.inspectionForm.get('modelo')?.value,
        color: this.inspectionForm.get('color')?.value,
        clase_vehiculo: this.inspectionForm.get('clase_vehiculo')?.value,
        codigo_vehiculo: this.inspectionForm.get('codigo_vehiculo')?.value,
        capacidad_pasajeros: Number(this.inspectionForm.get('capacidad_pasajeros')?.value),
        kilometraje: this.inspectionForm.get('kilometraje')?.value,
        soat: this.inspectionForm.get('soat')?.value,
        revision_tecnomecanica: this.inspectionForm.get('revision_tecnomecanica')?.value,
        tarjeta_operacion: this.inspectionForm.get('tarjeta_operacion')?.value,
        licencia_transito: this.inspectionForm.get('licencia_transito')?.value,
        fecha_inspeccion: this.inspectionForm.get('fecha_inspeccion')?.value,
        fecha_vigencia: this.inspectionForm.get('fecha_vigencia')?.value,
        fecha_vencimiento_soat: this.inspectionForm.get('fecha_vencimiento_soat')?.value,
        fecha_vencimiento_revision_tecnomecanica: this.inspectionForm.get('fecha_vencimiento_revision_tecnomecanica')?.value,
        fecha_vencimiento_tarjeta_operacion: this.inspectionForm.get('fecha_vencimiento_tarjeta_operacion')?.value,

        // 👨‍✈️ DATOS DEL CONDUCTOR
        nombres_conductor: this.inspectionForm.get('nombres_conductor')?.value,
        identificacion: this.inspectionForm.get('identificacion')?.value,
        telefono_conductor: this.inspectionForm.get('telefono')?.value,
        fecha_vencimiento_licencia: this.inspectionForm.get('fecha_vencimiento_licencia')?.value,
        nombre_transportadora: this.inspectionForm.get('nombre_transportadora')?.value,

        // ⚡ SISTEMA ELÉCTRICO (OK/Negativo/N/A)
        luces_navegacion: this.inspectionForm.get('luces_navegacion')?.value,
        luces_frenado: this.inspectionForm.get('luces_frenado')?.value,
        luces_direccionales: this.inspectionForm.get('luces_direccionales')?.value,
        luz_reversa: this.inspectionForm.get('luz_reversa')?.value,
        luces_estacionamiento: this.inspectionForm.get('luces_estacionamiento')?.value,
        luces_posicion: this.inspectionForm.get('luces_posicion')?.value,
        luz_antineblina: this.inspectionForm.get('luz_antineblina')?.value,
        luz_placa: this.inspectionForm.get('luz_placa')?.value,
        bocina: this.inspectionForm.get('bocina')?.value,
        bateria: this.inspectionForm.get('bateria')?.value,
        aire_acondicionado: this.inspectionForm.get('aire_acondicionado')?.value,

        // 🔧 CARROCERÍA (OK/Negativo/N/A)
        parachoque_delantero: this.inspectionForm.get('parachoque_delantero')?.value,
        parachoque_trasero: this.inspectionForm.get('parachoque_trasero')?.value,
        vidrios_seguridad: this.inspectionForm.get('vidrios_seguridad')?.value,
        vidrios_laterales: this.inspectionForm.get('vidrios_laterales')?.value,
        limpia_brisas: this.inspectionForm.get('limpia_brisas')?.value,
        guardabarros: this.inspectionForm.get('guardabarros')?.value,
        estribos_laterales: this.inspectionForm.get('estribos_laterales')?.value,
        placa_adhesivo: this.inspectionForm.get('placa_adhesivo')?.value,
        chapa_compuerta: this.inspectionForm.get('chapa_compuerta')?.value,

        // 🎛️ CABINA Y MANDOS (OK/Negativo/N/A)
        tapiceria: this.inspectionForm.get('tapiceria')?.value,
        manijas_seguros: this.inspectionForm.get('manijas_seguros')?.value,
        vidrios_electricos: this.inspectionForm.get('vidrios_electricos')?.value,
        tablero_instrumentos: this.inspectionForm.get('tablero_instrumentos')?.value,
        antideslizantes_pedales: this.inspectionForm.get('antideslizantes_pedales')?.value,

        // SISTEMA DE MOTOR 
        aceite_motor: this.inspectionForm.get('aceite_motor')?.value,
        aceite_transmision: this.inspectionForm.get('aceite_transmision')?.value,
        liquido_refrigerante: this.inspectionForm.get('liquido_refrigerante')?.value,
        liquido_frenos: this.inspectionForm.get('liquido_frenos')?.value,
        filtro_aire: this.inspectionForm.get('filtro_aire')?.value,
        hidraulico_direccion: this.inspectionForm.get('hidraulico_direccion')?.value,
        tension_correas: this.inspectionForm.get('tension_correas')?.value,

        // SEGURIDAD ACTIVA
        sistema_frenos: this.inspectionForm.get('sistema_frenos')?.value,
        abs: this.inspectionForm.get('abs')?.value,
        sistema_direccion: this.inspectionForm.get('sistema_direccion')?.value,
        espejos_laterales: this.inspectionForm.get('espejos_laterales')?.value,
        espejo_interno: this.inspectionForm.get('espejo_interno')?.value,
        freno_mano_seguridad: this.inspectionForm.get('freno_mano_seguridad')?.value,

        //SEGURIDAD PASIVA
        cinturones_seguridad: this.inspectionForm.get('cinturones_seguridad')?.value,
        airbags: this.inspectionForm.get('airbags')?.value,
        cadena_sujecion: this.inspectionForm.get('cadena_sujecion')?.value,
        columna_direccion: this.inspectionForm.get('columna_direccion')?.value,

        apoyacabezas: this.inspectionForm.get('apoyacabezas')?.value,
        barra_antivuelco: this.inspectionForm.get('barra_antivuelco')?.value,
        rejilla_vidrio_trasero: this.inspectionForm.get('rejilla_vidrio_trasero')?.value,

        // KIT DE CARRETERA

        conos_triangular: this.inspectionForm.get('conos_triangular')?.value,
        botiquin: this.inspectionForm.get('botiquin')?.value,
        extintor: this.inspectionForm.get('extintor')?.value,
        cunas: this.inspectionForm.get('cunas')?.value,
        llanta_repuesto: this.inspectionForm.get('llanta_repuesto')?.value,
        caja_herramientas: this.inspectionForm.get('caja_herramientas')?.value,
        linterna: this.inspectionForm.get('linterna')?.value,
        gato: this.inspectionForm.get('gato')?.value,


        //PARTE BAJA
        buies_barra: this.inspectionForm.get('buies_barra')?.value,
        buies_tiera: this.inspectionForm.get('buies_tiera')?.value,
        cuna_motor: this.inspectionForm.get('cuna_motor')?.value,
        guardapolvo_axiales: this.inspectionForm.get('guardapolvo_axiales')?.value,
        amortiguadores: this.inspectionForm.get('amortiguadores')?.value,
        hojas_muelles: this.inspectionForm.get('hojas_muelles')?.value,
        silenciadores: this.inspectionForm.get('silenciadores')?.value,
        tanques_compresor: this.inspectionForm.get('tanques_compresor')?.value,

        // PROFUNDIDAD DE LABRADO
        llanta_di: this.inspectionForm.get('llanta_di')?.value,
        llanta_dd: this.inspectionForm.get('llanta_dd')?.value,
        llanta_tie: this.inspectionForm.get('llanta_tie')?.value,
        llanta_tde: this.inspectionForm.get('llanta_tde')?.value,
        llanta_tii: this.inspectionForm.get('llanta_tii')?.value,
        llanta_tdi: this.inspectionForm.get('llanta_tdi')?.value,

        // PRESION DE AIRE
        presion_llanta_d_li: this.inspectionForm.get('presion_llanta_d_li')?.value,
        presion_llanta_d_ld: this.inspectionForm.get('presion_llanta_d_ld')?.value,
        presion_llanta_t_lie: this.inspectionForm.get('presion_llanta_t_lie')?.value,
        presion_llanta_t_lde: this.inspectionForm.get('presion_llanta_t_lde')?.value,
        presion_llanta_t_lii: this.inspectionForm.get('presion_llanta_t_lii')?.value,
        presion_llanta_t_ldi: this.inspectionForm.get('presion_llanta_t_ldi')?.value,

        // sistema de frenos
        pedal_frenos: this.inspectionForm.get('pedal_frenos')?.value,

        bomba_frenos: this.inspectionForm.get('bomba_frenos')?.value,

        caja_deposito: this.inspectionForm.get('caja_deposito')?.value,
        barras_bujes: this.inspectionForm.get('barras_bujes')?.value,
        protectores: this.inspectionForm.get('protectores')?.value,
        terminales: this.inspectionForm.get('terminales')?.value,




        observaciones: this.inspectionForm.get('observaciones')?.value,

        // ℹ️ CAMPOS ADICIONALES (si los usas en otra lógica)
        estado: this.inspectionForm.get('estado')?.value,
        numero_certificado: this.inspectionForm.get('numero_certificado')?.value,
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
