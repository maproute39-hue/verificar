import { Component, AfterViewInit, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { InspectionService } from '../../services/inspection.service';
import { RouterModule } from '@angular/router';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { 
  SignaturePadComponent, 
  NgSignaturePadOptions 
} from '@almothafar/angular-signature-pad';
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
  imports: [CommonModule, ReactiveFormsModule, RouterModule, SignaturePadComponent]
})
export class Nueva implements AfterViewInit, OnInit {
  @ViewChild('signaturePad') 
  signaturePad!: SignaturePadComponent;
    // Opciones configurables
  signaturePadOptions: NgSignaturePadOptions = {
    minWidth: 2,
    maxWidth: 5,
    penColor: 'rgb(0, 0, 0)',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    canvasWidth: 500,  // Ancho fijo en px
    canvasHeight: 300  // Alto fijo en px
  };

    firmaBase64: string | null = null;

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
  totalSteps: number = 5;

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

  // Número de certificado próximo
  nextCertificateNumber: string = '';

  constructor(
    private fb: FormBuilder,
    private inspectionService: InspectionService,
    private router: Router,
    private route: ActivatedRoute,
    public sharedService: SharedService
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
      freno_mano: [''],
      tablero_instrumentos_interno: [''],

      // Seguridad Activa
      sistema_frenos: [''],
      abs: [''],
      sistema_direccion: [''],
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

      // ===LABRADO LLANTAS ===
      llanta_di:[''],
      llanta_dd: [''],          // Delantera Derecha
      llanta_tie: [''],         // Trasera Izquierda Exterior
      llanta_tde: [''],         // Trasera Derecha Exterior
      llanta_tii: [''],         // Trasera Izquierda Interior
      llanta_tdi: [''],         // Trasera Derecha Interior

      // === PRESIÓN DE AIRE EN LLANTAS  ===
      presion_llanta_d_li: [''],    // Delantera Izquierda
      presion_llanta_d_ld: [''],    // Delantera Derecha
      presion_llanta_t_lie: [''],   // Trasera Izquierda Exterior
      presion_llanta_t_lde: [''],   // Trasera Derecha Exterior
      presion_llanta_t_lii: [''],   // Trasera Izquierda Interior
      presion_llanta_t_ldi: [''],   // Trasera Derecha Interior


      // SISTEMA DE FRENOS
      freno_mano_seguridad: [''],
      liquido_frenos: [''],
      bomba_frenos: [''],
      pedal_frenos: [''],

      // SISTEMA DE DIRECCION

      hidraulico_direccion: [''],
      columna_direccion: [''],

      caja_deposito: [''],
      barras_bujes: [''],
      terminales: [''],
      protectores: [''],



    });

    // Inicialización del formulario del teléfono
    this.phoneForm = this.fb.group({
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      whatsapp: [false] // Valor por defecto: falso
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
    this.sharedService.currentRoute = this.route.snapshot.url[0].path;
    // Sincronizar teléfono entre formularios
    this.phoneForm.get('telefono')?.valueChanges.subscribe(value => {
      if (value) {
        this.inspectionForm.patchValue({ telefono: value });
      }
    });

    // Obtener el próximo número de certificado (sin actualizar)
    this.inspectionService.getNextCertificateNumberPreview('U').then(num => {
      this.nextCertificateNumber = num;
    }).catch(error => {
      console.error('Error al obtener número de certificado:', error);
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
    this.initSignaturePad();

    if (typeof flatpickr === 'undefined') {
      console.error('Flatpickr no está cargado correctamente');
      return;
    }
    this.initStep1DatePickers();
  }

  private initSignaturePad() {
    if (this.signaturePad) {
      this.signaturePad.set('minWidth', 2);
    }
  }
  // Cuando el usuario termina de firmar
  onFirmaCompletada() {
    if (this.signaturePad && this.signaturePad.isEmpty()) {
      alert('Por favor, firme antes de continuar');
      return;
    }
    
    // Obtener la firma como imagen Base64
    this.firmaBase64 = this.signaturePad.toDataURL('image/png');
    console.log('Firma capturada:', this.firmaBase64);
    
    // Aquí puedes enviarla a tu backend
    // this.servicio.guardarFirma(this.firmaBase64).subscribe(...);
  }
  // Limpiar la firma
  limpiarFirma() {
    if (this.signaturePad) {
      this.signaturePad.clear();
    }
    this.firmaBase64 = null;
  }

  // Opcional: cuando empieza a dibujar
  onDibujoInicio(event: MouseEvent | Touch) {
    console.log('Inicio de firma', event);
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
          this.initSignaturePad();
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
        this.initSignaturePad();
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
      // Casos 4 y 5 no tienen date pickers
    }
  }


  /**
   * Valida los campos del paso actual
   */
  validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1: return this.validateStep1();
      case 2: return this.validateStep2();
      case 3: return this.validateStep3();
      case 4:
      case 5: return true; // Pasos 4 y 5 sin validación obligatoria
      default: return true;
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
    const phoneControl = this.phoneForm.get('telefono');
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
      'Inspección Vehicular',
      'Observaciones y Fotos'  // 👈 Nuevo paso 5
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

  /**
   * Calcula el estado de la inspección basado en los campos de inspección
   */
  /**
   * Calcula el estado de la inspección según las reglas de negocio:
   * - 'borrador': Si hay al menos 1 campo de inspección sin seleccionar (vacío)
   * - 'rechazada': Si hay al menos 1 campo con valor 'negativo' (N/C)
   * - 'aprobada': Si todos los campos tienen valor seleccionado y ninguno es 'negativo'
   * 
   * @param inspectionData - Objeto con los datos del formulario de inspección
   * @returns 'aprobada' | 'rechazada' | 'borrador'
   */
  private calculateEstado(inspectionData: any): 'aprobada' | 'rechazada' | 'borrador' {
    // Lista completa de campos de inspección con opciones C/N/C/N/A (radio buttons)
    // Excluye campos numéricos (profundidad, presión) y campos de texto/fecha
    const inspectionFields = [
      // Sistema Eléctrico
      'luces_navegacion', 
      'luces_frenado',
       'luces_direccionales',
        'luz_reversa',
      'luces_estacionamiento', 'luces_posicion', 'luz_antineblina', 'luz_placa',
      'tablero_instrumentos', 'bocina', 'bateria', 'aire_acondicionado',

      // Sistema Motor
      'aceite_motor',
      'aceite_transmision',
      'liquido_refrigerante',
      'filtro_aire', 'tension_correas',

      // Carrocería
      'parachoque_delantero', 'parachoque_trasero', 'vidrios_seguridad', 'vidrios_laterales',
      'limpia_brisas', 'guardabarros', 'estribos_laterales', 'placa_adhesivo', 'chapa_compuerta',

      // Cabina
      'tapiceria', 'manijas_seguros', 'vidrios_electricos', 'antideslizantes_pedales',
      'freno_mano', 'tablero_instrumentos_interno',

      // Seguridad Activa
      'abs', 'espejos_laterales',
      'espejo_interno',

      // Seguridad Pasiva
      'cinturones_seguridad', 'airbags', 'cadena_sujecion', 'columna_direccion',
      'apoyacabezas', 'barra_antivuelco', 'rejilla_vidrio_trasero',

      // Kit de Carretera
      'conos_triangular', 'botiquin', 'extintor', 'cunas', 'llanta_repuesto',
      'caja_herramientas', 'linterna', 'gato',

      // Parte Baja
      'buies_barra', 'buies_tiera', 'cuna_motor', 'guardapolvo_axiales',
      'amortiguadores', 'hojas_muelles', 'silenciadores', 'tanques_compresor',

      //Sistema Frenos
      //  'sistema_frenos',
      'freno_mano_seguridad',
      'liquido_frenos',
      'bomba_frenos',
      'pedal_frenos',

      //Sistema de Dirección
      // 'sistema_direccion',
      'caja_deposito',
      'barras_bujes',
      'protectores',
      'terminales',
      'hidraulico_direccion',

    ];

    // 🔍 Verificar campos vacíos (sin seleccionar C/N/C/N/A)
    const emptyFields = inspectionFields.filter(field =>
      !inspectionData[field] || inspectionData[field] === '' || inspectionData[field] === null
    );

    // 🔍 Verificar campos con "negativo" (N/C)
    const negativeFields = inspectionFields.filter(field =>
      inspectionData[field] === 'negativo' || inspectionData[field] === 'N/C' || inspectionData[field] === 'no cumple'
    );

    // 📋 Regla 1: Si hay al menos 1 campo vacío → BORRADOR
    if (emptyFields.length > 0) {
      console.log(`📝 Estado calculado: borrador (${emptyFields.length} campos pendientes)`);
      return 'borrador';
    }

    // 📋 Regla 2: Si hay al menos 1 campo con "negativo" → RECHAZADA
    if (negativeFields.length > 0) {
      console.log(`❌ Estado calculado: rechazada (${negativeFields.length} ítems no cumplen)`);
      return 'rechazada';
    }

    // 📋 Regla 3: Todos completos y sin negativos → APROBADA
    console.log(`✅ Estado calculado: aprobada (todos los ítems verificados)`);
    return 'aprobada';
  }

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

        // Calcular estado basado en los campos de inspección
        const estado = this.calculateEstado(inspectionData);

        // 3. Obtener número de certificado
        const numero_certificado = await this.inspectionService.getNextCertificateNumber('U');

        // 4. Validar
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
          telefono: this.phoneForm.get('telefono')?.value || inspectionData.telefono,

          fecha_inspeccion: formatDateForAPI(inspectionData.fecha_inspeccion),
          fecha_vigencia: formatDateForAPI(inspectionData.fecha_vigencia),
          fecha_vencimiento_licencia: formatDateForAPI(inspectionData.fecha_vencimiento_licencia),
          fecha_vencimiento_soat: formatDateForAPI(inspectionData.fecha_vencimiento_soat),
          fecha_vencimiento_revision_tecnomecanica: formatDateForAPI(inspectionData.fecha_vencimiento_revision_tecnomecanica),
          fecha_vencimiento_tarjeta_operacion: formatDateForAPI(inspectionData.fecha_vencimiento_tarjeta_operacion),
          created_by: this.currentUser,
          estado: estado,
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
  firma_conductor: this.firmaBase64,  // Base64 de la imagen

          numero_certificado: numero_certificado,

          // 5. GUARDAR LOS IDs DE LAS IMÁGENES EN EL CAMPO JSON
          images: imageIds
        };

        console.log('Datos a enviar:', JSON.stringify(formattedData, null, 2));

        // 6. Crear inspección
        await this.inspectionService.createInspection(formattedData).toPromise();

        Swal.close();
        const estadoTexto = {
          'aprobada': '✅ Inspección aprobada - Todos los ítems cumplen',
          'rechazada': '❌ Inspección rechazada - Hay ítems que no cumplen',
          'borrador': '📝 Guardado como borrador - Faltan campos por completar'
        };

        await Swal.fire({
          title: '¡Éxito!',
          html: `La inspección ha sido creada correctamente.<br><strong>${estadoTexto[estado]}</strong>`,
          icon: estado === 'rechazada' ? 'warning' : 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: estado === 'rechazada' ? '#ffc107' : '#198754'
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
 * Verifica si un campo del formulario tiene valor
 */
isFieldFilled(fieldName: string): boolean {
  const control = this.inspectionForm.get(fieldName);
  if (!control) return false;
  
  const value = control.value;
  
  if (typeof value === 'string') {
    return value.trim() !== '';
  }
  
  return value !== null && value !== undefined && value !== '';
}

/**
 * Obtiene la clase CSS para un campo según su estado
 */
getFieldClass(fieldName: string): string {
  return this.isFieldFilled(fieldName) ? 'field-filled' : 'field-empty';
}

/**
 * Obtiene la clase CSS para el campo de teléfono (phoneForm)
 */
getPhoneFieldClass(): string {
  const control = this.phoneForm.get('telefono');
  if (!control) return 'field-empty';
  
  const value = control.value;
  return (value && value.trim() !== '') ? 'field-filled' : 'field-empty';
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

    if (this.flatpickrInstances['fecha_inspeccion']) {
      this.flatpickrInstances['fecha_inspeccion'].setDate(new Date());
    }
    this.router.navigate(['/home']);
  }
}