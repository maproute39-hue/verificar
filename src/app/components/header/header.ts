import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router,ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PwaInstallService } from '../../services/pwa-install.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  showInstallButton = false;
  private installSubscription: Subscription | undefined;
  showHomeButton = true;
  public currentRoute: string = '';
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private pwaInstallService: PwaInstallService,
    public sharedService: SharedService
  ) {}

  ngOnInit() {
  
    console.log(this.currentRoute);
    this.installSubscription = this.pwaInstallService.installPromptAvailable$.subscribe(
      (available) => {
        this.showInstallButton = available;
      }
    );
 
  }



  ngOnDestroy() {
    if (this.installSubscription) {
      this.installSubscription.unsubscribe();
    }
  }

  async logout(event: Event) {
    event.preventDefault();
    
    // Mostrar confirmación antes de cerrar sesión
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas cerrar tu sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3f51b5',
      cancelButtonColor: '#f44336',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        // Llamar al servicio de autenticación para cerrar sesión
        this.authService.logout();
        
        // Mostrar confirmación de cierre de sesión exitoso
        await Swal.fire({
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión correctamente',
          icon: 'success',
          confirmButtonColor: '#3f51b5',
          confirmButtonText: 'Aceptar'
        });
        
        // Redirigir a la página de login
        this.router.navigate(['/login']);
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        await Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al cerrar la sesión',
          icon: 'error',
          confirmButtonColor: '#3f51b5'
        });
      }
    }
  }

  async installPwa() {
    const accepted = await this.pwaInstallService.promptInstall();
    if (accepted) {
      await Swal.fire({
        title: '¡Instalada!',
        text: 'La aplicación se ha instalado correctamente.',
        icon: 'success',
        confirmButtonColor: '#3f51b5'
      });
    } else {
      await Swal.fire({
        title: 'Cancelado',
        text: 'La instalación fue cancelada.',
        icon: 'info',
        confirmButtonColor: '#3f51b5'
      });
    }
  }
}
