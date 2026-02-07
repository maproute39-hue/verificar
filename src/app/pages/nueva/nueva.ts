import { Component, AfterViewInit, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { InspectionService } from '../../services/inspection.service';

declare const flatpickr: any;

interface FlatpickrOptions {
  locale?: any;
  dateFormat: string;
  allowInput: boolean;
  clickOpens: boolean;
  disableMobile: boolean;
  defaultDate?: string | Date;
  minDate?: string | Date;
  onChange?: (selectedDates: Date[], dateStr: string) => void;
}

/**
 * Componente para la creación de nuevas inspecciones vehiculares.
 * Permite al usuario registrar todos los detalles de una inspección técnica de vehículos,
 * incluyendo información del conductor, del vehículo y resultados de la inspección.
 */
@Component({
  selector: 'app-nueva',
  templateUrl: './nueva.html',
  styleUrls: ['./nueva.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class Nueva implements AfterViewInit, OnInit {
  // Referencias a los elementos del DOM para los selectores de fecha
  @ViewChild('fechaInspeccion') fechaInspeccionInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaVigencia') fechaVigenciaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaLicencia') fechaLicenciaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaVencimientoSoat') fechaVencimientoSoatInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaVencimientoRevisionTecnomecanica') fechaVencimientoRevisionTecnomecanicaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaVencimientoTarjetaOperacion') fechaVencimientoTarjetaOperacionInput!: ElementRef<HTMLInputElement>;
  // Formulario principal que contiene todos los campos de la inspección
  inspectionForm: FormGroup;
  // Formulario secundario para el manejo específico del teléfono
  phoneForm: FormGroup;
  
  // Variables para almacenar fechas formateadas
  fechaInspeccion: string = '';
  fechaVigencia: string = '';
  fechaLicencia: string = '';
  fechaVencimientoSoat: string = '';
  fechaVencimientoRevisionTecnomecanica: string = '';
  fechaVencimientoTarjetaOperacion: string = '';
  
  // Almacena las instancias de los selectores de fecha
  private flatpickrInstances: any[] = [];
  
  // Control de estado de carga
  isLoading: boolean = false;
  
  // Usuario actual (por defecto 'admin')
  currentUser: string = 'admin';

  /**
   * Constructor del componente.
   * Inicializa los formularios y sus validaciones.
   * 
   * @param fb Servicio para la creación de formularios reactivos
   * @param inspectionService Servicio para el manejo de operaciones de inspección
   */
  constructor(
    private fb: FormBuilder,
    private inspectionService: InspectionService
  ) {
    // Inicialización del formulario principal con todos sus campos y validaciones
    this.inspectionForm = this.fb.group({
      // Sección: Fechas
      fecha_inspeccion: ['', Validators.required],
      fecha_vigencia: ['', Validators.required],
      fecha_vencimiento_licencia: ['', Validators.required],
      
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
      capacidad_pasajeros: ['', [Validators.min(0)]],
      soat: [''],
      licencia_transito: [''],
      revision_tecnomecanica: [''],
      clase_vehiculo: [''],
      tarjeta_operacion: [''],
      

            fecha_vencimiento_soat: ['', Validators.required],
            fecha_vencimiento_revision_tecnomecanica: ['', Validators.required],
            fecha_vencimiento_tarjeta_operacion: ['', Validators.required],

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

    // Inicialización del formulario del teléfono con sus validaciones
    this.phoneForm = this.fb.group({
      localNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
  }
  
  /**
   * Inicialización del componente.
   * Configura la sincronización del campo de teléfono entre formularios.
   */
  ngOnInit() {
    // Sincronizar teléfono entre formularios
    this.phoneForm.get('localNumber')?.valueChanges.subscribe(value => {
      if (value) {
        this.inspectionForm.patchValue({ telefono: value });
      }
    });
  }
  
  /**
   * Maneja el cambio en el campo de fecha de licencia.
   * Actualiza el valor en el formulario reactivo.
   * 
   * @param event Evento de cambio del input
   */
  onFechaLicenciaChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.fechaLicencia = input.value;
    this.inspectionForm.patchValue({
      fecha_vencimiento_licencia: this.formatDate(this.fechaLicencia)
    });
  }

  
  /**
   * Formatea una fecha de DD/MM/YYYY a YYYY-MM-DDTHH:mm:ss.SSSZ
   * 
   * @param dateString Fecha en formato DD/MM/YYYY
   * @returns Fecha formateada en formato ISO 8601 o cadena vacía si no es válida
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    // Convertir de DD/MM/YYYY a YYYY-MM-DD
    const [day, month, year] = dateString.split('/');
    if (day && month && year) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
    }
    return '';
  }
  
  /**
   * Inicialización después de la renderización de la vista.
   * Configura los selectores de fecha con flatpickr.
   */
  ngAfterViewInit() {
    if (typeof flatpickr === 'undefined') {
      console.error('Flatpickr no está cargado correctamente');
      return;
    }

    // Configuración común para todos los selectores de fecha
    const flatpickrOptions: FlatpickrOptions = {
      dateFormat: 'd/m/Y',
      allowInput: true,
      clickOpens: true,
      disableMobile: true,
      locale: {
        firstDayOfWeek: 1,
        weekdays: {
          shorthand: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
          longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        },
        months: {
          shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        }
      }
    };

    // Configuración del selector de fecha de inspección
    const inspeccionPicker = flatpickr(this.fechaInspeccionInput.nativeElement, {
      ...flatpickrOptions,
      defaultDate: new Date(),
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaInspeccion = dateStr;
        this.inspectionForm.patchValue({ fecha_inspeccion: dateStr });
        this.inspectionForm.get('fecha_inspeccion')?.markAsTouched();
      }
    });
    this.flatpickrInstances.push(inspeccionPicker);

    // Configuración del selector de fecha de vigencia
    const vigenciaPicker = flatpickr(this.fechaVigenciaInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaVigencia = dateStr;
        this.inspectionForm.patchValue({ fecha_vigencia: dateStr });
        this.inspectionForm.get('fecha_vigencia')?.markAsTouched();
      }
    });
    this.flatpickrInstances.push(vigenciaPicker);

    // Configuración del selector de fecha de vencimiento de licencia
    const licenciaPicker = flatpickr(this.fechaLicenciaInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaLicencia = dateStr;
        this.inspectionForm.patchValue({ fecha_vencimiento_licencia: dateStr });
        this.inspectionForm.get('fecha_vencimiento_licencia')?.markAsTouched();
      }
    });
    const soatPicker = flatpickr(this.fechaVencimientoSoatInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaVencimientoSoat = dateStr;
        this.inspectionForm.patchValue({ fecha_vencimiento_soat: dateStr });
        this.inspectionForm.get('fecha_vencimiento_soat')?.markAsTouched();
      }
    });
    const revisionTecnomecanicaPicker = flatpickr(this.fechaVencimientoRevisionTecnomecanicaInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaVencimientoRevisionTecnomecanica = dateStr;
        this.inspectionForm.patchValue({ fecha_vencimiento_revision_tecnomecanica: dateStr });
        this.inspectionForm.get('fecha_vencimiento_revision_tecnomecanica')?.markAsTouched();
      }
    });
    const tarjetaOperacionPicker = flatpickr(this.fechaVencimientoTarjetaOperacionInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaVencimientoTarjetaOperacion = dateStr;
        this.inspectionForm.patchValue({ fecha_vencimiento_tarjeta_operacion: dateStr });
        this.inspectionForm.get('fecha_vencimiento_tarjeta_operacion')?.markAsTouched();
      }
    });
    this.flatpickrInstances.push(licenciaPicker);
    this.flatpickrInstances.push(soatPicker);
    this.flatpickrInstances.push(revisionTecnomecanicaPicker);
    this.flatpickrInstances.push(tarjetaOperacionPicker);
  }

  /**
   * Limpieza al destruir el componente.
   * Elimina las instancias de flatpickr para evitar fugas de memoria.
   */
  ngOnDestroy() {
    this.flatpickrInstances.forEach(instance => {
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
    });
  }

  /**
   * Maneja el envío del formulario de inspección.
   * Valida los datos, formatea la información y la envía al servicio de inspecciones.
   */
  async onSubmit() {
    if (!this.isLoading) {
      // Mostrar el payload del formulario en consola
      console.log('=== PAYLOAD DEL FORMULARIO ===');
      console.log(JSON.stringify(this.inspectionForm.value, null, 2));
      console.log('==============================');
      
      this.isLoading = true;

      // Mostrar indicador de carga
      Swal.fire({
        title: 'Procesando...',
        text: 'Guardando la inspección',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        const inspectionData = this.inspectionForm.value;
       
        // Validar datos del formulario
        const validation = this.inspectionService.validateInspectionData(inspectionData);
        if (!validation.valid) {
          Swal.close();
          await Swal.fire({
            title: 'Datos inválidos',
            html: validation.errors.join('<br>'),
            icon: 'error',
            confirmButtonText: 'Corregir'
          });
          this.isLoading = false;
          return;
        }

        // Formatear fechas al formato ISO 8601 para la API
        const formatDateForAPI = (dateStr: string) => {
          const [day, month, year] = dateStr.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
        };

        // Preparar datos para enviar a la API
        const formattedData = {
          ...inspectionData,
          fecha_inspeccion: formatDateForAPI(inspectionData.fecha_inspeccion),
          fecha_vigencia: formatDateForAPI(inspectionData.fecha_vigencia),
          fecha_vencimiento_licencia: formatDateForAPI(inspectionData.fecha_vencimiento_licencia),
          fecha_vencimiento_soat: formatDateForAPI(inspectionData.fecha_vencimiento_soat),
          fecha_vencimiento_revision_tecnomecanica: formatDateForAPI(inspectionData.fecha_vencimiento_revision_tecnomecanica),
          fecha_vencimiento_tarjeta_operacion: formatDateForAPI(inspectionData.fecha_vencimiento_tarjeta_operacion),
          created_by: this.currentUser,
          estado: 'borrador',
          // Asegurarse de que los campos numéricos sean números
          kilometraje: Number(inspectionData.kilometraje),
          capacidad_pasajeros: Number(inspectionData.capacidad_pasajeros)
        };

        console.log('Datos a enviar a la API:', JSON.stringify(formattedData, null, 2));

        // Enviar a la API
        try {
          await this.inspectionService.createInspection(formattedData).toPromise();
          console.log('Inspección guardada correctamente');
        } catch (error) {
          console.error('Error al guardar la inspección:', error);
          throw error;
        }

        Swal.close();
        
        // Mostrar mensaje de éxito
        await Swal.fire({
          title: '¡Éxito!',
          text: 'La inspección ha sido creada correctamente',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#198754'
        });

        // Resetear formularios
        this.resetForms();

      } catch (error: any) {
        // Manejo de errores
        Swal.close();
        await Swal.fire({
          title: 'Error',
          text: error.message || 'Ocurrió un error al guardar la inspección',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      } finally {
        this.isLoading = false;
      }
    } else {
      // Mostrar errores de validación del formulario
      this.handleFormValidationErrors();
    }
  }

  /**
   * Maneja los errores de validación del formulario.
   * Muestra mensajes de error al usuario para campos requeridos no completados.
   */
  private async handleFormValidationErrors() {
    const errors: string[] = [];
    
    if (this.inspectionForm.get('fecha_inspeccion')?.hasError('required')) {
      errors.push('Fecha de inspección: Campo requerido');
    }
    if (this.inspectionForm.get('fecha_vigencia')?.hasError('required')) {
      errors.push('Fecha de vigencia: Campo requerido');
    }
    if (this.inspectionForm.get('telefono')?.hasError('required')) {
      errors.push('Teléfono: Campo requerido');
    }
    if (this.inspectionForm.get('fecha_vencimiento_licencia')?.hasError('required')) {
      errors.push('Fecha de vencimiento de licencia: Campo requerido');
    }
    if (this.inspectionForm.get('fecha_vencimiento_soat')?.hasError('required')) {
      errors.push('Fecha de vencimiento de SOAT: Campo requerido');
    }
    if (this.inspectionForm.get('fecha_vencimiento_revision_tecnomecanica')?.hasError('required')) {
      errors.push('Fecha de vencimiento de revisión tecnomecánica: Campo requerido');
    }
    if (this.inspectionForm.get('fecha_vencimiento_tarjeta_operacion')?.hasError('required')) {
      errors.push('Fecha de vencimiento de tarjeta de operación: Campo requerido');
    }

    // Marcar todos los campos como tocados para mostrar errores
    this.markAllAsTouched();

    // Mostrar mensajes de error
    if (errors.length > 0) {
      await Swal.fire({
        title: 'Formulario incompleto',
        html: errors.join('<br>'),
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
    } else {
      await Swal.fire({
        title: 'Formulario incompleto',
        text: 'Por favor complete todos los campos requeridos',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
    }
  }

  /**
   * Marca todos los controles del formulario como "tocados"
   * para activar la visualización de mensajes de validación.
   */
  private markAllAsTouched() {
    Object.keys(this.inspectionForm.controls).forEach(field => {
      const control = this.inspectionForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
    
    Object.keys(this.phoneForm.controls).forEach(field => {
      const control = this.phoneForm.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }
  
  /**
   * Reinicia los formularios a su estado inicial.
   */
  private resetForms() {
    this.inspectionForm.reset();
    this.phoneForm.reset();
    this.fechaInspeccion = '';
    this.fechaVigencia = '';
    this.fechaLicencia = '';
    this.fechaVencimientoSoat = '';
    this.fechaVencimientoRevisionTecnomecanica = '';
    this.fechaVencimientoTarjetaOperacion = '';
    
    // Restablecer fecha de inspección a la fecha actual
    if (this.flatpickrInstances[0]) {
      this.flatpickrInstances[0].setDate(new Date());
    }
  }
}