import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements OnInit {
  loginData = {
    email: '',
    password: ''
  };
  
  showPassword = false;
  errorMessage: string = '';
  isSubmitting = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Para testing (elimina en producción)
    this.loginData.email = 'david@appverificar.site';
    this.loginData.password = 'appverificar0126';
  }

  ngOnInit(): void {
    // Verificar si ya hay sesión activa
    if (this.authService.isAuthenticated()) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        // Obtener la URL de retorno si existe
        const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else {
          this.redirectByRole(currentUser);
        }
      }
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
    const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.type = this.showPassword ? 'text' : 'password';
    }
  }

  async onSubmit(): Promise<void> {
    // Validar campos vacíos
    if (!this.loginData.email.trim() || !this.loginData.password.trim()) {
      await Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor ingresa email/usuario y contraseña',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Limpiar mensaje de error anterior
    this.errorMessage = '';
    this.isSubmitting = true;

    try {
      // Autenticar con PocketBase
      const user = await this.authService.login(
        this.loginData.email,
        this.loginData.password
      );

      // Obtener la URL de retorno si existe
      const returnUrl = this.router.parseUrl(this.router.url).queryParams['returnUrl'] || '/';
      
      // Mostrar mensaje de éxito
      await Swal.fire({
        title: '¡Inicio de sesión exitoso!',
        text: `Bienvenido, ${user.name || user.email}`,
        icon: 'success',
        confirmButtonText: 'Continuar',
        timer: 1500,
        timerProgressBar: true,
        showConfirmButton: false
      });

      // Redirigir a la URL de retorno o según el rol
      if (returnUrl && returnUrl !== '/') {
        this.router.navigateByUrl(returnUrl);
      } else {
        this.redirectByRole(user);
      }
    } catch (error: any) {
      // Manejar errores de autenticación
      const errorMessage = error.message || 'Credenciales inválidas. Por favor verifica tus datos.';
      
      await Swal.fire({
        title: 'Error de autenticación',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
      
      console.error('Error de autenticación:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Redirige al usuario según su rol
   */
  private redirectByRole(user: User): void {
    if (user.role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  /**
   * Limpiar campos del formulario
   */
  clearForm(): void {
    this.loginData.email = '';
    this.loginData.password = '';
    this.errorMessage = '';
    this.showPassword = false;
    
    const passwordInput = document.getElementById('loginPassword') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.type = 'password';
    }
  }
}