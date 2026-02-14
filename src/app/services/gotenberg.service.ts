import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GotenbergService {
  // Configuración de Gotenberg
  private gotenbergUrl = 'https://gotenbergapi-gotenberg-4379cb-187-77-9-65.traefik.me/forms/libreoffice/convert';
  
  // Credenciales (¡CAMBIA ESTAS POR TUS CREDENCIALES REALES!)
  private username = 'noah_gottlieb-barton38';  // ← ¡CAMBIA ESTO!
  private password = '4frvcnwtdxtkx4pm';  // ← ¡CAMBIA ESTO!

  constructor(private http: HttpClient) {}

  /**
   * Convierte un archivo XLSX a PDF usando Gotenberg
   * @param xlsxFile Blob del archivo XLSX
   * @returns Observable con el PDF generado como Blob
   */
  convertXlsxToPdf(xlsxFile: Blob): Observable<Blob> {
    const formData = new FormData();
    formData.append('files', xlsxFile, 'inspeccion.xlsx');

    // Configurar autenticación básica
    const authHeader = 'Basic ' + btoa(`${this.username}:${this.password}`);
    const headers = new HttpHeaders({
      'Authorization': authHeader
    });

    return this.http.post(this.gotenbergUrl, formData, {
      headers,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error en la conversión con Gotenberg:', error);
        return throwError(() => new Error('Error al generar el PDF. Por favor, intenta de nuevo.'));
      })
    );
  }

  /**
   * Descarga un Blob como archivo
   * @param blob Blob a descargar
   * @param filename Nombre del archivo
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}