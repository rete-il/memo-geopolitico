const ANALYTICAL_FIELDS = Object.freeze([
  'pregunta_seguimiento', 'definicion_operativa', 'delimitacion_exclusiones',
  'hipotesis_principal', 'hipotesis_alternativas', 'mecanismo_causal',
  'indicadores_fortalecimiento', 'indicadores_debilitamiento',
  'condiciones_refutacion', 'incertidumbres', 'claves_estructurales',
  'parametros_pronostico', 'analisis_expertos', 'publicacion',
  'clasificacion', 'nota_fecha_corte', 'estado_seguimiento', 'fundamento_evaluacion',
]);

// These researched fields have no editor controls. Preserve their JSON structure,
// including source references and forecast parameters stored as arrays or objects.
export function preserveAnalyticalFields(event = {}) {
  return Object.fromEntries(ANALYTICAL_FIELDS
    .filter((key) => Object.hasOwn(event, key))
    .map((key) => [key, JSON.parse(JSON.stringify(event[key]))]));
}
