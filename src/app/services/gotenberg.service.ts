import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class GotenbergService {
  
  // ✅ Detecta si es producción o desarrollo
  private isProduction = window.location.hostname !== 'localhost';
  
  // En desarrollo usa el proxy, en producción usa URL directa
  private gotenbergUrl = this.isProduction 
    ? 'https://gotenberg.buckapi.online/forms/libreoffice/convert'
    : '/gotenberg/forms/libreoffice/convert';
  
  private username = 'noah_gottlieb-barton38';
  private password = '4frvcnwtdxtkx4pm';

  constructor(private http: HttpClient) {}

  convertXlsxToPdf(xlsxFile: Blob): Observable<Blob> {
    const formData = new FormData();
    formData.append('files', xlsxFile, 'inspeccion.xlsx');

    const authHeader = 'Basic ' + btoa(`${this.username}:${this.password}`);
    const headers = new HttpHeaders({
      'Authorization': authHeader,
      'Accept': 'application/pdf'
    });

    return this.http.post(this.gotenbergUrl, formData, {
      headers,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('❌ Error en Gotenberg:', error);
        return throwError(() => new Error('Error al generar el PDF'));
      })
    );
  }

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
// @Injectable({
//   providedIn: 'root'
// })
// export class GotenbergService {
//   // ✅ En PRODUCCIÓN (usa el proxy de Nginx):
//   private gotenbergUrl = '/gotenberg/forms/libreoffice/convert';
  
//   // ❌ En DESARROLLO (descomenta esto):
//   // private gotenbergUrl = '/gotenberg/forms/libreoffice/convert';
  
//   private username = 'noah_gottlieb-barton38';
//   private password = '4frvcnwtdxtkx4pm';

//   constructor(private http: HttpClient) {}

//   convertXlsxToPdf(xlsxFile: Blob): Observable<Blob> {
//     const formData = new FormData();
//     formData.append('files', xlsxFile, 'inspeccion.xlsx');

//     const authHeader = 'Basic ' + btoa(`${this.username}:${this.password}`);
//     const headers = new HttpHeaders({
//       'Authorization': authHeader,
//       'Accept': 'application/pdf'
//       // ❌ NO pongas Content-Type manualmente
//     });

//     return this.http.post(this.gotenbergUrl, formData, {
//       headers,
//       responseType: 'blob'
//     }).pipe(
//       catchError(error => {
//         console.error('❌ Error en Gotenberg:', error);
//         return throwError(() => new Error('Error al generar el PDF'));
//       })
//     );
//   }

//   downloadBlob(blob: Blob, filename: string): void {
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = filename;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     window.URL.revokeObjectURL(url);
//   }
// }