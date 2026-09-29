import publicObservatory from '../data/public/observatorio.json';

export interface VisualResource {
  recurso_visual_id: string;
  titulo: string;
  url: string;
  descripcion?: string;
}

// Only the public catalog is eligible. An incomplete entry must not expose an empty section.
export const visualResources = (publicObservatory.recursos_visuales as unknown[])
  .filter((item): item is VisualResource => {
    if (!item || typeof item !== 'object') return false;
    const resource = item as Partial<VisualResource>;
    return typeof resource.recurso_visual_id === 'string' && !!resource.recurso_visual_id.trim()
      && typeof resource.titulo === 'string' && !!resource.titulo.trim()
      && typeof resource.url === 'string' && /^(?:https:\/\/|\/(?!\/))/.test(resource.url);
  });

export const visualResourcesAvailable = visualResources.length > 0;
