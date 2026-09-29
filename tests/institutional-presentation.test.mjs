import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveInstitutionalLinks, groupPublicationBlockers } from '../tools/lib/institutional-presentation.mjs';

const visiblePages = [
  { slug: 'contacto', label: 'Contacto' },
  { slug: 'aviso-legal', label: 'Aviso legal' },
  { slug: 'privacidad', label: 'Privacidad' },
  { slug: 'derechos', label: 'Derechos y reutilización' },
];

test('los enlaces institucionales excluyen rutas ocultas y la página actual', () => {
  const references = [
    { page: 'derechos', label: 'Esta página' },
    { page: 'suscripcion', label: 'Servicio oculto' },
    { page: 'contacto', label: 'Otros canales de contacto' },
  ];
  const before = structuredClone({ references, visiblePages });
  assert.deepEqual(resolveInstitutionalLinks(references, 'derechos', visiblePages), [
    { href: '/contacto/', label: 'Otros canales de contacto' },
  ]);
  assert.deepEqual({ references, visiblePages }, before);
  assert.deepEqual(resolveInstitutionalLinks(references, 'derechos', []), []);
});

test('cada página destino aparece una sola vez y conserva el primer enlace', () => {
  assert.deepEqual(resolveInstitutionalLinks([
    { page: 'aviso-legal', label: 'Responsable', anchor: 'responsable' },
    { page: 'aviso-legal', label: 'Más información legal' },
    { page: 'privacidad', label: 'Privacidad' },
    { page: 'privacidad', label: 'Conservación', anchor: 'servicios-y-datos' },
  ], 'derechos', visiblePages), [
    { href: '/aviso-legal/#responsable', label: 'Responsable' },
    { href: '/privacidad/', label: 'Privacidad' },
  ]);
});

test('los fragmentos deben identificar secciones existentes de páginas visibles', () => {
  assert.deepEqual(resolveInstitutionalLinks([
    { page: 'privacidad', label: 'Servicios y conservación', anchor: 'servicios-y-datos' },
  ], 'derechos', visiblePages), [
    { href: '/privacidad/#servicios-y-datos', label: 'Servicios y conservación' },
  ]);
  for (const reference of [
    { page: 'privacidad', anchor: 'responsable' },
    { page: 'contacto', anchor: 'responsable' },
    { page: 'aviso-legal', anchor: '' },
  ]) {
    assert.throws(() => resolveInstitutionalLinks([reference], 'derechos', visiblePages), /Ancla institucional desconocida/);
  }
  assert.deepEqual(resolveInstitutionalLinks([
    { page: 'suscripcion', label: 'Oculta', anchor: 'inexistente' },
    { page: 'derechos', label: 'Actual', anchor: 'inexistente' },
  ], 'derechos', visiblePages), []);
});

test('los pendientes compartidos se agrupan sin perder requisitos ni páginas afectadas', () => {
  const blockers = {
    contacto: ['Aprobar textos', 'Habilitar correo', 'Habilitar correo'],
    privacidad: ['Aprobar textos', 'Definir conservación'],
    suscripcion: ['Aprobar textos', 'Configurar proveedor', 'Definir conservación'],
    derechos: [],
  };
  const pages = {
    contacto: { label: 'Contacto' },
    privacidad: { label: 'Privacidad' },
    suscripcion: { label: 'Suscripción y alertas' },
    derechos: { label: 'Derechos y reutilización' },
  };
  const before = structuredClone({ blockers, pages });
  const grouped = groupPublicationBlockers(blockers, pages);
  assert.deepEqual(grouped, [
    { text: 'Aprobar textos', pages: [
      { slug: 'contacto', label: 'Contacto' },
      { slug: 'privacidad', label: 'Privacidad' },
      { slug: 'suscripcion', label: 'Suscripción y alertas' },
    ] },
    { text: 'Habilitar correo', pages: [{ slug: 'contacto', label: 'Contacto' }] },
    { text: 'Definir conservación', pages: [
      { slug: 'privacidad', label: 'Privacidad' },
      { slug: 'suscripcion', label: 'Suscripción y alertas' },
    ] },
    { text: 'Configurar proveedor', pages: [{ slug: 'suscripcion', label: 'Suscripción y alertas' }] },
  ]);
  for (const [slug, requirements] of Object.entries(blockers)) {
    const restored = grouped.filter(group => group.pages.some(page => page.slug === slug)).map(group => group.text);
    assert.deepEqual(new Set(restored), new Set(requirements));
  }
  assert.deepEqual({ blockers, pages }, before);
  assert.deepEqual(groupPublicationBlockers({ contacto: [] }, pages), []);
});

test('agrupar conserva por separado requisitos que no son exactamente iguales', () => {
  assert.deepEqual(groupPublicationBlockers({ contacto: ['Revisar textos', 'Revisar Textos'] }, {}), [
    { text: 'Revisar textos', pages: [{ slug: 'contacto', label: 'contacto' }] },
    { text: 'Revisar Textos', pages: [{ slug: 'contacto', label: 'contacto' }] },
  ]);
});
