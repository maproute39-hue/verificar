import { Injectable } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';
import Swal from 'sweetalert2';

/**
 * Guard para proteger rutas según roles de usuario
 * Uso: { path: 'ruta', canActivate: [roleGuard(['admin', 'user'])] }
 */
export function roleGuard(allowedRoles: string | string[]): CanActivateFn {
  return (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Verificar autenticación
    if (!authService.isAuthenticated()) {
      // Guardar la URL a la que intentó acceder para redirigir después del login
      const returnUrl = state.url;
      router.navigate(['/login'], { queryParams: { returnUrl } });
      return false;
    }

    // Obtener usuario actual
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      router.navigate(['/login']);
      return false;
    }

    // Normalizar roles permitidos a array
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Si el array de roles incluye '*' o el rol del usuario, permitir acceso
    if (rolesArray.includes('*') || rolesArray.includes(currentUser.role)) {
      return true;
    }

    // Si el usuario no tiene el rol requerido
    Swal.fire({
      title: 'Acceso denegado',
      text: 'No tienes permisos para acceder a esta sección',
      icon: 'warning',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3f51b5'
    }).then(() => {
      // Redirigir a la página principal
      router.navigate(['/home']);
    });

    return false;
  };
}