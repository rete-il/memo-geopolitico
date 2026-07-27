export type PublicationState = 'borrador' | 'en_revision' | 'listo' | 'publicado';
export type TrackingState = 'en_seguimiento' | 'pausado' | 'archivado';

export interface CatalogItem {
  id: string;
  nombre: string;
  slug: string;
  estado: 'activo' | 'inactivo';
  orden: number;
  parent_id?: string;
  aliases?: string[];
}

export interface Classification {
  tema_principal_id: string | null;
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
  fecha: string;
  titulo: string;
  resumen: string;
  fuente_ids: string[];
  estado_verificacion: 'pendiente' | 'revisada' | 'verificada';
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
  claves_estructurales: string[];
  valoraciones: {
    relevancia_geopolitica: number;
    atencion_mediatica: number;
    brecha: number;
    confianza: string;
    incertidumbre: number;
  };
  senales: PublicSignal[];
  cronologia: PublicSignal[];
  fuente_ids: string[];
  recurso_visual_ids: string[];
  macroevento_relacionado_ids: string[];
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
  fiabilidad: number;
  independencia: number;
  transparencia: number;
  rigor: number;
  correcciones: number;
  separacion: number;
  puntuacion: number;
  confianza: string;
  uso: string;
  corroboracion: string;
  corroborar_con: string;
  estado: string;
  observaciones: string;
  referencia: string;
  fecha_revision: string;
}
