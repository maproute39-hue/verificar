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
  

    private gotenbergUrl = 'https://gotenberg.buckapi.online/forms/libreoffice/convert';


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

  convertHtmlToPdf(
  htmlBlob: Blob, 
  options: {
    printBackground?: boolean;
    waitForSelector?: string;
    waitDelay?: string;
    landscape?: boolean;
    paperWidth?: number;
    paperHeight?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
  } = {}
): Observable<Blob> {
  
  const formData = new FormData();
  formData.append('files', htmlBlob, 'report.html');

  const authHeader = 'Basic ' + btoa(`${this.username}:${this.password}`);
  const headers = new HttpHeaders({
    'Authorization': authHeader,
    'Accept': 'application/pdf'
  });

  // ✅ Agrega las opciones dinámicamente
  if (options.printBackground !== undefined) formData.append('printBackground', options.printBackground.toString());
  if (options.waitForSelector) formData.append('waitForSelector', options.waitForSelector);
  if (options.waitDelay) formData.append('waitDelay', options.waitDelay);
  if (options.landscape !== undefined) formData.append('landscape', options.landscape.toString());
  if (options.paperWidth) formData.append('paperWidth', options.paperWidth.toString());
  if (options.paperHeight) formData.append('paperHeight', options.paperHeight.toString());
  if (options.marginTop) formData.append('marginTop', options.marginTop.toString());
  if (options.marginBottom) formData.append('marginBottom', options.marginBottom.toString());
  if (options.marginLeft) formData.append('marginLeft', options.marginLeft.toString());
  if (options.marginRight) formData.append('marginRight', options.marginRight.toString());

  return this.http.post('https://gotenberg.buckapi.online/forms/chromium/convert/html', formData, {
    headers,
    responseType: 'blob'
  }).pipe(
    catchError(error => {
      console.error('❌ Error en Gotenberg (Chromium):', error);
      return throwError(() => new Error('Error al generar el PDF desde HTML'));
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
