import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

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
}
