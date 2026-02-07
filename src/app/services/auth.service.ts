import PocketBase, { RecordModel } from 'pocketbase';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

// Extender RecordModel de PocketBase con tus campos personalizados
export interface User extends RecordModel {
  username: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  avatar?: string;
  type?: string;
  status?: boolean;
  verified: boolean;
  emailVisibility: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private pb = new PocketBase('https://db.buckapi.site:8095');

  constructor(private router: Router) {
    // Cargar sesión desde cookie si existe
    this.pb.authStore.loadFromCookie(document.cookie);
  }

  /**
   * Autenticar usuario con email/username y contraseña
   * @returns Promise con datos del usuario autenticado
   */
  async login(identity: string, password: string): Promise<User> {
    try {
      // authWithPassword devuelve { token, recordModel }
      const authData = await this.pb.collection('users').authWithPassword(
        identity,
        password
      );

      // Guardar authStore en cookie para persistencia
      document.cookie = `${this.pb.authStore.exportToCookie({ httpOnly: false })}; path=/; max-age=604800; SameSite=Lax`;

      // El recordModel ya incluye todos los campos del usuario
      return authData.record as User;
    } catch (error: any) {
      console.error('Error en login:', error);
      throw new Error(error?.response?.message || 'Error al iniciar sesión');
    }
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.pb.authStore.clear();
    // Limpiar cookie
    document.cookie = 'pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    this.router.navigate(['/login']);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.pb.authStore.isValid;
  }

  /**
   * Obtener el token de autenticación
   */
  getToken(): string | null {
    return this.pb.authStore.token;
  }

  /**
   * Obtener el usuario actual
   */
  getCurrentUser(): User | null {
    return this.pb.authStore.model as User | null;
  }

  /**
   * Obtener el ID del usuario actual
   */
  getCurrentUserId(): string | null {
    return this.pb.authStore.model?.id || null;
  }

  /**
   * Redirigir según rol del usuario
   */
  redirectToDashboard(user: User): void {
    if (user.role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  /**
   * Registrar nuevo usuario
   */
  async register(userData: Partial<User>): Promise<User> {
    try {
      const recordModel = await this.pb.collection('users').create(userData);
      return recordModel as User;
    } catch (error: any) {
      console.error('Error en registro:', error);
      throw new Error(error?.response?.message || 'Error al registrar usuario');
    }
  }

  /**
   * Actualizar perfil del usuario actual
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    if (!this.pb.authStore.model) {
      throw new Error('No hay usuario autenticado');
    }

    try {
      const recordModel = await this.pb.collection('users').update(
        this.pb.authStore.model.id,
        data
      );
      return recordModel as User;
    } catch (error: any) {
      console.error('Error actualizando perfil:', error);
      throw new Error(error?.response?.message || 'Error al actualizar perfil');
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(oldPassword: string, newPassword: string, newPasswordConfirm: string): Promise<void> {
    try {
      await this.pb.collection('users').update(this.pb.authStore.model!.id, {
        oldPassword,
        newPassword,
        newPasswordConfirm
      });
    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      throw new Error(error?.response?.message || 'Error al cambiar contraseña');
    }
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await this.pb.collection('users').requestPasswordReset(email);
    } catch (error: any) {
      console.error('Error solicitando recuperación:', error);
      throw new Error(error?.response?.message || 'Error al solicitar recuperación');
    }
  }

  /**
   * Confirmar recuperación de contraseña
   */
  async confirmPasswordReset(passwordResetToken: string, password: string, passwordConfirm: string): Promise<void> {
    try {
      await this.pb.collection('users').confirmPasswordReset(
        passwordResetToken,
        password,
        passwordConfirm
      );
    } catch (error: any) {
      console.error('Error confirmando recuperación:', error);
      throw new Error(error?.response?.message || 'Error al confirmar recuperación');
    }
  }
}