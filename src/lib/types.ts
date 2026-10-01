export type PublicationState = 'borrador' | 'en_revision' | 'listo' | 'publicado';
export type TrackingState = 'en_seguimiento' | 'pausado' | 'archivado';

export interface CatalogItem {
  id: string;
  nombre: string;
  slug: string;
  estado: 'activo' | 'inactivo';
  orden: number;
  descripcion?: string;
  parent_id?: string;
  aliases?: string[];
}

export interface Classification {
  tema_principal_id: string;
  tema_secundario_ids: string[];
  subtema_ids: string[];
  geografia: {
    alcance: 'global' | 'regional' | 'transfronterizo' | 'nacional' | 'local';
    region_ids: string[];
    subregion_ids: string[];
    pais_ids: string[];
    espacio_ids: string[];
  };
  actor_ids: string[];
  etiqueta_ids: string[];
}

export interface PublicSignal {
  senal_id: string;
  propietario_macroevento_id: string;
  fecha: string;
  titulo: string;
  resumen: string;
  fuente_ids: string[];
  estado_verificacion: 'pendiente' | 'revisada' | 'verificada';
}

export interface PublicTypedRelation {
  relacion_id: string;
  origen_id: string;
  destino_id: string;
  tipo: 'subordinada' | 'relacionada' | 'amplificadora' | 'contenedora' | 'contextual' | 'coincidente';
  mecanismo: string;
  evidencia_senal_ids: string[];
  direccion: 'origen_destino' | 'bidireccional';
  reciprocidad: boolean;
}

export interface PublicSignalReference {
  senal_id: string;
  tipo_uso: 'relacionada' | 'amplificadora' | 'contenedora' | 'contextual' | 'coincidente';
  efecto_segundo_orden: string;
}

export interface PublicSource {
  fuente_id: string;
  media_id: string | null;
  medio: string;
  titulo: string;
  fecha: string;
  idioma: string;
  tipo: string;
  url: string;
  estado_verificacion: 'pendiente' | 'revisada' | 'verificada';
}

export interface PublicExpertAnalysis {
  id: string; autor: string; fuente_id: string; fecha: string;
  tipo: string; sintesis: string; limite: string;
}

export interface PublicForecastParameter {
  id: string; nombre: string; tipo: string; fecha_evaluacion: string;
  estado_actual: string; lectura_actual: string; pregunta: string;
  senal_ids: string[]; fuente_ids: string[]; analisis_experto_ids: string[];
  probabilidades_asignadas: boolean; automatiza_puntuaciones: boolean;
  estados_observables: { estado: string; evidencia_necesaria: string; efecto: string }[];
  reglas_de_actualizacion: { id: string; condicion: string; efecto_pronostico: string; fuente_ids: string[] }[];
  reglas_editoriales: string[];
  revision: { horizonte_operativo: string; hito_oficial: { periodo: string; descripcion: string; fuente_ids: string[] }; cortes_editoriales_propuestos: string[]; disparadores: string[]; nota: string };
}

export interface PublicProcess {
  schema_version: 2;
  macroevento_id: string;
  slug: string;
  titulo: string;
  sintesis: string;
  estado_seguimiento: TrackingState;
  publicacion: {
    estado: PublicationState;
    publicado_el: string | null;
    actualizado_el: string;
  };
  progreso_publico: {
    etapa: PublicationState;
    proximo_paso: string;
    hitos_completados: string[];
  };
  clasificacion: Classification;
  que_esta_ocurriendo: string;
  por_que_importa: string;
  definicion_operativa?: string;
  delimitacion_exclusiones?: string[];
  pregunta_seguimiento?: string;
  hipotesis_principal?: string;
  hipotesis_alternativas?: string[];
  mecanismo_causal?: string;
  indicadores_fortalecimiento?: string[];
  indicadores_debilitamiento?: string[];
  condiciones_refutacion?: string[];
  incertidumbres?: string[];
  es_macroevento_rector?: boolean;
  macroevento_rector_id?: string | null;
  macroevento_rector_ids?: string[];
  claves_estructurales: string[];
  estado_evaluacion?: 'asignada' | 'no_asignada';
  valoraciones: {
    relevancia_geopolitica: number | null;
    atencion_mediatica: number | null;
    brecha: number | null;
    confianza: string | null;
    incertidumbre: number | null;
  };
  analisis_expertos?: PublicExpertAnalysis[];
  parametros_pronostico?: PublicForecastParameter[];
  senales: PublicSignal[];
  cronologia: PublicSignal[];
  fuente_ids: string[];
  recurso_visual_ids: string[];
  macroevento_relacionado_ids: string[];
  relaciones_tipadas?: PublicTypedRelation[];
  referencias_senal?: PublicSignalReference[];
  indicadores_seguimiento: string[];
  escenarios: {
    base: string;
    adverso: string;
    transformador: string;
  };
  metricas_editoriales?: {
    senales_omitidas_sin_fuente: number;
    fuentes_pendientes: number;
  };
}

export interface PublicPackage {
  formato: 'memo-geopolitico-publico';
  schema_version: 2;
  generado_el: string;
  procesos: PublicProcess[];
  fuentes: PublicSource[];
  recursos_visuales: unknown[];
  catalogos: {
    temas: CatalogItem[];
    subtemas: CatalogItem[];
    regiones: CatalogItem[];
    subregiones: CatalogItem[];
    paises_territorios: CatalogItem[];
    espacios_geopoliticos: CatalogItem[];
    actores: CatalogItem[];
    etiquetas: CatalogItem[];
    autores: CatalogItem[];
  };
}

export interface MediaRecord {
  media_id: string;
  nombre: string;
  url: string;
  sede: string;
  region: string;
  idioma: string;
  familia: string;
  funcion: string;
  propiedad: string;
  control: string;
  orientacion: string;
  perspectiva: string;
  fiabilidad: number | null;
  independencia: number | null;
  transparencia: number | null;
  rigor: number | null;
  correcciones: number | null;
  separacion: number | null;
  puntuacion: number | null;
  confianza: string;
  uso: string;
  corroboracion: string;
  corroborar_con: string;
  estado: string;
  observaciones: string;
  referencia: string;
  fecha_revision: string;
}
