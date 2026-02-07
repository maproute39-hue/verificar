
import { Injectable } from '@angular/core';

/**
 * Define los atributos que pueden tener los elementos script
 * Incluye tanto atributos estándar como personalizados
 */
export interface ScriptAttributes {
  // Atributos estándar
  async?: boolean;
  defer?: boolean;
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  integrity?: string;
  nonce?: string;
  referrerPolicy?: HTMLScriptElement['referrerPolicy'];
  noModule?: boolean;
  
  // Permite atributos personalizados
  [key: string]: string | boolean | undefined;
}

export interface ScriptConfig {
  src: string;
  attrs?: ScriptAttributes;
}

/**
 * Servicio para cargar scripts de forma dinámica en la aplicación.
 * Evita la carga duplicada de scripts y proporciona una API simple para cargar
 * scripts con atributos personalizados.
 */
@Injectable({
  providedIn: 'root',
})
export class ScriptLoaderService {
  private loadedScripts: Set<string> = new Set();
  private scriptElements: Map<string, HTMLScriptElement> = new Map();

  constructor() {}

  /**
   * Carga un script de manera dinámica
   * @param src - La URL del script a cargar
   * @param attrs - Atributos opcionales para el elemento script
   * @returns Promesa que se resuelve cuando el script se carga correctamente
   * @throws Error si el script no se puede cargar
   */
  loadScript(src: string, attrs: ScriptAttributes = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar si el script ya está cargado
      if (this.loadedScripts.has(src)) {
        console.log(`El script ya está cargado: ${src}`);
        return resolve();
      }

      // Verificar si el script ya se está cargando
      if (this.scriptElements.has(src)) {
        console.log(`El script ya se está cargando: ${src}`);
        return resolve();
      }

      const script = document.createElement('script');
      script.src = src;

      // Configurar atributos estándar
      if (attrs.async !== undefined) script.async = attrs.async as boolean;
      if (attrs.defer !== undefined) script.defer = attrs.defer as boolean;
      if (attrs.type) script.type = attrs.type as string;
      if (attrs.crossOrigin) script.crossOrigin = attrs.crossOrigin;
      if (attrs.integrity) script.integrity = attrs.integrity as string;
      if (attrs.nonce) script.nonce = attrs.nonce as string;
      if (attrs.referrerPolicy) script.referrerPolicy = attrs.referrerPolicy as ReferrerPolicy;
      if (attrs.noModule !== undefined) script.noModule = attrs.noModule as boolean;

      // Añadir atributos personalizados
      Object.entries(attrs).forEach(([key, value]) => {
        if (typeof value === 'string' && !(key in script)) {
          script.setAttribute(key, value);
        }
      });

      // Configurar manejadores de eventos
      script.onload = () => {
        this.loadedScripts.add(src);
        this.scriptElements.delete(src);
        resolve();
      };

      script.onerror = (error) => {
        const errorMsg = `Error al cargar el script: ${src}`;
        console.error(errorMsg, error);
        this.scriptElements.delete(src);
        reject(new Error(errorMsg));
      };

      // Almacenar referencia al elemento script
      this.scriptElements.set(src, script);

      // Añadir el script al documento
      document.body.appendChild(script);
    });
  }

  /**
   * Carga múltiples scripts en paralelo
   * @param scripts - Array de configuraciones de scripts a cargar
   * @returns Promesa que se resuelve cuando todos los scripts se cargan correctamente
   */
  loadAll(scripts: ScriptConfig[]): Promise<void[]> {
    const promises = scripts.map(script => 
      this.loadScript(script.src, script.attrs)
    );
    return Promise.all(promises);
  }

  /**
   * Verifica si un script ya ha sido cargado
   * @param src - URL del script a verificar
   * @returns boolean indicando si el script está cargado
   */
  isScriptLoaded(src: string): boolean {
    return this.loadedScripts.has(src);
  }

  /**
   * Elimina un script cargado
   * @param src - URL del script a eliminar
   * @returns boolean indicando si el script fue eliminado
   */
  removeScript(src: string): boolean {
    if (this.scriptElements.has(src)) {
      const script = this.scriptElements.get(src);
      if (script && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      this.scriptElements.delete(src);
      return this.loadedScripts.delete(src);
    }
    return false;
  }
}