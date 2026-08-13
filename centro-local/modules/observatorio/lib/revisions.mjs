import crypto from 'node:crypto';

const clean = (value) => String(value ?? '').trim();

export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

export function equalRevision(left, right) {
  return JSON.stringify(stable(left)) === JSON.stringify(stable(right));
}

export function proposalComparable(proposal = {}) {
  return {
    macroevento_id: proposal.macroevento_id,
    operation: proposal.operation,
    identity_preserved: proposal.identity_preserved,
    proposed_process: proposal.proposed_process,
    proposed_sources: proposal.proposed_sources,
    diff: proposal.diff,
  };
}

export function revisionHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}

export function analysisRevision({ markdown = '', metadata = {} } = {}) {
  return revisionHash({
    markdown: `${String(markdown).replace(/\r\n?/g, '\n').trimEnd()}\n`,
    post_id: clean(metadata.post_id),
    slug: clean(metadata.slug),
    macroevento_principal_id: clean(metadata.macroevento_principal_id),
    fuente_ids: [...(metadata.fuente_ids || [])].map(clean).filter(Boolean).sort(),
  });
}

export function processRevision(proposal = {}) {
  return revisionHash(proposalComparable(proposal));
}
