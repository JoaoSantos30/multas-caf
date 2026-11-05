// Ponto de arranque do site.

import { bindAdmin, handleListAction, setAdmin } from './admin.js';
import { sb } from './api.js';
import { bindImportExport } from './import-export.js';
import { refresh, render } from './render.js';
import { state } from './state.js';
import { $ } from './utils.js';

function bindPublicControls() {
  $('search').oninput = render;
  $('filter').onchange = render;
  $('sort').onchange = render;
  $('list').onclick = event => {
    const button = event.target.closest('button');
    if (button) {
      handleListAction(button);
      return;
    }
    const row = event.target.closest('.p');
    if (!row || event.target.closest('.fines') || event.target.closest('.adm')) return;
    const { id } = row.dataset;
    if (state.open.has(id)) state.open.delete(id);
    else state.open.add(id);
    render();
  };
}

function start() {
  if (!sb) {
    $('list').innerHTML = '<div class="empty">Não foi possível carregar o site. Tenta atualizar a página.</div>';
    return;
  }
  bindPublicControls();
  bindAdmin();
  bindImportExport();
  sb.auth.getSession().then(({ data }) => {
    if (data.session) setAdmin(true);
  });
  refresh();
}

start();
