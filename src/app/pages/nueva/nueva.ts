import { Component, AfterViewInit, ElementRef, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { InspectionService } from '../../services/inspection.service';
import { RouterModule } from '@angular/router';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { SignaturePadComponent, NgSignaturePadOptions } from '@almothafar/angular-signature-pad';
import { AuthService } from '../../services/auth.service';
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
    @ViewChild('signaturePad', { read: ElementRef })
    signaturePadElement!: ElementRef<HTMLCanvasElement>;
    signaturePadOptions: NgSignaturePadOptions = {
        minWidth: 2,
        maxWidth: 5,
        penColor: 'rgb(0, 0, 0)',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        throttle: 16,
        minDistance: 5
    };
    @ViewChild('signaturePad')
    signaturePad!: SignaturePadComponent;
    firmaInspectorBase64: string | null = null;
    firmaBase64: string | null = null;
    selectedFiles: File[] = [];
    imagePreviews: string[] = [];
    isUploadingImages: boolean = false;
    @ViewChild('fechaInspeccion')
    fechaInspeccionInput!: ElementRef<HTMLInputElement>;
    @ViewChild('fechaVigencia')
    fechaVigenciaInput!: ElementRef<HTMLInputElement>;
    @ViewChild('fechaLicencia')
    fechaLicenciaInput!: ElementRef<HTMLInputElement>;
    @ViewChild('fechaVencimientoSoat')
    fechaVencimientoSoatInput!: ElementRef<HTMLInputElement>;
    @ViewChild('fechaVencimientoRevisionTecnomecanica')
    fechaVencimientoRevisionTecnomecanicaInput!: ElementRef<HTMLInputElement>;
    @ViewChild('fechaVencimientoTarjetaOperacion')
    fechaVencimientoTarjetaOperacionInput!: ElementRef<HTMLInputElement>;
    inspectionForm: FormGroup;
    phoneForm: FormGroup;
    currentStep: number = 1;
    totalSteps: number = 5;
    fechaInspeccion: string = '';
    fechaVigencia: string = '';
    fechaLicencia: string = '';
    fechaVencimientoSoat: string = '';
    fechaVencimientoRevisionTecnomecanica: string = '';
    fechaVencimientoTarjetaOperacion: string = '';
    private flatpickrInstances: {
        [key: string]: any;
    } = {};
    isLoading: boolean = false;
    currentUser: string = '';
    nextCertificateNumber: string = '';
    constructor(private fb: FormBuilder, private inspectionService: InspectionService, private router: Router, private route: ActivatedRoute, public sharedService: SharedService, private authService: AuthService) {
        this.inspectionForm = this.fb.group({
            fecha_inspeccion: ['', Validators.required],
            fecha_vigencia: ['', Validators.required],
            nombre_transportadora: ['', [Validators.required, Validators.minLength(3)]],
            nombres_conductor: ['', [Validators.required, Validators.minLength(3)]],
            identificacion: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
            telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
            fecha_vencimiento_licencia: [''],
            propietario: ['', [Validators.required, Validators.minLength(3)]],
            documento_propietario: ['', [Validators.required]],
            tipo_propietario: ['', Validators.required],
            placa: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{6,8}$/)]],
            marca: ['', [Validators.required]],
            modelo: ['', [Validators.required]],
            kilometraje: ['', [Validators.required, Validators.min(0)]],
            color: [''],
            codigo_vehiculo: [''],
            capacidad_pasajeros: ['', [Validators.required, Validators.min(0)]],
            soat: ['', Validators.required],
            licencia_transito: ['', Validators.required],
            revision_tecnomecanica: ['', Validators.required],
            clase_vehiculo: [''],
            fecha_vencimiento_soat: ['', Validators.required],
            fecha_vencimiento_revision_tecnomecanica: ['', Validators.required],
            observaciones: [''],
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
            aceite_motor: [''],
            aceite_transmision: [''],
            liquido_refrigerante: [''],
            filtro_aire: [''],
            tension_correas: [''],
            parachoque_delantero: [''],
            parachoque_trasero: [''],
            vidrios_seguridad: [''],
            vidrios_laterales: [''],
            limpia_brisas: [''],
            guardabarros: [''],
            estribos_laterales: [''],
            placa_adhesivo: [''],
            chapa_compuerta: [''],
            tapiceria: [''],
            manijas_seguros: [''],
            vidrios_electricos: [''],
            antideslizantes_pedales: [''],
            freno_mano: [''],
            tablero_instrumentos_interno: [''],
            sistema_frenos: [''],
            abs: [''],
            sistema_direccion: [''],
            espejos_laterales: [''],
            espejo_interno: [''],
            cinturones_seguridad: [''],
            airbags: [''],
            cadena_sujecion: [''],
            apoyacabezas: [''],
            barra_antivuelco: [''],
            rejilla_vidrio_trasero: [''],
            conos_triangular: [''],
            botiquin: [''],
            extintor: [''],
            cunas: [''],
            llanta_repuesto: [''],
            caja_herramientas: [''],
            linterna: [''],
            gato: [''],
            buies_barra: [''],
            buies_tiera: [''],
            cuna_motor: [''],
            guardapolvo_axiales: [''],
            amortiguadores: [''],
            hojas_muelles: [''],
            silenciadores: [''],
            tanques_compresor: [''],
            llanta_di: [''],
            llanta_dd: [''],
            llanta_tie: [''],
            llanta_tde: [''],
            llanta_tii: [''],
            llanta_tdi: [''],
            presion_llanta_d_li: [''],
            presion_llanta_d_ld: [''],
            presion_llanta_t_lie: [''],
            presion_llanta_t_lde: [''],
            presion_llanta_t_lii: [''],
            presion_llanta_t_ldi: [''],
            freno_mano_seguridad: [''],
            liquido_frenos: [''],
            bomba_frenos: [''],
            pedal_frenos: [''],
            hidraulico_direccion: [''],
            columna_direccion: [''],
            caja_deposito: [''],
            barras_bujes: [''],
            terminales: [''],
            protectores: [''],
        });
        this.phoneForm = this.fb.group({
            telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
            whatsapp: [false]
        });
    }
    private resizeCanvas(): void {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const canvas = this.signaturePadElement?.nativeElement.querySelector('canvas');
        if (!canvas) {
            console.warn('Canvas no encontrado');
            return;
        }
        const data = this.signaturePad?.toData();
        const container = canvas.parentElement;
        if (!container)
            return;
        canvas.width = container.offsetWidth * ratio;
        canvas.height = 250 * ratio;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(ratio, ratio);
        }
        canvas.style.width = '100%';
        canvas.style.height = '250px';
        if (data && data.length > 0) {
            this.signaturePad?.fromData(data);
        }
        console.log('Canvas redimensionado:', {
            width: canvas.width,
            height: canvas.height,
            ratio: ratio
        });
    }
    private initSignaturePad() {
        if (this.signaturePad) {
            try {
                this.signaturePad.set('minWidth', 2);
                this.signaturePad.set('maxWidth', 5);
                console.log('✅ Signature pad inicializado correctamente');
            }
            catch (error) {
                console.warn('Error al inicializar signature pad:', error);
            }
        }
        else {
            console.warn('⚠️ Signature pad no está disponible aún');
        }
    }
    onFilesSelected(event: any): void {
        const files: FileList = event.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) {
                Swal.fire({
                    title: 'Archivo inválido',
                    text: `El archivo "${file.name}" no es una imagen`,
                    icon: 'warning',
                    confirmButtonText: 'Aceptar'
                });
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                Swal.fire({
                    title: 'Archivo muy pesado',
                    text: `La imagen "${file.name}" excede los 5MB`,
                    icon: 'warning',
                    confirmButtonText: 'Aceptar'
                });
                continue;
            }
            this.selectedFiles.push(file);
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.imagePreviews.push(e.target.result);
            };
            reader.readAsDataURL(file);
        }
        event.target.value = '';
    }
    removeImage(index: number): void {
        this.selectedFiles.splice(index, 1);
        this.imagePreviews.splice(index, 1);
    }
    async uploadImagesToCollection(): Promise<string[]> {
        if (this.selectedFiles.length === 0)
            return [];
        this.isUploadingImages = true;
        try {
            const metadata = {
                type: 'inspection',
                userId: this.currentUser,
                uploaded_at: new Date().toISOString()
            };
            const imageIds = await this.inspectionService.uploadMultipleImages(this.selectedFiles, metadata);
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
        }
        catch (error: any) {
            console.error('Error al subir imágenes:', error);
            Swal.fire({
                title: 'Error',
                text: error.message || 'No se pudieron cargar las imágenes',
                icon: 'error',
                confirmButtonText: 'Aceptar'
            });
            throw error;
        }
        finally {
            this.isUploadingImages = false;
        }
    }
    ngOnInit() {
        this.sharedService.currentRoute = this.route.snapshot.url[0].path;
        this.currentUser = this.authService.getCurrentUserId() || '';
        this.phoneForm.get('telefono')?.valueChanges.subscribe(value => {
            if (value) {
                this.inspectionForm.patchValue({ telefono: value });
            }
        });
        this.inspectionService.getNextCertificateNumberPreview('U').then(num => {
            this.nextCertificateNumber = num;
        }).catch(error => {
            console.error('Error al obtener número de certificado:', error);
        });
    }
    private initStep1DatePickers() {
        if (this.flatpickrInstances['fecha_inspeccion'])
            return;
        const flatpickrOptions = this.getFlatpickrOptions();
        this.flatpickrInstances['fecha_inspeccion'] = flatpickr(this.fechaInspeccionInput.nativeElement, {
            ...flatpickrOptions,
            defaultDate: new Date(),
            onChange: (selectedDates: Date[], dateStr: string) => {
                this.fechaInspeccion = dateStr;
                this.inspectionForm.patchValue({ fecha_inspeccion: dateStr });
                this.inspectionForm.get('fecha_inspeccion')?.markAsTouched();
            }
        });
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
    private initStep3DatePickers() {
        if (this.flatpickrInstances['fecha_vencimiento_soat'])
            return;
        if (this.flatpickrInstances['fecha_vencimiento_revision_tecnomecanica'])
            return;
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
        this.flatpickrInstances['fecha_vencimiento_revision_tecnomecanica'] = flatpickr(this.fechaVencimientoRevisionTecnomecanicaInput.nativeElement, {
            ...flatpickrOptions,
            minDate: 'today',
            onChange: (selectedDates: Date[], dateStr: string) => {
                this.fechaVencimientoRevisionTecnomecanica = dateStr;
                this.inspectionForm.patchValue({ fecha_vencimiento_revision_tecnomecanica: dateStr });
                this.inspectionForm.get('fecha_vencimiento_revision_tecnomecanica')?.markAsTouched();
            }
        });
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
    @ViewChild('signaturePadInspector')
    signaturePadInspector!: SignaturePadComponent;
    @ViewChild('signaturePadInspector', { read: ElementRef })
    signaturePadInspectorElement!: ElementRef<HTMLCanvasElement>;
    onFirmaInspectorCompletada() {
        if (!this.signaturePadInspector) {
            console.error('❌ ERROR: signaturePadInspector no disponible');
            return;
        }
        if (this.signaturePadInspector.isEmpty()) {
            console.warn('⚠️ Canvas del inspector vacío');
            return;
        }
        try {
            this.firmaInspectorBase64 = this.signaturePadInspector.toDataURL('image/png');
            console.log('✅ Firma del inspector capturada:', this.firmaInspectorBase64?.substring(0, 50) + '...');
            console.log('📊 Longitud:', this.firmaInspectorBase64?.length);
        }
        catch (error) {
            console.error('❌ Error al capturar firma del inspector:', error);
        }
    }
    limpiarFirmaInspector() {
        try {
            if (this.signaturePadInspector) {
                this.signaturePadInspector.clear();
                console.log('🧹 Firma del inspector limpiada');
            }
            this.firmaInspectorBase64 = null;
        }
        catch (error) {
            console.error('Error al limpiar firma del inspector:', error);
        }
    }
    onDibujoInicioInspector(event: MouseEvent | Touch) {
        console.log('Inicio firma inspector', event);
    }
    onFirmaCompletada() {
        if (!this.signaturePad) {
            Swal.fire('Error', 'El canvas de firma no está disponible', 'error');
            return;
        }
        if (this.signaturePad.isEmpty()) {
            Swal.fire('Atención', 'Por favor firme antes de continuar', 'warning');
            return;
        }
        this.firmaBase64 = this.signaturePad.toDataURL('image/png');
        console.log('✅ Firma capturada:', this.firmaBase64?.substring(0, 50) + '...');
    }
    limpiarFirma() {
        try {
            if (this.signaturePad) {
                this.signaturePad.clear();
                console.log('Firma limpiada correctamente');
            }
            else {
                console.warn('Signature pad no disponible para limpiar');
            }
            this.firmaBase64 = null;
        }
        catch (error) {
            console.error('Error al limpiar la firma:', error);
            this.firmaBase64 = null;
        }
    }
    onDibujoInicio(event: MouseEvent | Touch) {
        console.log('Inicio de firma', event);
    }
    ngOnDestroy() {
        Object.keys(this.flatpickrInstances).forEach(key => {
            if (this.flatpickrInstances[key]?.destroy) {
                this.flatpickrInstances[key].destroy();
            }
        });
        this.flatpickrInstances = {};
    }
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
                break;
            case 3:
                this.initStep3DatePickers();
                break;
        }
    }
    validateCurrentStep(): boolean {
        switch (this.currentStep) {
            case 1: return this.validateStep1();
            case 2: return this.validateStep2();
            case 3: return this.validateStep3();
            case 4:
            case 5: return true;
            default: return true;
        }
    }
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
    private validateStep2(): boolean {
        const controls = [
            'nombre_transportadora',
            'identificacion',
            'nombres_conductor'
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
            this.showStepError('Por favor complete todos los campos del.');
            return false;
        }
        const phoneControl = this.phoneForm.get('telefono');
        phoneControl?.markAsTouched();
        if (phoneControl?.invalid) {
            this.showStepError('Por favor ingrese un número de teléfono válido de 10 dígitos.');
            return false;
        }
        return true;
    }
    private validateStep3(): boolean {
        const requiredControls = [
            'placa',
            'marca',
            'modelo',
            'kilometraje',
            'soat',
            'fecha_vencimiento_soat',
            'licencia_transito',
            'revision_tecnomecanica',
            'fecha_vencimiento_revision_tecnomecanica',
            'capacidad_pasajeros'
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
    async selectImageSource(): Promise<void> {
        const { value: action } = await Swal.fire({
            title: 'Registro Fotográfico',
            html: `
      <div class="text-center">
        <p class="mb-3">¿Cómo deseas agregar las imágenes?</p>
        <div class="d-flex justify-content-center gap-2">
          <button id="swal-camera" class="btn btn-success btn-lg" style="flex: 1;">
            <i class="fas fa-camera d-block mb-1"></i>
            <small>Tomar Foto</small>
          </button>
          <button id="swal-gallery" class="btn btn-primary btn-lg" style="flex: 1;">
            <i class="fas fa-images d-block mb-1"></i>
            <small>Galería</small>
          </button>
        </div>
      </div>
    `,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            didOpen: () => {
                const cameraBtn = document.getElementById('swal-camera');
                const galleryBtn = document.getElementById('swal-gallery');
                cameraBtn?.addEventListener('click', () => {
                    Swal.close({ value: 'camera' });
                });
                galleryBtn?.addEventListener('click', () => {
                    Swal.close({ value: 'gallery' });
                });
            }
        });
        if (action === 'camera') {
            this.openCamera();
        }
        else if (action === 'gallery') {
            this.openGallery();
        }
    }
    openCamera(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.multiple = true;
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                await this.onFilesSelected({ target: { files: target.files, value: '' } });
            }
        };
        input.click();
    }
    openGallery(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                await this.onFilesSelected({ target: { files: target.files, value: '' } });
            }
        };
        input.click();
    }
    private showStepError(message: string) {
        Swal.fire({
            title: 'Campos incompletos',
            text: message,
            icon: 'warning',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#dc3545'
        });
    }
    isFirstStep(): boolean {
        return this.currentStep === 1;
    }
    isLastStep(): boolean {
        return this.currentStep === this.totalSteps;
    }
    getStepName(step: number): string {
        const stepNames = [
            'Datos Generales',
            'Datos del Conductor',
            'Datos del Vehículo',
            'Inspección Vehicular',
            'Observaciones y Fotos'
        ];
        return stepNames[step - 1] || '';
    }
    getProgressPercentage(): number {
        return (this.currentStep / this.totalSteps) * 100;
    }
    private calculateEstado(inspectionData: any): 'aprobada' | 'rechazada' | 'borrador' {
        const inspectionFields = [
            'luces_navegacion',
            'luces_frenado',
            'luces_direccionales',
            'luz_reversa',
            'luces_estacionamiento', 'luces_posicion', 'luz_antineblina', 'luz_placa',
            'tablero_instrumentos', 'bocina', 'bateria', 'aire_acondicionado',
            'aceite_motor',
            'aceite_transmision',
            'liquido_refrigerante',
            'filtro_aire', 'tension_correas',
            'parachoque_delantero', 'parachoque_trasero', 'vidrios_seguridad', 'vidrios_laterales',
            'limpia_brisas', 'guardabarros', 'estribos_laterales', 'placa_adhesivo', 'chapa_compuerta',
            'tapiceria', 'manijas_seguros', 'vidrios_electricos', 'antideslizantes_pedales',
            'freno_mano', 'tablero_instrumentos_interno',
            'abs', 'espejos_laterales',
            'espejo_interno',
            'cinturones_seguridad', 'airbags', 'cadena_sujecion', 'columna_direccion',
            'apoyacabezas', 'barra_antivuelco', 'rejilla_vidrio_trasero',
            'conos_triangular', 'botiquin', 'extintor', 'cunas', 'llanta_repuesto',
            'caja_herramientas', 'linterna', 'gato',
            'buies_barra', 'buies_tiera', 'cuna_motor', 'guardapolvo_axiales',
            'amortiguadores', 'hojas_muelles', 'silenciadores', 'tanques_compresor',
            'freno_mano_seguridad',
            'liquido_frenos',
            'bomba_frenos',
            'pedal_frenos',
            'caja_deposito',
            'barras_bujes',
            'protectores',
            'terminales',
            'hidraulico_direccion',
        ];
        const emptyFields = inspectionFields.filter(field => !inspectionData[field] || inspectionData[field] === '' || inspectionData[field] === null);
        const negativeFields = inspectionFields.filter(field => inspectionData[field] === 'negativo' || inspectionData[field] === 'N/C' || inspectionData[field] === 'no cumple');
        if (emptyFields.length > 0) {
            console.log(`📝 Estado calculado: borrador (${emptyFields.length} campos pendientes)`);
            return 'borrador';
        }
        if (negativeFields.length > 0) {
            console.log(`❌ Estado calculado: rechazada (${negativeFields.length} ítems no cumplen)`);
            return 'rechazada';
        }
        console.log(`✅ Estado calculado: aprobada (todos los ítems verificados)`);
        return 'aprobada';
    }
    async onSubmit() {
        if (!this.isLoading) {
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
                let imageIds: string[] = [];
                if (this.selectedFiles.length > 0) {
                    imageIds = await this.uploadImagesToCollection();
                }
                const inspectionData = this.inspectionForm.value;
                const estado = this.calculateEstado(inspectionData);
                const numero_certificado = await this.inspectionService.getNextCertificateNumber('U');
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
                const formatDateForAPI = (dateStr: string) => {
                    const [day, month, year] = dateStr.split('/');
                    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
                };
                const formattedData = {
                    ...inspectionData,
                    whatsapp: this.phoneForm.get('whatsapp')?.value || false,
                    telefono: this.phoneForm.get('telefono')?.value || inspectionData.telefono,
                    fecha_inspeccion: formatDateForAPI(inspectionData.fecha_inspeccion),
                    fecha_vigencia: formatDateForAPI(inspectionData.fecha_vigencia),
                    fecha_vencimiento_soat: formatDateForAPI(inspectionData.fecha_vencimiento_soat),
                    fecha_vencimiento_revision_tecnomecanica: formatDateForAPI(inspectionData.fecha_vencimiento_revision_tecnomecanica),
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
                    firma_conductor: this.firmaBase64,
                    firma_inspector: this.firmaInspectorBase64,
                    numero_certificado: numero_certificado,
                    images: imageIds
                };
                console.log('Datos a enviar:', JSON.stringify(formattedData, null, 2));
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
            }
            catch (error: any) {
                Swal.close();
                await Swal.fire({
                    title: 'Error',
                    text: error.message || 'Ocurrió un error al guardar la inspección',
                    icon: 'error',
                    confirmButtonText: 'Entendido'
                });
            }
            finally {
                this.isLoading = false;
            }
        }
    }
    isFieldFilled(fieldName: string): boolean {
        const control = this.inspectionForm.get(fieldName);
        if (!control)
            return false;
        const value = control.value;
        if (typeof value === 'string') {
            return value.trim() !== '';
        }
        return value !== null && value !== undefined && value !== '';
    }
    getFieldClass(fieldName: string): string {
        return this.isFieldFilled(fieldName) ? 'field-filled' : 'field-empty';
    }
    getPhoneFieldClass(): string {
        const control = this.phoneForm.get('telefono');
        if (!control)
            return 'field-empty';
        const value = control.value;
        return (value && value.trim() !== '') ? 'field-filled' : 'field-empty';
    }
    private validateAllSteps(): boolean {
        if (!this.validateStep1()) {
            this.currentStep = 1;
            return false;
        }
        if (!this.validateStep2()) {
            this.currentStep = 2;
            return false;
        }
        if (!this.validateStep3()) {
            this.currentStep = 3;
            return false;
        }
        return true;
    }
    private resetForms() {
        this.inspectionForm.reset();
        this.phoneForm.reset();
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
