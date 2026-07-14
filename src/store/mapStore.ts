import { atom } from 'nanostores';

// Almacena el ID (slug) de la alerta que tiene el foco actual
export const activeAlertId = atom<string | null>(null);
