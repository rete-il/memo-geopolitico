import features from './features.json';

const config = features.support;

const environmentEnabled = import.meta.env.PROD
  ? config.enabledInProduction
  : config.enabledInDevelopment;

export const supportConfig = {
  enabled: environmentEnabled,
  enabledInDevelopment: config.enabledInDevelopment,
  enabledInProduction: config.enabledInProduction,
  url: config.kofiUrl,
  showOnAlerts: config.showOnAlerts,
  showOnEssays: config.showOnEssays,
  showInFooter: config.showInFooter,
} as const;
