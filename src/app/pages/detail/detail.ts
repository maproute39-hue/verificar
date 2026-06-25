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
import { SignaturePadComponent, NgSignaturePadOptions } from '@almothafar/angular-signature-pad';
import { requireConfigValue } from '../../config/app-config';
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
interface InspectionImage {
    id: string | null;
    url: string;
}
@Component({
    selector: 'app-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, LightboxModule, SignaturePadComponent,
    ],
    templateUrl: './detail.html',
    styleUrls: ['./detail.scss'],
    providers: [DatePipe]
})
export class Detail implements OnInit, AfterViewInit {
    private readonly imagesCollectionId = requireConfigValue('imagesCollectionId');
    @ViewChild('signaturePad')
    signaturePad!: SignaturePadComponent;
    @ViewChild('signaturePadInspector')
    signaturePadInspector!: SignaturePadComponent;
    firmaBase64: string | null = null;
    firmaInspectorBase64: string | null = null;
    signaturePadOptions: NgSignaturePadOptions = {
        minWidth: 2,
        maxWidth: 5,
        penColor: 'rgb(0, 0, 0)',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        throttle: 16,
        minDistance: 5
    };
    selectedFiles: File[] = [];
    imagePreviews: string[] = [];
    isUploadingImages: boolean = false;
    imageUploadInput!: ElementRef<HTMLInputElement>;
    @ViewChild('imageUpload')
    set imageUploadSetter(content: ElementRef<HTMLInputElement>) {
        this.imageUploadInput = content;
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
        if (this.selectedFiles.length > 0) {
            this.uploadSelectedImages();
        }
    }
    onFirmaCompletada() {
        if (!this.signaturePad) {
            Swal.fire('Error', 'El canvas de firma no está disponible', 'error');
            return;
        }
        if (this.signaturePad.isEmpty()) {
            return;
        }
        this.firmaBase64 = this.signaturePad.toDataURL('image/png');
        this.inspectionForm.patchValue({
            firma_conductor: this.firmaBase64
        });
        this.hasChanges = true;
    }
    limpiarFirma() {
        if (this.signaturePad) {
            this.signaturePad.clear();
        }
        this.firmaBase64 = null;
        this.inspectionForm.patchValue({
            firma_conductor: null
        });
        this.hasChanges = true;
    }
    onFirmaInspectorCompletada() {
        if (!this.signaturePadInspector) {
            Swal.fire('Error', 'El canvas de firma del inspector no está disponible', 'error');
            return;
        }
        if (this.signaturePadInspector.isEmpty()) {
            return;
        }
        this.firmaInspectorBase64 = this.signaturePadInspector.toDataURL('image/png');
        this.inspectionForm.patchValue({
            firma_inspector: this.firmaInspectorBase64
        });
        this.hasChanges = true;
    }
    limpiarFirmaInspector() {
        if (this.signaturePadInspector) {
            this.signaturePadInspector.clear();
        }
        this.firmaInspectorBase64 = null;
        this.inspectionForm.patchValue({
            firma_inspector: null
        });
        this.hasChanges = true;
    }
    onDibujoInicio(event: MouseEvent | Touch) {
        console.log('Inicio firma conductor', event);
    }
    onDibujoInicioInspector(event: MouseEvent | Touch) {
        console.log('Inicio firma inspector', event);
    }
    async uploadSelectedImages(): Promise<void> {
        if (this.selectedFiles.length === 0)
            return;
        this.isUploadingImages = true;
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            Swal.fire('Error', 'No hay ID de inspección', 'error');
            this.isUploadingImages = false;
            return;
        }
        try {
            Swal.fire({
                title: 'Subiendo imágenes...',
                html: `Procesando ${this.selectedFiles.length} imagen(es)`,
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
            const uploadedImageIds: string[] = [];
            for (const file of this.selectedFiles) {
                const formData = new FormData();
                formData.append('image', file);
                formData.append('inspection', id);
                const uploadedRecord = await this.inspectionService.pb.collection('images').create(formData);
                uploadedImageIds.push(uploadedRecord.id);
            }
            if (uploadedImageIds.length > 0) {
                const inspection = await this.inspectionService.pb.collection('inspections').getOne(id);
                const currentImages = this.normalizeInspectionImagesField(inspection['images']);
                const updatedImages = [...currentImages, ...uploadedImageIds];
                await this.inspectionService.pb.collection('inspections').update(id, {
                    images: updatedImages
                });
                await this.loadInspectionImages(id);
                Swal.fire('Éxito', `${uploadedImageIds.length} imagen(es) subida(s) correctamente`, 'success');
                this.hasChanges = false;
            }
        }
        catch (error) {
            console.error('Error al subir imágenes:', error);
            Swal.fire('Error', 'No se pudieron subir las imágenes', 'error');
        }
        finally {
            this.isUploadingImages = false;
            this.selectedFiles = [];
            this.imagePreviews = [];
            Swal.close();
        }
    }
    async deleteImage(imageUrl: string, index: number): Promise<void> {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            Swal.fire('Error', 'No hay ID de inspección', 'error');
            return;
        }
        const result = await Swal.fire({
            title: '¿Eliminar imagen?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });
        if (!result.isConfirmed) {
            return;
        }
        try {
            Swal.fire({
                title: 'Eliminando...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
            const imageId = this.inspectionImageRecords[index]?.id || this.extractImageIdFromUrl(imageUrl);
            if (imageId) {
                await this.inspectionService.pb.collection('images').delete(imageId);
            }
            const inspection = await this.inspectionService.pb.collection('inspections').getOne(id);
            const currentImages = this.normalizeInspectionImagesField(inspection['images']);
            const updatedImages = currentImages.filter((image: any) => {
                if (!imageId) {
                    return image !== imageUrl;
                }
                if (typeof image === 'string') {
                    return image !== imageId;
                }
                return image?.id !== imageId;
            });
            await this.inspectionService.pb.collection('inspections').update(id, {
                images: updatedImages
            });
            await this.loadInspectionImages(id);
            Swal.fire('Eliminado', 'La imagen ha sido eliminada', 'success');
            this.hasChanges = false;
        }
        catch (error) {
            console.error('Error al eliminar imagen:', error);
            Swal.fire('Error', 'No se pudo eliminar la imagen', 'error');
        }
        finally {
            Swal.close();
        }
    }
    private extractImageIdFromUrl(url: string): string | null {
        const parts = url.split('/');
        if (parts.length >= 3) {
            return parts[parts.length - 2];
        }
        return null;
    }
    removePreviewImage(index: number): void {
        this.selectedFiles.splice(index, 1);
        this.imagePreviews.splice(index, 1);
    }
    stopPropagation(event: Event): void {
        event.stopPropagation();
    }
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
    inspectionImages: string[] = [];
    inspectionImageRecords: InspectionImage[] = [];
    isLoadingImages: boolean = false;
    private album: any[] = [];
    private flatpickrInstances: any[] = [];
    inspectionForm: FormGroup;
    phoneForm: FormGroup;
    inspectionData: Inspection | null = null;
    isLoading: boolean = false;
    hasChanges: boolean = false;
    private formSubscription?: Subscription;
    constructor(private _lightbox: Lightbox, private cdr: ChangeDetectorRef, private fb: FormBuilder, public inspectionService: InspectionService, private route: ActivatedRoute, private router: Router, private gotenbergService: GotenbergService, private excelExportService: ExcelExportService, private datePipe: DatePipe, private ngZone: NgZone) {
        this.excelExportService = new ExcelExportService(this.gotenbergService);
        this.inspectionForm = this.fb.group({
            fecha_inspeccion: ['', Validators.required],
            fecha_vigencia: ['', Validators.required],
            fecha_vencimiento_licencia: ['', Validators.required],
            fecha_vencimiento_soat: ['', Validators.required],
            fecha_vencimiento_revision_tecnomecanica: ['', Validators.required],
            propietario: ['', [Validators.required]],
            documento_propietario: ['', [Validators.required]],
            nombre_transportadora: ['', [Validators.required, Validators.minLength(3)]],
            nombres_conductor: ['', [Validators.required, Validators.minLength(3)]],
            identificacion: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
            telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
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
            estado: ['borrador'],
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
            tablero_instrumentos_interno: [''],
            abs: [''],
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
            numero_certificado: [''],
            freno_mano_seguridad: [''],
            liquido_frenos: [''],
            bomba_frenos: [''],
            pedal_frenos: [''],
            caja_deposito: [''],
            terminales: [''],
            barras_bujes: [''],
            protectores: [''],
            hidraulico_direccion: [''],
            columna_direccion: [''],
            firma_conductor: [''],
            firma_inspector: [''],
        });
        this.phoneForm = this.fb.group({
            telefono: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
        });
    }
    async triggerImageUpload(): Promise<void> {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            const { value: action } = await Swal.fire({
                title: 'Agregar Imágenes',
                html: `
        <div class="text-center">
          <p class="mb-3">¿Cómo deseas agregar las imágenes?</p>
          <div class="d-flex flex-column gap-2">
            <button id="swal-camera" class="btn btn-success btn-lg w-100">
              <i class="fas fa-camera d-block mb-1"></i>
              <span>Tomar Foto</span>
            </button>
            <button id="swal-gallery" class="btn btn-primary btn-lg w-100">
              <i class="fas fa-images d-block mb-1"></i>
              <span>Seleccionar de Galería</span>
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
        else {
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
    private preloadImage(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve();
            img.onerror = (error) => {
                console.error('Error al cargar la imagen:', url, error);
                resolve();
            };
        });
    }
    async loadInspectionImages(inspectionId: string): Promise<void> {
        this.isLoadingImages = true;
        this.album = [];
        this.inspectionImages = [];
        this.inspectionImageRecords = [];
        this.cdr.detectChanges();
        try {
            const inspection = await this.inspectionService.pb.collection('inspections').getOne(inspectionId);
            const images = this.normalizeInspectionImagesField(inspection['images']);
            if (images.length > 0) {
                const loadedImages = (await Promise.all(
                    images.map((image: any) => this.resolveInspectionImage(image))
                )).filter(Boolean) as InspectionImage[];
                this.inspectionImageRecords = loadedImages;
                this.inspectionImages = loadedImages.map(img => img.url);
                this.album = loadedImages.map((img, index) => ({
                    src: img.url,
                    thumb: img.url,
                }));
                this.cdr.detectChanges();
            }
        }
        catch (error) {
            console.error('Error al cargar imágenes:', error);
            Swal.fire('Error', 'No se pudieron cargar las imágenes', 'error');
        }
        finally {
            this.isLoadingImages = false;
            this.cdr.detectChanges();
        }
    }
    private normalizeInspectionImagesField(images: any): any[] {
        if (!images) {
            return [];
        }
        if (Array.isArray(images)) {
            return images;
        }
        if (typeof images === 'string') {
            const trimmed = images.trim();
            if (!trimmed) {
                return [];
            }
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    return Array.isArray(parsed) ? parsed : [parsed];
                }
                catch (error) {
                    console.warn('No se pudo interpretar el campo images como JSON:', error);
                }
            }
            return [trimmed];
        }
        return [images];
    }
    private async resolveInspectionImage(image: any): Promise<InspectionImage | null> {
        try {
            if (typeof image === 'string' && this.isImageUrl(image)) {
                await this.preloadImage(image);
                return {
                    id: this.extractImageIdFromUrl(image),
                    url: image
                };
            }
            const imageRecord = typeof image === 'string'
                ? await this.inspectionService.pb.collection('images').getOne(image)
                : image;
            const imageId = imageRecord?.id || (typeof image === 'string' ? image : null);
            const filename = Array.isArray(imageRecord?.image) ? imageRecord.image[0] : imageRecord?.image;
            if (!imageId || !filename) {
                return null;
            }
            const collectionId = imageRecord?.collectionId || imageRecord?.collectionName || this.imagesCollectionId;
            const url = this.inspectionService.getImageUrl(collectionId, imageId, filename);
            await this.preloadImage(url);
            return {
                id: imageId,
                url
            };
        }
        catch (error) {
            console.error('Error al cargar imagen de inspección:', image, error);
            return null;
        }
    }
    private isImageUrl(value: string): boolean {
        return /^(https?:\/\/|data:image\/|\/|assets\/)/i.test(value);
    }
    async testGotenberg(): Promise<void> {
        try {
            const testBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            console.log('🔄 Probando conexión con Gotenberg...');
            const result = await this.gotenbergService.convertXlsxToPdf(testBlob).toPromise();
            console.log('✅ Gotenberg responde correctamente', result);
        }
        catch (error) {
            console.error('❌ Error de conexión:', error);
        }
    }
    onImageError(event: any): void {
        event.target.src = 'assets/images/no_image.png';
        event.target.onerror = null;
    }
    openImageModal(imageUrl: string, index: number): void {
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
                confirmButtonColor: '#0f0369',
                showCancelButton: currentIndex > 0,
                cancelButtonText: 'Cerrar',
                cancelButtonColor: '#d33',
                showDenyButton: currentIndex < images.length - 1,
                denyButtonText: 'Siguiente',
                denyButtonColor: '#5cb85c',
                background: 'rgba(0,0,0,0.95)',
                padding: '0',
                width: '90%',
                customClass: {
                    container: 'image-modal-fullscreen',
                    image: 'modal-image'
                },
                didOpen: () => {
                    const style = document.createElement('style');
                    style.textContent = `
      .image-modal-fullscreen {
        z-index: 9999 !important;
      }
      .modal-image {
        max-height: 80vh !important;
        object-fit: contain !important;
      }

      .swal2-styled.swal2-confirm {
        background-color: #0f0369 !important;
      }
      .swal2-styled.swal2-deny {
        background-color: #5cb85c !important;
      }
      .swal2-styled.swal2-cancel {
        background-color: #d33 !important;
      }

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
                }
                else if (result.isConfirmed && currentIndex > 0) {
                    currentIndex--;
                    showImage();
                }
            });
        };
        showImage();
    }
    openLightbox(index: number): void {
        this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {
                this.ngZone.run(() => {
                    this._lightbox.open(this.album, index);
                    this.cdr.detectChanges();
                });
            }, 10);
        });
    }
    closeLightbox(): void {
        this._lightbox.close();
    }
    async saveChanges(): Promise<void> {
        try {
            Swal.fire({
                title: 'Guardando...',
                html: 'Procesando cambios de la inspección',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
            const id = this.route.snapshot.paramMap.get('id');
            if (!id)
                throw new Error('No hay ID de inspección');
            const phoneValue = this.phoneForm.get('telefono')?.value;
            if (phoneValue) {
                this.inspectionForm.patchValue({
                    telefono: phoneValue
                }, { emitEvent: false });
            }
            const formData = { ...this.inspectionForm.value };
            formData.estado = this.calcularEstadoInspeccion(formData);
            formData.firma_conductor = this.inspectionForm.get('firma_conductor')?.value;
            formData.firma_inspector = this.inspectionForm.get('firma_inspector')?.value;
            const updatedRecord = await this.inspectionService.pb.collection('inspections').update(id, formData);
            this.actualizarFormularioConDatosActualizados(updatedRecord);
            this.inspectionForm.markAsPristine();
            this.phoneForm.markAsPristine();
            this.hasChanges = false;
            const estadoTexto = {
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
        }
        catch (error) {
            console.error('Error al guardar:', error);
            Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
        }
    }
    private actualizarFormularioConDatosActualizados(updatedRecord: any): void {
        console.log('🔄 Actualizando formulario con datos del servidor...', updatedRecord);
        let dataParaFormulario = { ...updatedRecord };
        if (updatedRecord.expand?.vehiculo) {
            dataParaFormulario = { ...updatedRecord, ...updatedRecord.expand.vehiculo };
        }
        else if (updatedRecord.vehiculo) {
            dataParaFormulario = { ...updatedRecord, ...updatedRecord.vehiculo };
        }
        const dateFields = [
            'fecha_inspeccion', 'fecha_vigencia',
            'fecha_vencimiento_soat', 'fecha_vencimiento_revision_tecnomecanica'
        ];
        dateFields.forEach(field => {
            if (dataParaFormulario[field]) {
                dataParaFormulario[field] = this.formatDate(dataParaFormulario[field]);
            }
        });
        this.inspectionForm.patchValue(dataParaFormulario, { emitEvent: false });
        if (dataParaFormulario.telefono) {
            this.phoneForm.patchValue({
                telefono: dataParaFormulario.telefono.replace('+57', '')
            }, { emitEvent: false });
        }
        this.inspectionData = dataParaFormulario;
        console.log('✅ Formulario actualizado con datos del servidor');
    }
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
                console.log('Usuario cerró la alerta');
            }
            else if (result.dismiss === Swal.DismissReason.cancel) {
                console.log('Usuario quiere editar');
            }
        });
    }
    public showNoExportWithDetails(formData: any): void {
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
                'tablero_instrumentos_interno'
            ],
            '🛡️ Seguridad Activa': [
                'abs',
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
        const missingByCategory: {
            [category: string]: string[];
        } = {};
        let totalMissing = 0;
        Object.entries(inspectionFieldsByCategory).forEach(([category, fields]) => {
            const missing = fields.filter(field => !formData[field] || formData[field] === '');
            if (missing.length > 0) {
                missingByCategory[category] = missing;
                totalMissing += missing.length;
            }
        });
        const fieldLabels: {
            [key: string]: string;
        } = {
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
        let missingHtml = `<div class="text-start"><p class="mb-2">Para exportar a PDF, completa los siguientes ítems:</p>`;
        Object.entries(missingByCategory).forEach(([category, fields]) => {
            missingHtml += `<div class="mb-2"><strong class="text-primary">${category}</strong><ul class="mb-0 small ps-3">`;
            fields.slice(0, 5).forEach(field => {
                const label = fieldLabels[field] || field;
                missingHtml += `<li class="text-muted">• ${label}</li>`;
            });
            if (fields.length > 5) {
                missingHtml += `<li class="text-muted fst-italic">• y ${fields.length - 5} más...</li>`;
            }
            missingHtml += `</ul></div>`;
        });
        missingHtml += `</div>`;
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
                console.log('Usuario cerró la alerta de campos pendientes');
            }
            else if (result.dismiss === Swal.DismissReason.cancel) {
                const inspectionSection = document.querySelector('#electrico');
                if (inspectionSection) {
                    inspectionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    inspectionSection.classList.add('bg-light', 'p-2', 'rounded');
                    setTimeout(() => {
                        inspectionSection.classList.remove('bg-light', 'p-2', 'rounded');
                    }, 2000);
                }
            }
        });
    }
    ngOnDestroy(): void {
        if (this.formSubscription) {
            this.formSubscription.unsubscribe();
        }
    }
    previsualizarEstado(): 'aprobada' | 'rechazada' | 'borrador' {
        const formData = { ...this.inspectionForm.value };
        return this.calcularEstadoInspeccion(formData);
    }
    ngOnInit(): void {
        this.formSubscription = this.inspectionForm.valueChanges.subscribe(() => {
            this.hasChanges = this.inspectionForm.dirty;
        });
        this.phoneForm.valueChanges.subscribe(() => {
            this.hasChanges = this.phoneForm.dirty;
        });
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.loadInspection(id);
            }
            else {
                this.router.navigate(['/inspections']);
            }
        });
    }
    ngAfterViewInit(): void {
        setTimeout(() => {
            this.initializeDatePickers();
        }, 0);
    }
    private loadInspection(id: string): void {
        this.isLoading = true;
        this.inspectionService.getInspectionById(id).subscribe({
            next: async (data) => {
                this.inspectionData = data;
                this.prepareFormData(data);
                this.isLoading = false;
                await new Promise(resolve => setTimeout(resolve, 100));
                await this.loadInspectionImages(id);
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cargar la inspección:', error);
                Swal.fire('Error', 'No se pudo cargar la inspección', 'error');
                this.router.navigate(['/inspections']);
            }
        });
    }
    private prepareFormData(data: any): void {
        console.log('Datos de la inspección recibidos:', data);
        if (data.expand?.vehiculo) {
            data = { ...data, ...data.expand.vehiculo };
            delete data.expand;
        }
        else if (data.vehiculo) {
            data = { ...data, ...data.vehiculo };
        }
        const formattedData = { ...data };
        const dateFields = [
            'fecha_inspeccion',
            'fecha_vigencia',
            'fecha_vencimiento_soat',
            'fecha_vencimiento_revision_tecnomecanica'
        ];
        dateFields.forEach(field => {
            if (formattedData[field]) {
                formattedData[field] = this.formatDate(formattedData[field]);
            }
        });
        console.log('Datos formateados para el formulario:', formattedData);
        this.inspectionForm.patchValue(formattedData, { emitEvent: false });
        this.firmaBase64 = formattedData.firma_conductor || null;
        this.firmaInspectorBase64 = formattedData.firma_inspector || null;
        this.inspectionForm.patchValue({
            firma_conductor: formattedData.firma_conductor || null,
            firma_inspector: formattedData.firma_inspector || null
        });
        if (formattedData.telefono) {
            this.phoneForm.patchValue({
                telefono: formattedData.telefono.replace('+57', '')
            }, { emitEvent: false });
        }
    }
    goBack(): void {
        this.router.navigate(['/inspecciones']);
    }
    printInspection(): void {
        window.print();
    }
    private calcularEstadoInspeccion(formData: any): 'aprobada' | 'rechazada' | 'borrador' {
        const inspectionFields = [
            'luces_navegacion', 'luces_frenado', 'luces_direccionales', 'luz_reversa',
            'luces_estacionamiento', 'luces_posicion', 'luz_antineblina', 'luz_placa',
            'tablero_instrumentos', 'bocina', 'bateria', 'aire_acondicionado',
            'aceite_motor', 'aceite_transmision', 'liquido_refrigerante',
            'filtro_aire', 'tension_correas',
            'parachoque_delantero', 'parachoque_trasero', 'vidrios_seguridad', 'vidrios_laterales',
            'limpia_brisas', 'guardabarros', 'estribos_laterales', 'placa_adhesivo', 'chapa_compuerta',
            'tapiceria', 'manijas_seguros', 'vidrios_electricos', 'antideslizantes_pedales',
            'tablero_instrumentos_interno',
            'abs',
            'espejos_laterales',
            'espejo_interno',
            'cinturones_seguridad', 'airbags', 'cadena_sujecion',
            'apoyacabezas', 'barra_antivuelco', 'rejilla_vidrio_trasero',
            'conos_triangular', 'botiquin', 'extintor', 'cunas', 'llanta_repuesto',
            'caja_herramientas', 'linterna', 'gato',
            'buies_barra', 'buies_tiera', 'cuna_motor', 'guardapolvo_axiales',
            'amortiguadores', 'hojas_muelles', 'silenciadores', 'tanques_compresor',
            'freno_mano_seguridad',
            'liquido_frenos', 'bomba_frenos', 'pedal_frenos',
            'caja_deposito',
            'terminales',
            'barras_bujes',
            'protectores',
            'columna_direccion',
            'hidraulico_direccion',
        ];
        const emptyFields = inspectionFields.filter(field => !formData[field] || formData[field] === '');
        const negativeFields = inspectionFields.filter(field => formData[field] === 'negativo');
        if (emptyFields.length > 0) {
            console.log(`📝 Estado: borrador (${emptyFields.length} campos pendientes)`);
            return 'borrador';
        }
        if (negativeFields.length > 0) {
            console.log(`❌ Estado: rechazada (${negativeFields.length} ítems no cumplen)`);
            return 'rechazada';
        }
        console.log(`✅ Estado: aprobada (todos los ítems verificados)`);
        return 'aprobada';
    }
    private formatDate(dateString: string): string {
        if (!dateString)
            return '';
        const date = new Date(dateString);
        return this.datePipe.transform(date, 'yyyy-MM-dd', 'UTC') || '';
    }
    getPhoneFieldClass(): string {
        const control = this.phoneForm.get('telefono');
        if (!control)
            return 'field-empty';
        const value = control.value;
        return (value && value.trim() !== '') ? 'field-filled' : 'field-empty';
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
    private initializeDatePickers(): void {
        const dateOptions: FlatpickrOptions = {
            dateFormat: 'Y-m-d',
            allowInput: true,
            clickOpens: true,
            disableMobile: true
        };
        this.initDatePicker(this.fechaInspeccionInput, dateOptions);
        this.initDatePicker(this.fechaVigenciaInput, dateOptions);
        this.initDatePicker(this.fechaLicenciaInput, dateOptions);
        this.initDatePicker(this.fechaVencimientoSoatInput, dateOptions);
        this.initDatePicker(this.fechaVencimientoRevisionTecnomecanicaInput, dateOptions);
        this.initDatePicker(this.fechaVencimientoTarjetaOperacionInput, dateOptions);
    }
    private initDatePicker(element: ElementRef, options: FlatpickrOptions): void {
        if (element && element.nativeElement) {
            flatpickr(element.nativeElement, options);
        }
    }
    async imprimirInspeccion(): Promise<void> {
        try {
            const estadoActual = this.inspectionForm.get('estado')?.value;
            if (estadoActual === 'borrador') {
                const formData = { ...this.inspectionForm.value };
                this.showNoExportWithDetails(formData);
                return;
            }
            Swal.fire({
                title: 'Generando PDF...',
                html: 'Procesando datos e imágenes...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
            const formData = {
                propietario: this.inspectionForm.get('propietario')?.value,
                documento_propietario: this.inspectionForm.get('documento_propietario')?.value,
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
                licencia_transito: this.inspectionForm.get('licencia_transito')?.value,
                fecha_inspeccion: this.inspectionForm.get('fecha_inspeccion')?.value,
                fecha_vigencia: this.inspectionForm.get('fecha_vigencia')?.value,
                fecha_vencimiento_soat: this.inspectionForm.get('fecha_vencimiento_soat')?.value,
                fecha_vencimiento_revision_tecnomecanica: this.inspectionForm.get('fecha_vencimiento_revision_tecnomecanica')?.value,
                nombres_conductor: this.inspectionForm.get('nombres_conductor')?.value,
                identificacion: this.inspectionForm.get('identificacion')?.value,
                telefono_conductor: this.inspectionForm.get('telefono')?.value,
                fecha_vencimiento_licencia: this.inspectionForm.get('fecha_vencimiento_licencia')?.value,
                nombre_transportadora: this.inspectionForm.get('nombre_transportadora')?.value,
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
                parachoque_delantero: this.inspectionForm.get('parachoque_delantero')?.value,
                parachoque_trasero: this.inspectionForm.get('parachoque_trasero')?.value,
                vidrios_seguridad: this.inspectionForm.get('vidrios_seguridad')?.value,
                vidrios_laterales: this.inspectionForm.get('vidrios_laterales')?.value,
                limpia_brisas: this.inspectionForm.get('limpia_brisas')?.value,
                guardabarros: this.inspectionForm.get('guardabarros')?.value,
                estribos_laterales: this.inspectionForm.get('estribos_laterales')?.value,
                placa_adhesivo: this.inspectionForm.get('placa_adhesivo')?.value,
                chapa_compuerta: this.inspectionForm.get('chapa_compuerta')?.value,
                tapiceria: this.inspectionForm.get('tapiceria')?.value,
                manijas_seguros: this.inspectionForm.get('manijas_seguros')?.value,
                vidrios_electricos: this.inspectionForm.get('vidrios_electricos')?.value,
                tablero_instrumentos: this.inspectionForm.get('tablero_instrumentos')?.value,
                antideslizantes_pedales: this.inspectionForm.get('antideslizantes_pedales')?.value,
                aceite_motor: this.inspectionForm.get('aceite_motor')?.value,
                aceite_transmision: this.inspectionForm.get('aceite_transmision')?.value,
                liquido_refrigerante: this.inspectionForm.get('liquido_refrigerante')?.value,
                liquido_frenos: this.inspectionForm.get('liquido_frenos')?.value,
                filtro_aire: this.inspectionForm.get('filtro_aire')?.value,
                hidraulico_direccion: this.inspectionForm.get('hidraulico_direccion')?.value,
                tension_correas: this.inspectionForm.get('tension_correas')?.value,
                sistema_frenos: this.inspectionForm.get('sistema_frenos')?.value,
                abs: this.inspectionForm.get('abs')?.value,
                sistema_direccion: this.inspectionForm.get('sistema_direccion')?.value,
                espejos_laterales: this.inspectionForm.get('espejos_laterales')?.value,
                espejo_interno: this.inspectionForm.get('espejo_interno')?.value,
                freno_mano_seguridad: this.inspectionForm.get('freno_mano_seguridad')?.value,
                cinturones_seguridad: this.inspectionForm.get('cinturones_seguridad')?.value,
                airbags: this.inspectionForm.get('airbags')?.value,
                cadena_sujecion: this.inspectionForm.get('cadena_sujecion')?.value,
                columna_direccion: this.inspectionForm.get('columna_direccion')?.value,
                apoyacabezas: this.inspectionForm.get('apoyacabezas')?.value,
                barra_antivuelco: this.inspectionForm.get('barra_antivuelco')?.value,
                rejilla_vidrio_trasero: this.inspectionForm.get('rejilla_vidrio_trasero')?.value,
                conos_triangular: this.inspectionForm.get('conos_triangular')?.value,
                botiquin: this.inspectionForm.get('botiquin')?.value,
                extintor: this.inspectionForm.get('extintor')?.value,
                cunas: this.inspectionForm.get('cunas')?.value,
                llanta_repuesto: this.inspectionForm.get('llanta_repuesto')?.value,
                caja_herramientas: this.inspectionForm.get('caja_herramientas')?.value,
                linterna: this.inspectionForm.get('linterna')?.value,
                gato: this.inspectionForm.get('gato')?.value,
                buies_barra: this.inspectionForm.get('buies_barra')?.value,
                buies_tiera: this.inspectionForm.get('buies_tiera')?.value,
                cuna_motor: this.inspectionForm.get('cuna_motor')?.value,
                guardapolvo_axiales: this.inspectionForm.get('guardapolvo_axiales')?.value,
                amortiguadores: this.inspectionForm.get('amortiguadores')?.value,
                hojas_muelles: this.inspectionForm.get('hojas_muelles')?.value,
                silenciadores: this.inspectionForm.get('silenciadores')?.value,
                tanques_compresor: this.inspectionForm.get('tanques_compresor')?.value,
                llanta_di: this.inspectionForm.get('llanta_di')?.value,
                llanta_dd: this.inspectionForm.get('llanta_dd')?.value,
                llanta_tie: this.inspectionForm.get('llanta_tie')?.value,
                llanta_tde: this.inspectionForm.get('llanta_tde')?.value,
                llanta_tii: this.inspectionForm.get('llanta_tii')?.value,
                llanta_tdi: this.inspectionForm.get('llanta_tdi')?.value,
                presion_llanta_d_li: this.inspectionForm.get('presion_llanta_d_li')?.value,
                presion_llanta_d_ld: this.inspectionForm.get('presion_llanta_d_ld')?.value,
                presion_llanta_t_lie: this.inspectionForm.get('presion_llanta_t_lie')?.value,
                presion_llanta_t_lde: this.inspectionForm.get('presion_llanta_t_lde')?.value,
                presion_llanta_t_lii: this.inspectionForm.get('presion_llanta_t_lii')?.value,
                presion_llanta_t_ldi: this.inspectionForm.get('presion_llanta_t_ldi')?.value,
                pedal_frenos: this.inspectionForm.get('pedal_frenos')?.value,
                bomba_frenos: this.inspectionForm.get('bomba_frenos')?.value,
                caja_deposito: this.inspectionForm.get('caja_deposito')?.value,
                barras_bujes: this.inspectionForm.get('barras_bujes')?.value,
                protectores: this.inspectionForm.get('protectores')?.value,
                terminales: this.inspectionForm.get('terminales')?.value,
                firma_conductor: this.inspectionForm.get('firma_conductor')?.value,
                firma_inspector: this.inspectionForm.get('firma_inspector')?.value,
                observaciones: this.inspectionForm.get('observaciones')?.value,
                estado: this.inspectionForm.get('estado')?.value,
                numero_certificado: this.inspectionForm.get('numero_certificado')?.value,
            };
            const imageUrls = this.inspectionImages;
            await this.excelExportService.exportarDatosConductorComoPdfConImagenes(formData, imageUrls);
            Swal.close();
            Swal.fire('Éxito', 'PDF con imágenes generado', 'success');
        }
        catch (error) {
            Swal.close();
            Swal.fire('Error', error instanceof Error ? error.message : 'Error al generar PDF', 'error');
        }
    }
}
