/* public/js/directorio.js */
(() => {
  'use strict';

  const source = window.MEDIA_DASHBOARD_DATA;
  if (!source || !Array.isArray(source.records)) {
    document.querySelector('.dashboard-root').innerHTML =
      "<p style='padding:2rem;font-family:sans-serif'>No se pudo cargar el conjunto de datos.</p>";
    return;
  }

  const allRows = source.records.map((row) => ({ ...row }));
  const labels = Object.fromEntries(
    (source.columns || []).map((c) => [c.key, c.label]),
  );

  const state = {
    search: '',
    region: '',
    familia: '',
    funcion: '',
    perspectiva: '',
    confianza: '',
    estado: '',
    minScore: 0,
    sortKey: 'puntuacion',
    sortDir: 'desc',
    page: 1,
    pageSize: 25,
  };

  const rootEl = document.querySelector('.dashboard-root');
  const $ = (selector) => rootEl.querySelector(selector);
  const $$ = (selector) => Array.from(rootEl.querySelectorAll(selector));

  const els = {
    search: $('#search'),
    region: $('#region'),
    familia: $('#familia'),
    funcion: $('#funcion'),
    perspectiva: $('#perspectiva'),
    confianza: $('#confianza'),
    estado: $('#estado'),
    minScore: $('#min-score'),
    minScoreValue: $('#min-score-value'),
    reset: $('#reset-filters'),
    exportCsv: $('#export-csv'),
    theme: $('#theme-toggle'),
    filteredText: $('#filtered-text'),
    resultsMeta: $('#results-meta'),
    tbody: $('#results-body'),
    empty: $('#empty-state'),
    pageInfo: $('#page-info'),
    prev: $('#prev-page'),
    next: $('#next-page'),
    pageSize: $('#page-size'),
    modal: $('#modal-backdrop'),
    modalBody: $('#modal-body'),
    modalTitle: $('#modal-title'),
    modalClose: $('#modal-close'),
    toast: $('#toast'),
    dataUpdated: $('#data-updated'),
    excelDownload: $('#excel-download'),
  };

  const normalize = (value) =>
    String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  const safeUrl = (value) => {
    try {
      const url = new URL(String(value));
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  };
  const uniqueSorted = (key) =>
    [
      ...new Set(
        allRows.map((row) => String(row[key] || '').trim()).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

  const setOptions = (select, values, placeholder) => {
    select.innerHTML =
      `<option value="">${escapeHtml(placeholder)}</option>` +
      values
        .map(
          (v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`,
        )
        .join('');
  };

  const updateUrl = () => {
    const params = new URLSearchParams();
    const pairs = {
      q: state.search,
      region: state.region,
      familia: state.familia,
      funcion: state.funcion,
      perspectiva: state.perspectiva,
      confianza: state.confianza,
      estado: state.estado,
      min: state.minScore || '',
      orden: state.sortKey,
      dir: state.sortDir,
    };
    Object.entries(pairs).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined)
        params.set(key, value);
    });
    const url = `${location.pathname}${params.toString() ? '?' + params.toString() : ''}${location.hash}`;
    history.replaceState(null, '', url);
  };

  const readUrl = () => {
    const params = new URLSearchParams(location.search);
    state.search = params.get('q') || '';
    state.region = params.get('region') || '';
    state.familia = params.get('familia') || '';
    state.funcion = params.get('funcion') || '';
    state.perspectiva = params.get('perspectiva') || '';
    state.confianza = params.get('confianza') || '';
    state.estado = params.get('estado') || '';
    state.minScore = Number(params.get('min') || 0);
    state.sortKey = params.get('orden') || 'puntuacion';
    state.sortDir = params.get('dir') === 'asc' ? 'asc' : 'desc';
  };

  const syncControls = () => {
    els.search.value = state.search;
    els.region.value = state.region;
    els.familia.value = state.familia;
    els.funcion.value = state.funcion;
    els.perspectiva.value = state.perspectiva;
    els.confianza.value = state.confianza;
    els.estado.value = state.estado;
    els.minScore.value = state.minScore;
    els.minScoreValue.textContent = Number(state.minScore).toFixed(1);
    els.pageSize.value = String(state.pageSize);
  };

  const searchableText = (row) =>
    normalize(
      [
        row.nombre,
        row.region,
        row.familia,
        row.funcion,
        row.perspectiva,
        row.orientacion,
        row.uso,
        row.corrobacion,
        row.estado,
        row.sede,
      ].join(' '),
    );

  const getFiltered = () => {
    const query = normalize(state.search);
    const filtered = allRows.filter((row) => {
      if (query && !searchableText(row).includes(query)) return false;
      if (state.region && row.region !== state.region) return false;
      if (state.familia && row.familia !== state.familia) return false;
      if (state.funcion && row.funcion !== state.funcion) return false;
      if (state.perspectiva && row.perspectiva !== state.perspectiva)
        return false;
      if (state.confianza && row.confianza !== state.confianza) return false;
      if (state.estado && row.estado !== state.estado) return false;
      if (Number(row.puntuacion || 0) < Number(state.minScore || 0))
        return false;
      return true;
    });
    const dir = state.sortDir === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      const av = a[state.sortKey],
        bv = b[state.sortKey];
      if (typeof av === 'number' || typeof bv === 'number')
        return (Number(av || 0) - Number(bv || 0)) * dir;
      return (
        String(av || '').localeCompare(String(bv || ''), 'es', {
          sensitivity: 'base',
          numeric: true,
        }) * dir
      );
    });
  };

  const average = (rows, key) =>
    rows.length
      ? rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / rows.length
      : 0;
  const countBy = (rows, key) => {
    const map = new Map();
    rows.forEach((row) => {
      const value =
        String(row[key] || 'Sin clasificar').trim() || 'Sin clasificar';
      map.set(value, (map.get(value) || 0) + 1);
    });
    return [...map.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'),
    );
  };

  const badgeClass = (value, type) => {
    const v = normalize(value);
    if (type === 'confidence') {
      if (v === 'alta') return 'badge--high';
      if (v.includes('media-alta') || v === 'media') return 'badge--medium';
      if (v === 'baja') return 'badge--warning';
      return 'badge--danger';
    }
    if (type === 'status') {
      if (v === 'activo') return 'badge--active';
      if (v === 'nuevo recomendado') return 'badge--info';
      if (v === 'uso condicionado') return 'badge--medium';
      if (v === 'secundario') return 'badge--warning';
      return 'badge--danger';
    }
    return 'badge--info';
  };

  const renderKpis = (rows) => {
    const high = rows.filter((r) => r.confianza === 'Alta').length;
    const active = rows.filter((r) =>
      ['Activo', 'Nuevo recomendado'].includes(r.estado),
    ).length;
    const africa = rows.filter((r) =>
      normalize(r.region).includes('africa'),
    ).length;
    const kpis = {
      'kpi-total': rows.length.toLocaleString('es'),
      'kpi-score': average(rows, 'puntuacion').toFixed(1),
      'kpi-high': high.toLocaleString('es'),
      'kpi-usable': active.toLocaleString('es'),
      'kpi-africa': africa.toLocaleString('es'),
    };
    Object.entries(kpis).forEach(([id, value]) => {
      const node = rootEl.querySelector(`#${id}`);
      if (node) node.textContent = value;
    });
  };

  const renderBars = (containerId, entries, limit = 8) => {
    const container = rootEl.querySelector(`#${containerId}`);
    const shown = entries.slice(0, limit);
    const max = Math.max(1, ...shown.map(([, count]) => count));
    container.innerHTML = shown.length
      ? shown
          .map(
            ([label, count]) => `
      <div class="bar-item" title="${escapeHtml(label)}">
        <div class="bar-label">${escapeHtml(label)}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%"></div></div>
        <div class="bar-count">${count}</div>
      </div>
    `,
          )
          .join('')
      : `<div class="empty">Sin datos para los filtros seleccionados.</div>`;
  };

  const donutColors = [
    '#2f75b5',
    '#1f6d70',
    '#d6a84b',
    '#c65911',
    '#a9b8c9',
    '#8b5cf6',
  ];
  const renderDonut = (containerId, legendId, entries, total) => {
    const donut = rootEl.querySelector(`#${containerId}`);
    const legend = rootEl.querySelector(`#${legendId}`);
    if (!total) {
      donut.style.background = 'var(--surface-alt)';
      donut.innerHTML = `<div class="donut-center">0<small>fuentes</small></div>`;
      legend.innerHTML = '';
      return;
    }
    let cursor = 0;
    const stops = entries.map(([label, count], i) => {
      const start = cursor;
      cursor += (count / total) * 100;
      return `${donutColors[i % donutColors.length]} ${start}% ${cursor}%`;
    });
    donut.style.background = `conic-gradient(${stops.join(',')})`;
    donut.innerHTML = `<div class="donut-center">${total}<small>fuentes</small></div>`;
    legend.innerHTML = entries
      .map(
        ([label, count], i) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${donutColors[i % donutColors.length]}"></span>
        <span>${escapeHtml(label)}</span>
        <strong>${count}</strong>
      </div>
    `,
      )
      .join('');
  };

  const renderCharts = (rows) => {
    renderBars('region-bars', countBy(rows, 'region'), 9);
    renderBars('family-bars', countBy(rows, 'familia'), 9);
    renderDonut(
      'confidence-donut',
      'confidence-legend',
      countBy(rows, 'confianza'),
      rows.length,
    );
    renderDonut(
      'status-donut',
      'status-legend',
      countBy(rows, 'estado'),
      rows.length,
    );
  };

  const rowHtml = (row) => {
    const url = safeUrl(row.url);
    return `
      <tr>
        <td>
          <div class="source-name">${escapeHtml(row.nombre)}</div>
          ${url ? `<a class="source-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Visitar sitio ↗</a>` : ''}
        </td>
        <td>${escapeHtml(row.region)}</td>
        <td>${escapeHtml(row.familia)}</td>
        <td>${escapeHtml(row.funcion)}</td>
        <td>${escapeHtml(row.perspectiva)}</td>
        <td><span class="score">${Number(row.puntuacion || 0).toFixed(1)}</span></td>
        <td><span class="badge ${badgeClass(row.confianza, 'confidence')}">${escapeHtml(row.confianza)}</span></td>
        <td><span class="badge ${badgeClass(row.estado, 'status')}">${escapeHtml(row.estado)}</span></td>
        <td><button class="btn btn--ghost btn--small details-btn" data-id="${escapeHtml(row.id)}">Ficha</button></td>
      </tr>
    `;
  };

  const renderTable = (rows) => {
    const totalPages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * state.pageSize;
    const pageRows = rows.slice(start, start + state.pageSize);
    els.tbody.innerHTML = pageRows.map(rowHtml).join('');
    els.empty.hidden = rows.length > 0;
    els.resultsMeta.textContent = rows.length
      ? `${rows.length.toLocaleString('es')} fuentes · mostrando ${start + 1}–${Math.min(start + state.pageSize, rows.length)}`
      : '0 fuentes';
    els.pageInfo.textContent = `Página ${state.page} de ${totalPages}`;
    els.prev.disabled = state.page <= 1;
    els.next.disabled = state.page >= totalPages;
    $$('.details-btn').forEach((button) => {
      button.addEventListener('click', () => openModal(button.dataset.id));
    });
  };

  const detailItem = (label, value, isLink = false) => {
    const url = isLink ? safeUrl(value) : '';
    return `
      <dl class="detail">
        <dt>${escapeHtml(label)}</dt>
        <dd>${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>` : escapeHtml(value || '—')}</dd>
      </dl>
    `;
  };

  const metric = (label, value) =>
    `<div class="metric"><b>${Number(value || 0).toFixed(1)}</b><span>${escapeHtml(label)}</span></div>`;

  const openModal = (id) => {
    const row = allRows.find((item) => String(item.id) === String(id));
    if (!row) return;
    els.modalTitle.textContent = row.nombre;
    els.modalBody.innerHTML = `
      <section class="detail-section"><h3>Identidad y alcance</h3><div class="detail-grid">
          ${detailItem(labels.url || 'URL', row.url, true)} ${detailItem(labels.sede || 'Sede', row.sede)} ${detailItem(labels.region || 'Región', row.region)} ${detailItem(labels.idioma || 'Idioma', row.idioma)} ${detailItem(labels.familia || 'Familia', row.familia)} ${detailItem(labels.funcion || 'Función', row.funcion)}
      </div></section>
      <section class="detail-section"><h3>Marco institucional y geopolítico</h3><div class="detail-grid">
          ${detailItem(labels.propiedad || 'Propiedad', row.propiedad)} ${detailItem(labels.control || 'Control', row.control)} ${detailItem(labels.orientacion || 'Orientación', row.orientacion)} ${detailItem(labels.perspectiva || 'Perspectiva', row.perspectiva)} ${detailItem(labels.confianza || 'Confianza', row.confianza)} ${detailItem(labels.estado || 'Estado', row.estado)}
      </div></section>
      <section class="detail-section"><h3>Evaluación</h3><div class="metric-grid">
          ${metric('Fiabilidad', row.fiabilidad)} ${metric('Independencia', row.independencia)} ${metric('Transparencia', row.transparencia)} ${metric('Rigor', row.rigor)} ${metric('Correcciones', row.correcciones)} ${metric('Noticia/opinión', row.separacion)} ${metric('Global', row.puntuacion)}
      </div></section>
      <section class="detail-section"><h3>Uso analítico</h3><div class="detail-grid">
          ${detailItem(labels.uso || 'Uso recomendado', row.uso)} ${detailItem(labels.corroboracion || 'Corroboración', row.corroboracion)} ${detailItem(labels.corroborar_con || 'Corroborar con', row.corroborar_con)} ${detailItem(labels.observaciones || 'Observaciones', row.observaciones)} ${detailItem(labels.referencia || 'Referencia institucional', row.referencia, true)} ${detailItem(labels.fecha_revision || 'Fecha de revisión', row.fecha_revision)}
      </div></section>
    `;
    els.modal.classList.add('is-open');
    els.modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    els.modalClose.focus();
  };

  const closeModal = () => {
    els.modal.classList.remove('is-open');
    els.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const activeFilterText = (rows) => {
    const active = [];
    if (state.search) active.push(`búsqueda: “${state.search}”`);
    [
      'region',
      'familia',
      'funcion',
      'perspectiva',
      'confianza',
      'estado',
    ].forEach((key) => {
      if (state[key]) active.push(`${key}: ${state[key]}`);
    });
    if (state.minScore > 0)
      active.push(`puntuación ≥ ${Number(state.minScore).toFixed(1)}`);
    els.filteredText.textContent = active.length
      ? `${rows.length} resultados · ${active.join(' · ')}`
      : 'Mostrando la matriz completa.';
  };

  const updateSortIndicators = () => {
    $$('[data-sort]').forEach((button) => {
      const base =
        button.dataset.label || button.textContent.replace(/[↑↓]/g, '').trim();
      button.dataset.label = base;
      button.textContent =
        button.dataset.sort === state.sortKey
          ? `${base} ${state.sortDir === 'asc' ? '↑' : '↓'}`
          : base;
    });
  };

  const render = () => {
    const rows = getFiltered();
    renderKpis(rows);
    renderCharts(rows);
    renderTable(rows);
    activeFilterText(rows);
    updateSortIndicators();
    updateUrl();
  };

  const debounce = (fn, delay = 180) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  const exportCsv = () => {
    const rows = getFiltered();
    const columns = source.columns || [];
    const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [
      columns.map((c) => quote(c.label)).join(','),
      ...rows.map((row) => columns.map((c) => quote(row[c.key])).join(',')),
    ].join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'medios_geopoliticos_filtrados.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${rows.length} filas exportadas.`);
  };

  const showToast = (message) => {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(
      () => els.toast.classList.remove('show'),
      2200,
    );
  };
  const resetFilters = () => {
    Object.assign(state, {
      search: '',
      region: '',
      familia: '',
      funcion: '',
      perspectiva: '',
      confianza: '',
      estado: '',
      minScore: 0,
      page: 1,
    });
    syncControls();
    render();
  };

  const initTheme = () => {
    const saved = localStorage.getItem('media-dashboard-theme');
    if (saved) rootEl.dataset.theme = saved;
    els.theme.textContent =
      rootEl.dataset.theme === 'dark' ? '☀️ Tema claro' : '🌙 Tema oscuro';
    els.theme.addEventListener('click', () => {
      const next = rootEl.dataset.theme === 'dark' ? 'light' : 'dark';
      rootEl.dataset.theme = next;
      localStorage.setItem('media-dashboard-theme', next);
      els.theme.textContent =
        next === 'dark' ? '☀️ Tema claro' : '🌙 Tema oscuro';
    });
  };

  const init = () => {
    readUrl();
    setOptions(els.region, uniqueSorted('region'), 'Todas las regiones');
    setOptions(els.familia, uniqueSorted('familia'), 'Todas las familias');
    setOptions(els.funcion, uniqueSorted('funcion'), 'Todas las funciones');
    setOptions(
      els.perspectiva,
      uniqueSorted('perspectiva'),
      'Todas las perspectivas',
    );
    setOptions(els.confianza, uniqueSorted('confianza'), 'Toda confianza');
    setOptions(els.estado, uniqueSorted('estado'), 'Todos los estados');
    syncControls();
    initTheme();

    els.dataUpdated.textContent = `Fuente de datos procesada · ${source.metadata.total_fuentes} medios · revisión ${source.metadata.ultima_revision || 'sin fecha'}`;

    els.search.addEventListener(
      'input',
      debounce(() => {
        state.search = els.search.value;
        state.page = 1;
        render();
      }),
    );
    [
      ['region', els.region],
      ['familia', els.familia],
      ['funcion', els.funcion],
      ['perspectiva', els.perspectiva],
      ['confianza', els.confianza],
      ['estado', els.estado],
    ].forEach(([key, element]) => {
      element.addEventListener('change', () => {
        state[key] = element.value;
        state.page = 1;
        render();
      });
    });
    els.minScore.addEventListener('input', () => {
      state.minScore = Number(els.minScore.value);
      els.minScoreValue.textContent = state.minScore.toFixed(1);
      state.page = 1;
      render();
    });
    els.reset.addEventListener('click', resetFilters);
    els.exportCsv.addEventListener('click', exportCsv);
    els.prev.addEventListener('click', () => {
      state.page -= 1;
      render();
    });
    els.next.addEventListener('click', () => {
      state.page += 1;
      render();
    });
    els.pageSize.addEventListener('change', () => {
      state.pageSize = Number(els.pageSize.value);
      state.page = 1;
      render();
    });
    $$('[data-sort]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.sort;
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          state.sortKey = key;
          state.sortDir = key === 'puntuacion' ? 'desc' : 'asc';
        }
        render();
      });
    });

    els.modalClose.addEventListener('click', closeModal);
    els.modal.addEventListener('click', (event) => {
      if (event.target === els.modal) closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && els.modal.classList.contains('is-open'))
        closeModal();
    });

    render();
  };

  init();
})();
