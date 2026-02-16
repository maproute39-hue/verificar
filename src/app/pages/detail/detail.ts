/**
 * Módulos necesarios para el componente de detalle de inspección
 */
import { Component, AfterViewInit, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { InspectionService } from '../../services/inspection.service';
import { Inspection } from '../../models/inspection.model';
import { ExcelExportService } from '../../services/excel-export.service';
import { GotenbergService } from '../../services/gotenberg.service';

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
  imports: [CommonModule, ReactiveFormsModule],
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
   private fb: FormBuilder,
  private inspectionService: InspectionService,
  private route: ActivatedRoute,
  private router: Router,
  private gotenbergService: GotenbergService,        // ✅ Inyectado
  private excelExportService: ExcelExportService,    // ✅ Inyectado
  private datePipe: DatePipe
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
      llanta_d_ld: [''],
      llanta_t_lie: [''],
      llanta_t_lii: [''],
      llanta_t_lid: ['']
    });

    this.phoneForm = this.fb.group({
      localNumber: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
    });
  }

  /**
   * Inicializa el componente y se suscribe a los cambios en los parámetros de la ruta
   * Se ejecuta cuando el componente es inicializado
   */
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
  private loadInspection(id: string): void {
    this.isLoading = true;  // Activa el indicador de carga
    this.inspectionService.getInspectionById(id).subscribe({
      next: (data) => {
        // Al recibir los datos, los asigna al formulario
        this.inspectionData = data;
        this.prepareFormData(data);
        this.isLoading = false;  // Desactiva el indicador de carga
      },
      error: (error) => {
        console.error('Error al cargar la inspección:', error);
        // Muestra un mensaje de error al usuario
        Swal.fire('Error', 'No se pudo cargar la inspección', 'error');
        // Redirige al listado de inspecciones
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
 async imprimirInspeccion(): Promise<void> {
    try {
      // Mostrar SweetAlert de carga
      Swal.fire({
        title: 'Generando PDF...',
        html: 'Procesando datos de la inspección<br><small>Esto puede tomar unos segundos</small>',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // 1. Obtener los datos del formulario
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
        fecha_inspeccion: this.inspectionForm.get('fecha_inspeccion')?.value,
        fecha_vigencia: this.inspectionForm.get('fecha_vigencia')?.value,
        fecha_vencimiento_licencia: this.inspectionForm.get('fecha_vencimiento_licencia')?.value,
        fecha_vencimiento_soat: this.inspectionForm.get('fecha_vencimiento_soat')?.value,
        fecha_vencimiento_revision_tecnomecanica: this.inspectionForm.get('fecha_vencimiento_revision_tecnomecanica')?.value,
        fecha_vencimiento_tarjeta_operacion: this.inspectionForm.get('fecha_vencimiento_tarjeta_operacion')?.value,
        estado: 'borrador',
        capacidad_pasajeros: Number(this.inspectionForm.get('capacidad_pasajeros')?.value),
        llanta_di: Number(this.inspectionForm.get('llanta_di')?.value),
        llanta_dd: Number(this.inspectionForm.get('llanta_dd')?.value),
        llanta_tie: Number(this.inspectionForm.get('llanta_tie')?.value),
        llanta_tde: Number(this.inspectionForm.get('llanta_tde')?.value),
        llanta_tli: Number(this.inspectionForm.get('llanta_tli')?.value),
        llanta_tlii: Number(this.inspectionForm.get('llanta_tlii')?.value),
        llanta_tlid: Number(this.inspectionForm.get('llanta_tlid')?.value),
        llanta_t_lie: Number(this.inspectionForm.get('llanta_t_lie')?.value),
        llanta_t_lii: Number(this.inspectionForm.get('llanta_t_lii')?.value),
        llanta_t_lid: Number(this.inspectionForm.get('llanta_t_lid')?.value),
      };

      // 2. Generar PDF usando el nuevo método
      await this.excelExportService.exportarDatosConductorComoPdf(formData);

      // 3. Cerrar SweetAlert de carga
      Swal.close();

      // 4. Mostrar mensaje de éxito
      Swal.fire({
        icon: 'success',
        title: '¡PDF generado!',
        text: 'El documento ha sido descargado correctamente',
        timer: 2000,
        showConfirmButton: false
      });

    } catch (error) {
      // Cerrar SweetAlert en caso de error
      Swal.close();

      console.error('Error al generar PDF:', error);
      
      // Mostrar mensaje de error al usuario
      const errorMessage = error instanceof Error ? error.message : 'Error al generar el PDF';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonText: 'Aceptar'
      });
    }
  }
}
