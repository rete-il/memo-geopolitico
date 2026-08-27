import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_INTERNAL_CATEGORIES,
  internalCategoryById,
  normalizeInternalCategories,
} from '../public/internal-categories.js';

test('crea el catálogo inicial de categorías internas con IDs estables', () => {
  const categories = normalizeInternalCategories();
  assert.equal(categories.length, DEFAULT_INTERNAL_CATEGORIES.length);
  assert.equal(internalCategoryById(categories, 'Seguridad conflicto')?.nombre, 'Seguridad y conflicto');
  assert.ok(categories.every((category) => category.estado === 'activa'));
});

test('conserva un nombre editorial y el estado archivado sin cambiar el ID', () => {
  const categories = normalizeInternalCategories([{
    id: 'seguridad_conflicto',
    nombre: 'Seguridad, defensa y conflicto',
    descripcion: 'Categoría revisada por el editor.',
    estado: 'archivada',
  }]);
  const category = internalCategoryById(categories, 'seguridad_conflicto');
  assert.deepEqual(category, {
    id: 'seguridad_conflicto',
    nombre: 'Seguridad, defensa y conflicto',
    descripcion: 'Categoría revisada por el editor.',
    estado: 'archivada',
  });
});

test('incorpora como activa una categoría usada por un macroevento heredado', () => {
  const categories = normalizeInternalCategories([], [{ categoria: 'Acuerdo de defensa regional' }]);
  assert.deepEqual(internalCategoryById(categories, 'acuerdo_de_defensa_regional'), {
    id: 'acuerdo_de_defensa_regional',
    nombre: 'Acuerdo De Defensa Regional',
    descripcion: '',
    estado: 'activa',
  });
});
