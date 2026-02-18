import { Component, AfterViewInit, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { InspectionService } from '../../services/inspection.service';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

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

@Component({
  selector: 'app-nueva',
  templateUrl: './nueva.html',
  styleUrls: ['./nueva.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterModule,Router]
})
export class Nueva implements AfterViewInit, OnInit {

  // Array para almacenar archivos seleccionados
  selectedFiles: File[] = [];

  // Array para almacenar previews de las imágenes
  imagePreviews: string[] = [];

  // Estado de subida de imágenes
  isUploadingImages: boolean = false;
  
  // Referencias a los elementos del DOM para los selectores de fecha
  @ViewChild('fechaInspeccion') fechaInspeccionInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaVigencia') fechaVigenciaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaLicencia') fechaLicenciaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaVencimientoSoat') fechaVencimientoSoatInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaVencimientoRevisionTecnomecanica') fechaVencimientoRevisionTecnomecanicaInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fechaVencimientoTarjetaOperacion') fechaVencimientoTarjetaOperacionInput!: ElementRef<HTMLInputElement>;

  // Formulario principal y secundario
  inspectionForm: FormGroup;
  phoneForm: FormGroup;

  // Estado del wizard
  currentStep: number = 1;
  totalSteps: number = 4;

  // Variables para almacenar fechas formateadas
  fechaInspeccion: string = '';
  fechaVigencia: string = '';
  fechaLicencia: string = '';
  fechaVencimientoSoat: string = '';
  fechaVencimientoRevisionTecnomecanica: string = '';
  fechaVencimientoTarjetaOperacion: string = '';

  // Almacena las instancias de los selectores de fecha
  private flatpickrInstances: { [key: string]: any } = {};

  // Control de estado de carga
  isLoading: boolean = false;

  // Usuario actual
  currentUser: string = 'admin';

  constructor(
    private fb: FormBuilder,
    private inspectionService: InspectionService,
    private router: Router
  ) {
    // Inicialización del formulario principal
    this.inspectionForm = this.fb.group({
      // Sección: Fechas (Paso 1)
      fecha_inspeccion: ['', Validators.required],
      fecha_vigencia: ['', Validators.required],

      // Sección: Información del conductor (Paso 2)
      nombre_transportadora: ['', [Validators.required, Validators.minLength(3)]],
      nombres_conductor: ['', [Validators.required, Validators.minLength(3)]],
      identificacion: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      fecha_vencimiento_licencia: ['', Validators.required],
      propietario: ['', [Validators.required, Validators.minLength(3)]],
      documento_propietario: ['', [Validators.required]],
      tipo_propietario: ['', Validators.required],

      // Sección: Información del vehículo (Paso 3)
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

      // === CAMPOS DE INSPECCIÓN DEL VEHÍCULO (Paso 4) ===

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
      // llanta_d_ld: [''],
      // llanta_t_lie: [''],
      // llanta_t_lii: [''],
      // llanta_t_lid: ['']


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


      // === REGISTRO DE DAÑOS FÍSICOS ===
      danos_vista_frontal: [''],        // JSON o texto con coordenadas de daños
      danos_vista_lateral: [''],        // JSON o texto con coordenadas de daños
      danos_vista_trasera: ['']         // JSON o texto con coordenadas de daños
    });

    // Inicialización del formulario del teléfono
    this.phoneForm = this.fb.group({
      localNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      whatsapp: [false] // Default to false
    });
  }
// === MÉTODOS PARA MANEJO DE IMÁGENES ===

// Cuando el usuario selecciona archivos
onFilesSelected(event: any): void {
  const files: FileList = event.target.files;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Validar que sea imagen
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        title: 'Archivo inválido',
        text: `El archivo "${file.name}" no es una imagen`,
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      continue;
    }
    
    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        title: 'Archivo muy pesado',
        text: `La imagen "${file.name}" excede los 5MB`,
        icon: 'warning',
        confirmButtonText: 'Aceptar'
      });
      continue;
    }
    
    // Agregar al array
    this.selectedFiles.push(file);
    
    // Crear preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreviews.push(e.target.result);
    };
    reader.readAsDataURL(file);
  }
  
  // Limpiar input para permitir seleccionar el mismo archivo
  event.target.value = '';
}

// Remover una imagen seleccionada
removeImage(index: number): void {
  this.selectedFiles.splice(index, 1);
  this.imagePreviews.splice(index, 1);
}

// Subir imágenes a PocketBase
async uploadImagesToCollection(): Promise<string[]> {
  if (this.selectedFiles.length === 0) return [];

  this.isUploadingImages = true;

  try {
    const metadata = {
      type: 'inspection',
      userId: this.currentUser,
      uploaded_at: new Date().toISOString()
    };

    const imageIds = await this.inspectionService.uploadMultipleImages(
      this.selectedFiles,
      metadata
    );

    if (imageIds.length > 0) {
      Swal.fire({
        title: 'Imágenes cargadas',
        text: `${imageIds.length} imágenes subidas correctamente`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }

    return imageIds;

  } catch (error: any) {
    console.error('Error al subir imágenes:', error);
    Swal.fire({
      title: 'Error',
      text: error.message || 'No se pudieron cargar las imágenes',
      icon: 'error',
      confirmButtonText: 'Aceptar'
    });
    throw error;
  } finally {
    this.isUploadingImages = false;
  }
}
  ngOnInit() {
    // Sincronizar teléfono entre formularios
    this.phoneForm.get('localNumber')?.valueChanges.subscribe(value => {
      if (value) {
        this.inspectionForm.patchValue({ telefono: value });
      }
    });
  }

  private initStep1DatePickers() {
    if (this.flatpickrInstances['fecha_inspeccion']) return;

    const flatpickrOptions = this.getFlatpickrOptions();

    // Fecha inspección
    this.flatpickrInstances['fecha_inspeccion'] = flatpickr(this.fechaInspeccionInput.nativeElement, {
      ...flatpickrOptions,
      defaultDate: new Date(),
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaInspeccion = dateStr;
        this.inspectionForm.patchValue({ fecha_inspeccion: dateStr });
        this.inspectionForm.get('fecha_inspeccion')?.markAsTouched();
      }
    });

    // Fecha vigencia
    this.flatpickrInstances['fecha_vigencia'] = flatpickr(this.fechaVigenciaInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaVigencia = dateStr;
        this.inspectionForm.patchValue({ fecha_vigencia: dateStr });
        this.inspectionForm.get('fecha_vigencia')?.markAsTouched();
      }
    });
  }

  private initStep2DatePickers() {
    if (this.flatpickrInstances['fecha_vencimiento_licencia']) return;

    const flatpickrOptions = this.getFlatpickrOptions();

    this.flatpickrInstances['fecha_vencimiento_licencia'] = flatpickr(this.fechaLicenciaInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaLicencia = dateStr;
        this.inspectionForm.patchValue({ fecha_vencimiento_licencia: dateStr });
        this.inspectionForm.get('fecha_vencimiento_licencia')?.markAsTouched();
      }
    });
  }

  private initStep3DatePickers() {
    if (this.flatpickrInstances['fecha_vencimiento_soat']) return;
    if (this.flatpickrInstances['fecha_vencimiento_revision_tecnomecanica']) return;
    if (this.flatpickrInstances['fecha_vencimiento_tarjeta_operacion']) return;

    const flatpickrOptions = this.getFlatpickrOptions();

    this.flatpickrInstances['fecha_vencimiento_soat'] = flatpickr(this.fechaVencimientoSoatInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaVencimientoSoat = dateStr;
        this.inspectionForm.patchValue({ fecha_vencimiento_soat: dateStr });
        this.inspectionForm.get('fecha_vencimiento_soat')?.markAsTouched();
      }
    });

    this.flatpickrInstances['fecha_vencimiento_revision_tecnomecanica'] = flatpickr(
      this.fechaVencimientoRevisionTecnomecanicaInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaVencimientoRevisionTecnomecanica = dateStr;
        this.inspectionForm.patchValue({ fecha_vencimiento_revision_tecnomecanica: dateStr });
        this.inspectionForm.get('fecha_vencimiento_revision_tecnomecanica')?.markAsTouched();
      }
    }
    );

    this.flatpickrInstances['fecha_vencimiento_tarjeta_operacion'] = flatpickr(
      this.fechaVencimientoTarjetaOperacionInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaVencimientoTarjetaOperacion = dateStr;
        this.inspectionForm.patchValue({ fecha_vencimiento_tarjeta_operacion: dateStr });
        this.inspectionForm.get('fecha_vencimiento_tarjeta_operacion')?.markAsTouched();
      }
    }
    );
  }

  private getFlatpickrOptions(): any {
    return {
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
  }
  ngAfterViewInit() {
    if (typeof flatpickr === 'undefined') {
      console.error('Flatpickr no está cargado correctamente');
      return;
    }
    this.initStep1DatePickers();
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

    // Configuración de los date pickers
    const inspeccionPicker = flatpickr(this.fechaInspeccionInput.nativeElement, {
      ...flatpickrOptions,
      defaultDate: new Date(),
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaInspeccion = dateStr;
        this.inspectionForm.patchValue({ fecha_inspeccion: dateStr });
        this.inspectionForm.get('fecha_inspeccion')?.markAsTouched();
      }
    });
    this.flatpickrInstances['push'](inspeccionPicker);
    const vigenciaPicker = flatpickr(this.fechaVigenciaInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaVigencia = dateStr;
        this.inspectionForm.patchValue({ fecha_vigencia: dateStr });
        this.inspectionForm.get('fecha_vigencia')?.markAsTouched();
      }
    });
    this.flatpickrInstances['push'](vigenciaPicker);

    const licenciaPicker = flatpickr(this.fechaLicenciaInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaLicencia = dateStr;
        this.inspectionForm.patchValue({ fecha_vencimiento_licencia: dateStr });
        this.inspectionForm.get('fecha_vencimiento_licencia')?.markAsTouched();
      }
    });
    this.flatpickrInstances['push'](licenciaPicker);

    const soatPicker = flatpickr(this.fechaVencimientoSoatInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaVencimientoSoat = dateStr;
        this.inspectionForm.patchValue({ fecha_vencimiento_soat: dateStr });
        this.inspectionForm.get('fecha_vencimiento_soat')?.markAsTouched();
      }
    });
    this.flatpickrInstances['push'](soatPicker);

    const revisionTecnomecanicaPicker = flatpickr(this.fechaVencimientoRevisionTecnomecanicaInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaVencimientoRevisionTecnomecanica = dateStr;
        this.inspectionForm.patchValue({ fecha_vencimiento_revision_tecnomecanica: dateStr });
        this.inspectionForm.get('fecha_vencimiento_revision_tecnomecanica')?.markAsTouched();
      }
    });
    this.flatpickrInstances['push'](revisionTecnomecanicaPicker);

    const tarjetaOperacionPicker = flatpickr(this.fechaVencimientoTarjetaOperacionInput.nativeElement, {
      ...flatpickrOptions,
      minDate: 'today',
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.fechaVencimientoTarjetaOperacion = dateStr;
        this.inspectionForm.patchValue({ fecha_vencimiento_tarjeta_operacion: dateStr });
        this.inspectionForm.get('fecha_vencimiento_tarjeta_operacion')?.markAsTouched();
      }
    });
    this.flatpickrInstances['push'](tarjetaOperacionPicker);
  }

  ngOnDestroy() {
    // Destruir todas las instancias de flatpickr
    Object.keys(this.flatpickrInstances).forEach(key => {
      if (this.flatpickrInstances[key]?.destroy) {
        this.flatpickrInstances[key].destroy();
      }
    });
    this.flatpickrInstances = {};
  }

  // ===== WIZARD NAVIGATION METHODS =====

  /**
   * Navega al siguiente paso del wizard
   */
  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        setTimeout(() => {
          this.initDatePickersForCurrentStep();
        }, 0);
      }
    }
  }

  /**
   * Navega al paso anterior del wizard
   */
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      setTimeout(() => {
        this.initDatePickersForCurrentStep();
      }, 0);
    }
  }
  private initDatePickersForCurrentStep() {
    switch (this.currentStep) {
      case 1:
        this.initStep1DatePickers();
        break;
      case 2:
        this.initStep2DatePickers();
        break;
      case 3:
        this.initStep3DatePickers();
        break;
      // Paso 4 no tiene date pickers
    }
  }


  /**
   * Valida los campos del paso actual
   */
  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return this.validateStep1();
      case 2:
        return this.validateStep2();
      case 3:
        return this.validateStep3();
      case 4:
        return true; // Paso 4 no tiene validación obligatoria
      default:
        return true;
    }
  }

  /**
   * Valida el Paso 1: Datos Generales
   */
  private validateStep1(): boolean {
    const fechaInspeccionControl = this.inspectionForm.get('fecha_inspeccion');
    const fechaVigenciaControl = this.inspectionForm.get('fecha_vigencia');

    fechaInspeccionControl?.markAsTouched();
    fechaVigenciaControl?.markAsTouched();

    if (fechaInspeccionControl?.invalid || fechaVigenciaControl?.invalid) {
      this.showStepError('Por favor complete todas las fechas requeridas.');
      return false;
    }

    return true;
  }

  /**
   * Valida el Paso 2: Datos del Conductor
   */
  private validateStep2(): boolean {
    const controls = [
      // 'nombre_transportadora',
      // 'nombres_conductor',
      // 'identificacion',
      // 'telefono',
      'fecha_vencimiento_licencia'
    ];

    let isValid = true;

    controls.forEach(controlName => {
      const control = this.inspectionForm.get(controlName);
      control?.markAsTouched();
      if (control?.invalid) {
        isValid = false;
      }
    });

    if (!isValid) {
      this.showStepError('Por favor complete todos los campos del conductor.');
      return false;
    }

    // Validar teléfono desde phoneForm
    const phoneControl = this.phoneForm.get('localNumber');
    phoneControl?.markAsTouched();
    if (phoneControl?.invalid) {
      this.showStepError('Por favor ingrese un número de teléfono válido de 10 dígitos.');
      return false;
    }

    return true;
  }

  /**
   * Valida el Paso 3: Datos del Vehículo
   */
  private validateStep3(): boolean {
    const requiredControls = [
      // 'placa',
      // 'marca',
      // 'modelo',
      // 'kilometraje',
      // 'fecha_vencimiento_soat',
      // 'fecha_vencimiento_revision_tecnomecanica',
      'fecha_vencimiento_tarjeta_operacion'
    ];

    let isValid = true;

    requiredControls.forEach(controlName => {
      const control = this.inspectionForm.get(controlName);
      control?.markAsTouched();
      if (control?.invalid) {
        isValid = false;
      }
    });

    if (!isValid) {
      this.showStepError('Por favor complete todos los campos obligatorios del vehículo.');
      return false;
    }

    return true;
  }

  /**
   * Muestra un mensaje de error para el paso actual
   */
  private showStepError(message: string) {
    Swal.fire({
      title: 'Campos incompletos',
      text: message,
      icon: 'warning',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#dc3545'
    });
  }

  /**
   * Verifica si el paso actual es el primero
   */
  isFirstStep(): boolean {
    return this.currentStep === 1;
  }

  /**
   * Verifica si el paso actual es el último
   */
  isLastStep(): boolean {
    return this.currentStep === this.totalSteps;
  }

  /**
   * Obtiene el nombre del paso actual
   */
  getStepName(step: number): string {
    const stepNames = [
      'Datos Generales',
      'Datos del Conductor',
      'Datos del Vehículo',
      'Inspección Vehicular'
    ];
    return stepNames[step - 1] || '';
  }

  /**
   * Obtiene el porcentaje de progreso del wizard
   */
  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  // ===== FORM SUBMISSION METHODS =====

  async onSubmit() {
    if (!this.isLoading) {
      // Validar todos los pasos antes de enviar
      if (!this.validateAllSteps()) {
        return;
      }

      console.log('=== PAYLOAD DEL FORMULARIO ===');
      console.log(JSON.stringify(this.inspectionForm.value, null, 2));
      console.log('==============================');

      this.isLoading = true;

      Swal.fire({
        title: 'Procesando...',
        text: 'Guardando la inspección',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
  try {
    // 1. SUBIR IMÁGENES PRIMERO (si hay)
    let imageIds: string[] = [];
    if (this.selectedFiles.length > 0) {
      imageIds = await this.uploadImagesToCollection();
    }

    const inspectionData = this.inspectionForm.value;

    // 2. Validar
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

    // 3. Formatear fechas
    const formatDateForAPI = (dateStr: string) => {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
    };

    // 4. Preparar datos CON LAS IMÁGENES
    const formattedData = {
      ...inspectionData,
      // Incluir el valor de whatsapp del phoneForm
      whatsapp: this.phoneForm.get('whatsapp')?.value || false,
      // Incluir el teléfono del formulario de teléfono
      telefono: this.phoneForm.get('localNumber')?.value || inspectionData.telefono,
      
      fecha_inspeccion: formatDateForAPI(inspectionData.fecha_inspeccion),
      fecha_vigencia: formatDateForAPI(inspectionData.fecha_vigencia),
      fecha_vencimiento_licencia: formatDateForAPI(inspectionData.fecha_vencimiento_licencia),
      fecha_vencimiento_soat: formatDateForAPI(inspectionData.fecha_vencimiento_soat),
      fecha_vencimiento_revision_tecnomecanica: formatDateForAPI(inspectionData.fecha_vencimiento_revision_tecnomecanica),
      fecha_vencimiento_tarjeta_operacion: formatDateForAPI(inspectionData.fecha_vencimiento_tarjeta_operacion),
      created_by: this.currentUser,
      estado: 'borrador',
      kilometraje: Number(inspectionData.kilometraje),
      capacidad_pasajeros: Number(inspectionData.capacidad_pasajeros),

      llanta_di: Number(inspectionData.llanta_di),
      llanta_dd: Number(inspectionData.llanta_dd),
      llanta_tie: Number(inspectionData.llanta_tie),
      llanta_tde: Number(inspectionData.llanta_tde),
      llanta_tii: Number(inspectionData.llanta_tii),
      llanta_tdi: Number(inspectionData.llanta_tdi),
      presion_llanta_d_li: Number(inspectionData.presion_llanta_d_li),
      presion_llanta_d_ld: Number(inspectionData.presion_llanta_d_ld),
      presion_llanta_t_lie: Number(inspectionData.presion_llanta_t_lie),
      presion_llanta_t_lde: Number(inspectionData.presion_llanta_t_lde),
      presion_llanta_t_lii: Number(inspectionData.presion_llanta_t_lii),
      presion_llanta_t_ldi: Number(inspectionData.presion_llanta_t_ldi),
      
      // 5. GUARDAR LOS IDs DE LAS IMÁGENES EN EL CAMPO JSON
      images: imageIds
    };

    console.log('Datos a enviar:', JSON.stringify(formattedData, null, 2));

    // 6. Crear inspección
    await this.inspectionService.createInspection(formattedData).toPromise();

    Swal.close();
    await Swal.fire({
      title: '¡Éxito!',
      text: 'La inspección ha sido creada correctamente',
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#198754'
    });

    this.resetForms();
    this.currentStep = 1;

  } catch (error: any) {
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
   
    }
  }

  /**
   * Valida todos los pasos antes del envío final
   */
  private validateAllSteps(): boolean {
    // Validar paso 1
    if (!this.validateStep1()) {
      this.currentStep = 1;
      return false;
    }

    // Validar paso 2
    if (!this.validateStep2()) {
      this.currentStep = 2;
      return false;
    }

    // Validar paso 3
    if (!this.validateStep3()) {
      this.currentStep = 3;
      return false;
    }

    // Paso 4 no requiere validación obligatoria

    return true;
  }

  /**
   * Reinicia los formularios a su estado inicial
   */
  // private resetForms() {
  //   this.inspectionForm.reset();
  //   this.phoneForm.reset();
  //   this.fechaInspeccion = '';
  //   this.fechaVigencia = '';
  //   this.fechaLicencia = '';
  //   this.fechaVencimientoSoat = '';
  //   this.fechaVencimientoRevisionTecnomecanica = '';
  //   this.fechaVencimientoTarjetaOperacion = '';

  //   if (this.flatpickrInstances[0]) {
  //     this.flatpickrInstances[0].setDate(new Date());
  //   }
  // }
  private resetForms() {
  this.inspectionForm.reset();
  this.phoneForm.reset();
  
  // Limpiar imágenes
  this.selectedFiles = [];
  this.imagePreviews = [];
  
  this.fechaInspeccion = '';
  this.fechaVigencia = '';
  this.fechaLicencia = '';
  this.fechaVencimientoSoat = '';
  this.fechaVencimientoRevisionTecnomecanica = '';
  this.fechaVencimientoTarjetaOperacion = '';

  if (this.flatpickrInstances[0]) {
    this.flatpickrInstances[0].setDate(new Date());
  }
  this.router.navigate(['/home']);
}
}