// Importação de linhas do Excel e exportação para CSV.

import { showMessage } from './admin.js';
import { sb } from './api.js';
import { buildModel } from './model.js';
import { refresh } from './render.js';
import { state } from './state.js';
import { $, dt, today } from './utils.js';

const STATE_LABELS = { paid: 'paga', part: 'parcial', open: 'por pagar' };

/** Converte DD/MM/AAAA ou AAAA-MM-DD para AAAA-MM-DD. Devolve null se for inválida. */
function parseDate(text) {
  const value = text.trim();
  const match = value.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

/** Lê as linhas coladas. Devolve as válidas e os números das inválidas. */
function parseLines(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const items = [];
  const invalid = [];
  lines.forEach((line, index) => {
    const [name, reason, value, date, paid] = line.split(/[;\t]/).map(cell => (cell || '').trim());
    const amount = parseFloat((value || '').replace(',', '.'));
    const isoDate = date ? parseDate(date) : today();
    if (!name || !reason || isNaN(amount) || !isoDate) {
      invalid.push(index + 1);
    } else {
      items.push({ name, reason, amount, date: isoDate, paid: /^(s|sim|y|1|true)/i.test(paid || '') });
    }
  });
  return { items, invalid };
}

async function importFines(event) {
  event.preventDefault();
  const { items, invalid } = parseLines($('importText').value);
  if (invalid.length) {
    showMessage(`Linhas inválidas: ${invalid.join(', ')}. Nada foi importado.`);
    return;
  }

  const sameName = (a, b) => a.toLowerCase() === b.toLowerCase();
  const newNames = [...new Set(items.map(item => item.name))]
    .filter(name => !state.players.some(player => sameName(player.name, name)));
  if (newNames.length) {
    const { error } = await sb.from('players').insert(newNames.map(name => ({ name })));
    if (error) {
      showMessage('Erro a criar jogadores.');
      return;
    }
  }

  const { data: players } = await sb.from('players').select('*');
  const rows = items.map(item => ({
    player_id: players.find(player => sameName(player.name, item.name)).id,
    reason: item.reason,
    amount: item.amount,
    date: item.date,
    paid: item.paid,
  }));
  const { error } = await sb.from('fines').insert(rows.map(({ paid, ...fine }) => fine));
  if (error) {
    showMessage('Erro ao importar multas.');
    return;
  }

  const payments = rows
    .filter(row => row.paid && row.amount > 0)
    .map(row => ({ player_id: row.player_id, amount: row.amount, date: row.date, note: 'Importado: ' + row.reason }));
  if (payments.length) {
    const { error: paymentError } = await sb.from('payments').insert(payments);
    if (paymentError) {
      showMessage('Multas importadas, mas erro nos pagamentos.');
      return;
    }
  }

  $('importText').value = '';
  showMessage('');
  alert(`${rows.length} multas importadas.`);
  refresh();
}

function downloadCsv(name, lines) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv' }));
  link.download = name;
  link.click();
}

function exportCsv() {
  const playerName = id => (state.players.find(player => player.id === id) || {}).name || '';
  const money = amount => String(amount).replace('.', ',');
  const fineStates = {};
  buildModel(state).forEach(row => Object.assign(fineStates, row.st));

  downloadCsv('multas.csv', ['Nome;Motivo;Valor;Data;Estado', ...state.fines.map(fine => [
    playerName(fine.player_id), fine.reason, money(fine.amount), dt(fine.date),
    STATE_LABELS[(fineStates[fine.id] || {}).state || 'open'],
  ].join(';'))]);
  downloadCsv('despesas.csv', ['Categoria;Descrição;Valor;Data', ...state.expenses.map(expense => [
    expense.category, expense.description, money(expense.amount), dt(expense.date),
  ].join(';'))]);
  downloadCsv('pagamentos.csv', ['Nome;Valor;Data;Nota', ...state.payments.map(payment => [
    playerName(payment.player_id), money(payment.amount), dt(payment.date), payment.note || '',
  ].join(';'))]);
}

/** Liga os eventos de importação e exportação. */
export function bindImportExport() {
  $('importForm').onsubmit = importFines;
  $('exportBtn').onclick = exportCsv;
}
