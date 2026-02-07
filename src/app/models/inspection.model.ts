export interface Inspection {
  // Identificadores
  id?: string;
  id_inspeccion?: string;  // ID único de la inspección
  collectionId?: string;
  collectionName?: string;
  created?: string;
  updated?: string;
  
  // Información del conductor
  nombres_conductor?: string;
  identificacion?: string;
  telefono?: string;
  licencia_vencimiento?: string;
  foto_conductor?: string; // URL de la foto del conductor
  
  // Información del vehículo
  placa?: string;
  marca?: string;
  modelo?: string;
  color?: string;
  clase_vehiculo?: string;
  codigo_vehiculo?: string;
  capacidad_pasajeros?: number;
  kilometraje?: number;
  
  // Documentación del vehículo
  soat?: string;
  licencia_transito?: string;
  tecnicomecanica?: string;
  tarjeta_operacion?: string;
  
  // Fechas importantes
  fecha_inspeccion?: string;
  fecha_vigencia?: string;
  fecha_vencimiento_soat?: string;
  fecha_vencimiento_revision_tecnomecanica?: string;
  fecha_vencimiento_tarjeta_operacion?: string;
  
  // Estado y validación
  estado?: 'approved' | 'rejected' | 'pending' | string;
  
  // Información adicional
  nombre_transportadora?: string;
  observaciones?: string;
  created_by?: string;
  
  // Propiedades anidadas para búsqueda (mantenidas por compatibilidad)
  vehiculo?: {
    placa?: string;
    marca?: string;
    modelo?: string;
  };
  
  // Luces y sistemas eléctricos
  luces_navegacion?: string;
  luces_frenado?: string;
  luces_direccionales?: string;
  luz_reversa?: string;
  luces_estacionamiento?: string;
  luces_posicion?: string;
  luz_antineblina?: string;
  luz_placa?: string;
  tablero_instrumentos?: string;
  bocina?: string;
  bateria?: string;
  aire_acondicionado?: string;
  
  // Sistemas mecánicos
  aceite_motor?: string;
  aceite_transmision?: string;
  liquido_refrigerante?: string;
  liquido_frenos?: string;
  filtro_aire?: string;
  hidraulico_direccion?: string;
  tension_correas?: string;
  
  // Carrocería
  parachoque_delantero?: string;
  parachoque_trasero?: string;
  vidrios_seguridad?: string;
  vidrios_laterales?: string;
  limpia_brisas?: string;
  guardabarros?: string;
  estribos_laterales?: string;
  placa_adhesivo?: string;
  chapa_compuerta?: string;
  
  // Cabina y mandos
  tapiceria?: string;
  manijas_seguros?: string;
  vidrios_electricos?: string;
  antideslizantes_pedales?: string;
  freno_mano?: string;
  tablero_instrumentos_interno?: string;
  
  // Seguridad activa
  sistema_frenos?: string;
  abs?: string;
  sistema_direccion?: string;
  espejos_laterales?: string;
  espejo_interno?: string;
  
  // Seguridad pasiva
  freno_mano_seguridad?: string;
  cinturones_seguridad?: string;
  airbags?: string;
  cadena_sujecion?: string;
  columna_direccion?: string;
  apoyacabezas?: string;
  barra_antivuelco?: string;
  rejilla_vidrio_trasero?: string;
  
  // Kit de carretera
  conos_triangular?: string;
  botiquin?: string;
  extintor?: string;
  cunas?: string;
  llanta_repuesto?: string;
  caja_herramientas?: string;
  linterna?: string;
  gato?: string;
  
  // Parte baja del vehículo
  buies_barra?: string;
  buies_tiera?: string;
  cuna_motor?: string;
  guardapolvo_axiales?: string;
  amortiguadores?: string;
  hojas_muelles?: string;
  silenciadores?: string;
  tanques_compresor?: string;
  
  // Medidas de llantas
  llanta_d_ld?: number;
  llanta_t_lie?: number;
  llanta_t_lii?: number;
  llanta_t_lid?: number;


  status?: string;
}

export interface CreateInspectionDTO {
  fecha_inspeccion: string;
  fecha_vigencia: string;
  nombre_transportadora: string;
  nombres_conductor: string;
  identificacion: string;
  telefono: string;
  fecha_vencimiento_licencia: string;
  placa: string;
  marca: string;
  modelo: string;
  kilometraje: number;
  soat: string;
  licencia_transito: string;
  tecnicomecanica: string;
  clase_vehiculo: string;
  tarjeta_operacion: string;
  color: string;
  codigo_vehiculo: string;
  capacidad_pasajeros: number;
  created_by: string;
  estado: string;
  observaciones?: string;
  
  // Campos de inspección (todos opcionales con valores por defecto)
  [key: string]: any;
}

export interface UpdateInspectionDTO {
  fecha_inspeccion?: string;
  fecha_vigencia?: string;
  nombre_transportadora?: string;
  nombres_conductor?: string;
  identificacion?: string;
  telefono?: string;
  fecha_vencimiento_licencia?: string;
  placa?: string;
  marca?: string;
  modelo?: string;
  kilometraje?: number;
  soat?: string;
  licencia_transito?: string;
  tecnicomecanica?: string;
  clase_vehiculo?: string;
  tarjeta_operacion?: string;
  color?: string;
  codigo_vehiculo?: string;
  capacidad_pasajeros?: number;
  created_by?: string;
  estado?: string;
  observaciones?: string;
  
  // Campos de inspección
  [key: string]: any;
}