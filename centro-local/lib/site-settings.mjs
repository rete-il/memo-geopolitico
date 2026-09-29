import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { validateFeatureConfiguration, publicationBlockers } from '../../tools/lib/institutional-policy.mjs';
import { contactDefinitions } from '../../tools/lib/contact-policy.mjs';
import { identityDefinitions } from '../../tools/lib/institutional-identity.mjs';
import { groupPublicationBlockers } from '../../tools/lib/institutional-presentation.mjs';
const defaultFile = new URL('../../src/config/features.json', import.meta.url);
const revision = text => createHash('sha256').update(text).digest('hex');
function describeSettings(config, currentRevision) {
  const blockers = Object.fromEntries(Object.keys(config.institutional.pages).map(slug => [slug, publicationBlockers(config, slug)]));
  const activeBlockers = Object.fromEntries(Object.entries(blockers).filter(([slug]) => config.institutional.pages[slug].enabledInProduction));
  let error = null;
  try { validateFeatureConfiguration(config); } catch (failure) { error = failure.message; }
  return { config, contactDefinitions, identityDefinitions, revision: currentRevision, blockers,
    publicationRequirements: groupPublicationBlockers(activeBlockers, config.institutional.pages),
    validation: { valid: error === null, error } };
}
export function getSiteSettings(file = defaultFile) {
  const raw = fs.readFileSync(file, 'utf8');
  const config = JSON.parse(raw);
  return describeSettings(config, revision(raw));
}
export async function siteSettingsRequest(req, res, sendJson, file = defaultFile, validateOnly = false) {
  if (req.method === 'GET' && !validateOnly) { sendJson(res, 200, getSiteSettings(file)); return; }
  if (req.method !== (validateOnly ? 'POST' : 'PUT')) { sendJson(res, 405, {error:'Método no permitido'}); return; }
  if (req.headers.origin !== `http://${req.headers.host}` || !req.headers['content-type']?.startsWith('application/json')) { sendJson(res, 403, {error:'Guardar requiere el formulario del Centro local'}); return; }
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 32000) { sendJson(res, 413, {error:'Configuración demasiado grande'}); return; } }
  try {
    const body = JSON.parse(raw);
    const current = getSiteSettings(file);
    if (body.revision !== current.revision) { sendJson(res,409,{error:'La configuración cambió. Es necesario recargar la página antes de guardar.'}); return; }
    // Only existing keys can change. No arbitrary files, routes or providers are created.
    const merged = structuredClone(current.config);
    function merge(target, incoming) {
      for (const key of Object.keys(target)) {
        if (!Object.hasOwn(incoming || {}, key)) continue;
        if (typeof target[key] === 'object') merge(target[key], incoming[key]);
        else { if (typeof target[key] !== typeof incoming[key]) throw new Error('Tipo de dato inválido'); target[key] = incoming[key]; }
      }
    }
    merge(merged, body.config);
    if (validateOnly) { sendJson(res, 200, describeSettings(merged, current.revision)); return; }
    validateFeatureConfiguration(merged);
    const temp = file instanceof URL ? new URL(`${file.href}.tmp`) : `${file}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(merged,null,2)+'\n');
    fs.renameSync(temp,file);
    sendJson(res,200,getSiteSettings(file));
  } catch(error) { sendJson(res,400,{error:error.message}); }
}
