import { Component, OnInit, ViewChild, ElementRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { InspectionService } from '../../services/inspection.service';
import { SharedService } from '../../services/shared.service';
import {
  SignaturePadComponent,
  NgSignaturePadOptions
} from '@almothafar/angular-signature-pad';

@Component({
  selector: 'app-heredada',
    standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule,SignaturePadComponent],
  templateUrl: './heredada.html',
  styleUrl: './heredada.scss',
})
export class Heredada {
 driverForm: FormGroup;
  isLoading = false;
  nextCertificateNumber = '';
  baseInspection: any = null;

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

  @ViewChild('signaturePad') signaturePad!: SignaturePadComponent;
  @ViewChild('signaturePadInspector') signaturePadInspector!: SignaturePadComponent;

  @ViewChild('signaturePad', { read: ElementRef })
  signaturePadElement!: ElementRef<HTMLCanvasElement>;

  @ViewChild('signaturePadInspector', { read: ElementRef })
  signaturePadInspectorElement!: ElementRef<HTMLCanvasElement>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private inspectionService: InspectionService,
    public sharedService: SharedService
  ) {
    this.driverForm = this.fb.group({
      nombres_conductor: ['', [Validators.required, Validators.minLength(3)]],
      identificacion: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    });
  }

  async ngOnInit(): Promise<void> {
    this.sharedService.currentRoute = this.route.snapshot.url[0]?.path || 'heredada';

    try {
      this.nextCertificateNumber = await this.inspectionService.getNextCertificateNumberPreview('U');
    } catch (error) {
      console.error('Error al obtener preview del número de certificado:', error);
    }

    const stateInspection = history.state?.inheritedInspection;

    if (!stateInspection) {
      await Swal.fire({
        title: 'Sin datos base',
        text: 'No se recibió una inspección base para heredar.',
        icon: 'warning',
        confirmButtonText: 'Volver'
      });
      this.router.navigate(['/home']);
      return;
    }

    this.baseInspection = { ...stateInspection };

    this.driverForm.patchValue({
      nombres_conductor: this.baseInspection.nombres_conductor || '',
      identificacion: this.baseInspection.identificacion || '',
    });
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initSignaturePads();
      this.resizeCanvas(this.signaturePadElement, this.signaturePad);
      this.resizeCanvas(this.signaturePadInspectorElement, this.signaturePadInspector);
    }, 0);
  }
    private initSignaturePads(): void {
    try {
      if (this.signaturePad) {
        this.signaturePad.set('minWidth', 2);
        this.signaturePad.set('maxWidth', 5);
      }

      if (this.signaturePadInspector) {
        this.signaturePadInspector.set('minWidth', 2);
        this.signaturePadInspector.set('maxWidth', 5);
      }
    } catch (error) {
      console.warn('Error al inicializar los pads de firma:', error);
    }
  }

  private resizeCanvas(
    canvasRef: ElementRef<HTMLCanvasElement>,
    pad: SignaturePadComponent
  ): void {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const canvas = canvasRef?.nativeElement?.querySelector?.('canvas') || canvasRef?.nativeElement;

    if (!canvas) return;

    const data = pad?.toData?.();
    const container = canvas.parentElement;
    if (!container) return;

    canvas.width = container.offsetWidth * ratio;
    canvas.height = 250 * ratio;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
    }

    canvas.style.width = '100%';
    canvas.style.height = '250px';

    if (data && data.length > 0) {
      pad?.fromData(data);
    }
  }

  onDibujoInicio(event: MouseEvent | Touch): void {
    console.log('Inicio firma conductor', event);
  }

  onDibujoInicioInspector(event: MouseEvent | Touch): void {
    console.log('Inicio firma inspector', event);
  }

  onFirmaCompletada(): void {
    if (!this.signaturePad) {
      Swal.fire('Error', 'El canvas de firma del conductor no está disponible', 'error');
      return;
    }

    if (this.signaturePad.isEmpty()) {
      return;
    }

    this.firmaBase64 = this.signaturePad.toDataURL('image/png');
  }

  limpiarFirma(): void {
    try {
      if (this.signaturePad) {
        this.signaturePad.clear();
      }
      this.firmaBase64 = null;
    } catch (error) {
      console.error('Error al limpiar firma del conductor:', error);
      this.firmaBase64 = null;
    }
  }

  onFirmaInspectorCompletada(): void {
    if (!this.signaturePadInspector) {
      Swal.fire('Error', 'El canvas de firma del inspector no está disponible', 'error');
      return;
    }

    if (this.signaturePadInspector.isEmpty()) {
      return;
    }

    this.firmaInspectorBase64 = this.signaturePadInspector.toDataURL('image/png');
  }

  limpiarFirmaInspector(): void {
    try {
      if (this.signaturePadInspector) {
        this.signaturePadInspector.clear();
      }
      this.firmaInspectorBase64 = null;
    } catch (error) {
      console.error('Error al limpiar firma del inspector:', error);
      this.firmaInspectorBase64 = null;
    }
  }
  getFieldClass(fieldName: string): string {
    const control = this.driverForm.get(fieldName);
    if (!control) return 'field-empty';

    const value = control.value;
    if (typeof value === 'string') {
      return value.trim() ? 'field-filled' : 'field-empty';
    }

    return value ? 'field-filled' : 'field-empty';
  }

 async onSubmit(): Promise<void> {
    if (this.driverForm.invalid) {
      this.driverForm.markAllAsTouched();

      await Swal.fire({
        title: 'Campos incompletos',
        text: 'Debes indicar el nombre del conductor y su identificación.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (!this.firmaBase64) {
      await Swal.fire({
        title: 'Firma requerida',
        text: 'Debes capturar la firma del conductor.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (!this.firmaInspectorBase64) {
      await Swal.fire({
        title: 'Firma requerida',
        text: 'Debes capturar la firma del inspector.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    if (!this.baseInspection) {
      await Swal.fire({
        title: 'Error',
        text: 'No existe una inspección base para duplicar.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    this.isLoading = true;

    Swal.fire({
      title: 'Procesando...',
      text: 'Creando inspección heredada',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const numero_certificado = await this.inspectionService.getNextCertificateNumber('U');

      const payload: any = {
        ...this.baseInspection,

        nombres_conductor: this.driverForm.value.nombres_conductor?.toUpperCase().trim(),
        identificacion: this.driverForm.value.identificacion?.trim(),
        numero_certificado,

        firma_conductor: this.firmaBase64,
        firma_inspector: this.firmaInspectorBase64,

        id: undefined,
        created: undefined,
        updated: undefined,
        collectionId: undefined,
        collectionName: undefined,
        expand: undefined,
      };

      console.log('Payload heredado:', payload);

      await this.inspectionService.createInspection(payload).toPromise();

      Swal.close();

      await Swal.fire({
        title: '¡Éxito!',
        html: `
          Se creó la inspección heredada correctamente.<br>
          <strong>Número:</strong> ${numero_certificado}
        `,
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      this.router.navigate(['/home']);
    } catch (error: any) {
      console.error('Error al crear inspección heredada:', error);
      Swal.close();

      await Swal.fire({
        title: 'Error',
        text: error?.message || 'No se pudo crear la inspección heredada.',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      this.isLoading = false;
    }
  }

  cancelar(): void {
    this.router.navigate(['/home']);
  } 
}
