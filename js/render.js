// Desenho do ecrã a partir do estado.

import { fetchAll } from './api.js';
import { buildModel, cashTotals, MEDALS, podiumOf } from './model.js';
import { state } from './state.js';
import { $, dt, esc, eur, eurC, toCents } from './utils.js';

const CATEGORIES = [['🍺', 'Bebidas'], ['☕', 'Café'], ['🍖', 'Churrascos'], ['🧰', 'Material'], ['🏆', 'Prémios']];
const EXPENSES_SHOWN = 8;

const categoryIcon = name => (CATEGORIES.find(category => category[1] === name) || ['🧾'])[0];
const signClass = value => (value < 0 ? 'unpaid' : 'paid');
const ruleLabel = rule => `${eur(rule.amount)}${rule.per_minute ? ' /min' : ''}`;

/** Lê os dados do Supabase e redesenha a página. */
export async function refresh() {
  const data = await fetchAll();
  if (!data) {
    $('list').innerHTML = '<div class="empty">Erro a carregar dados. Verifica a configuração.</div>';
    return;
  }
  Object.assign(state, data);
  render();
}

function renderCash(rows) {
  const { recebido, gasto, caixa, aReceber, previsao } = cashTotals(rows, state.expenses);
  $('cash').innerHTML = `
    <div class="cash-big"><b class="${signClass(caixa)}">${eurC(caixa)}</b><span>Disponível em caixa</span></div>
    <div class="cash-grid">
      <div><b class="paid">${eurC(recebido)}</b><small>Recebido (pagamentos)</small></div>
      <div><b>${eurC(gasto)}</b><small>Gasto em despesas</small></div>
      <div><b class="unpaid">${eurC(aReceber)}</b><small>Ainda a receber</small></div>
      <div><b class="${signClass(previsao)}">${eurC(previsao)}</b><small>Previsão se todos pagarem</small></div>
    </div>
    ${caixa < 0 ? `<div class="warn">⚠️ A caixa está <b>${eurC(-caixa)}</b> abaixo de zero: as despesas já são maiores do que o dinheiro recebido. Volta ao positivo à medida que o pessoal for pagando as multas.</div>` : ''}
    ${state.noExp && state.admin ? '<div class="warn">Não foi possível carregar as despesas.</div>' : ''}`;

  renderExpenses(gasto);
  if (state.admin) {
    renderCategoryOptions();
    ePreview(caixa);
  }
}

function renderExpenses(gasto) {
  const { expenses, showAllExp } = state;
  if (!expenses.length) {
    $('expenses').innerHTML = '<div class="empty">Ainda não há despesas registadas.</div>';
    return;
  }

  const byCategory = {};
  expenses.forEach(expense => {
    byCategory[expense.category] = (byCategory[expense.category] || 0) + toCents(expense.amount);
  });
  const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(1, ...categories.map(category => category[1]));
  const list = showAllExp ? expenses : expenses.slice(0, EXPENSES_SHOWN);

  $('expenses').innerHTML = `
    <div class="cash-big cash-big-tight"><b>${eurC(gasto)}</b><span>Total gasto em ${expenses.length} despesa(s)</span></div>
    <h3 class="exp-title">Onde gastámos</h3>
    ${categories.map(([name, value]) => `<div class="cat"><span class="cn">${categoryIcon(name)} ${esc(name)}</span><span class="cb"><i style="width:${value / maxCategory * 100}%"></i></span><span class="cv">${eurC(value)}</span></div>`).join('')}
    <h3 class="exp-title exp-title-gap">Últimas despesas</h3>
    ${list.map(expense => `<div class="exp"><div class="info">${categoryIcon(expense.category)} ${esc(expense.description)}<br><small>${dt(expense.date)} · ${esc(expense.category)}</small></div><b>${eur(expense.amount)}</b>${state.admin ? `<button class="danger small" data-delexp="${expense.id}">✕</button>` : ''}</div>`).join('')}
    ${expenses.length > EXPENSES_SHOWN ? `<button class="ghost small more-btn" id="expMore">${showAllExp ? 'Ver menos' : `Ver todas (${expenses.length})`}</button>` : ''}`;

  const moreButton = $('expMore');
  if (moreButton) {
    moreButton.onclick = () => {
      state.showAllExp = !state.showAllExp;
      render();
    };
  }
}

function renderCategoryOptions() {
  const selected = $('eCat').value;
  const known = CATEGORIES.map(category => category[1]);
  const extra = [...new Set(state.expenses.map(expense => expense.category))]
    .filter(name => name && !known.includes(name))
    .sort();
  $('eCat').innerHTML = [...known, ...extra]
    .map(name => `<option value="${esc(name)}">${categoryIcon(name)} ${esc(name)}</option>`)
    .join('') + '<option value="__other">➕ Outra categoria…</option>';
  if (selected) $('eCat').value = selected;
  if (!$('eCat').value) $('eCat').selectedIndex = 0;
}

function renderPodium(podium) {
  $('podium').innerHTML = podium.length
    ? [...podium].sort((a, b) => a.rank - b.rank).map(row => {
      const medal = MEDALS[row.rank];
      return `<div class="pc r${row.rank}"><div class="big">${medal[0]}${medal[1]}</div><div class="t">${medal[2]}</div><strong>${esc(row.p.name)}</strong><span class="v">${eurC(row.total)}</span></div>`;
    }).join('')
    : '<div class="empty empty-full">Ainda ninguém no pódio. 😇</div>';
}

function fineHtml(row, fine) {
  const status = row.st[fine.id] || { state: 'open', used: 0 };
  const label = status.state === 'paid'
    ? 'Paga'
    : status.state === 'part' ? `Parcial (${eurC(status.used)} pagos)` : 'Por pagar';
  return `
        <div class="fine"><div class="info">${esc(fine.reason)}${fine.game_day ? ' ⚽×2' : ''}<br><small>${dt(fine.date)}</small></div>
          <div class="amount ${status.state === 'paid' ? 'paid' : 'unpaid'}">${eur(fine.amount)}<br><small>${label}</small></div>
          ${state.admin ? `<div class="actions"><button class="danger small" data-del="${fine.id}">✕</button></div>` : ''}
        </div>`;
}

function paymentsHtml(row) {
  if (!row.pays.length) return '';
  return `<div class="pays"><strong class="pays-title">Pagamentos</strong>${row.pays.map(payment => `
          <div class="pay"><span>${dt(payment.date)}${payment.note ? ' · ' + esc(payment.note) : ''}</span><span><b class="paid">+${eur(payment.amount)}</b>${state.admin ? ` <button class="danger small" data-delpay="${payment.id}">✕</button>` : ''}</span></div>`).join('')}</div>`;
}

function detailsHtml(row) {
  return `<div class="fines">
        ${row.credit > 0 ? `<div class="note">💰 Saldo a favor de <b>${eurC(row.credit)}</b>. É descontado automaticamente nas próximas multas.</div>` : ''}
        ${row.mine.length ? row.mine.map(fine => fineHtml(row, fine)).join('') : '<div class="empty">Sem multas 🎉</div>'}
        ${paymentsHtml(row)}
      </div>`;
}

function playerHtml(row, index, key, max, medals) {
  const { p: player } = row;
  const balance = row.owed > 0
    ? eurC(row.owed)
    : row.credit > 0 ? `<span class="credit">+${eurC(row.credit)}</span><br><small>saldo</small>` : eurC(0);
  return `
    <div class="p${player.active ? '' : ' gone'}" data-id="${player.id}">
      <div class="ph"><div class="rk">${index + 1}</div>
        <div class="nm"><strong>${esc(player.name)}</strong>${medals[player.id] ? ' ' + MEDALS[medals[player.id]][1] : ''}${player.role === 'tecnico' ? '<span class="tag">Treinador</span>' : ''}${player.active ? '' : '<span class="tag">Saiu</span>'}<span class="sub"><b>Total ${eurC(row.total)}</b> · pago ${eurC(row.paid)}</span><span class="sub">multas ${eurC(row.multas)} + quotas ${eurC(row.quotas)}</span>
          <div class="bar"><i style="width:${row[key] / max * 100}%"></i></div></div>
        <div class="amount ${row.owed > 0 ? 'unpaid' : 'paid'}">${balance}</div>
      </div>
      ${state.admin ? `<div class="adm"><button class="ghost small" data-act="${player.id}" data-v="${player.active}">${player.active ? 'Marcar como saiu' : 'Reativar'}</button><button class="danger small" data-delp="${player.id}">Apagar</button></div>` : ''}
      ${state.open.has(player.id) ? detailsHtml(row) : ''}
    </div>`;
}

function renderPlayers(rows, podium) {
  const medals = {};
  podium.forEach(row => { medals[row.p.id] = row.rank; });

  const query = $('search').value.toLowerCase();
  const filter = $('filter').value;
  const key = $('sort').value === 'owed' ? 'owed' : 'total';
  const shown = rows
    .filter(row => row.p.name.toLowerCase().includes(query)
      && (filter === 'all' || (filter === 'owing' ? row.owed > 0 : row.owed === 0)))
    .sort((a, b) => Number(b.p.active) - Number(a.p.active)
      || b[key] - a[key]
      || b.owed - a.owed
      || a.p.name.localeCompare(b.p.name));
  const max = Math.max(1, ...shown.map(row => row[key]));

  $('list').innerHTML = shown.map((row, index) => playerHtml(row, index, key, max, medals)).join('')
    || '<div class="empty">Nenhum jogador encontrado.</div>';
}

function renderAdminOptions(rows) {
  const selectedPayer = $('payPlayer').value;
  $('fPlayer').innerHTML = '<option value="">Jogador...</option>' + state.players
    .filter(player => player.active)
    .map(player => `<option value="${player.id}">${esc(player.name)}</option>`).join('');
  $('payPlayer').innerHTML = '<option value="">Jogador...</option>' + rows.map(row => {
    const hint = row.owed > 0 ? ` (deve ${eurC(row.owed)})` : row.credit > 0 ? ` (saldo ${eurC(row.credit)})` : '';
    return `<option value="${row.p.id}">${esc(row.p.name)}${hint}</option>`;
  }).join('');
  $('payPlayer').value = selectedPayer;
  payPreview();
  $('fRule').innerHTML = '<option value="">Multa predefinida...</option>' + state.rules
    .map(rule => `<option value="${rule.id}">${esc(rule.reason)} (${ruleLabel(rule)})</option>`).join('');
  $('rulesList').innerHTML = state.rules
    .map(rule => `<span class="chip">${esc(rule.reason)} <b>${ruleLabel(rule)}</b><button data-delr="${rule.id}">✕</button></span>`).join('');
}

/** Redesenha a página a partir do estado atual. */
export function render() {
  const rows = buildModel(state);
  const podium = podiumOf(rows);
  const sum = field => rows.reduce((total, row) => total + row[field], 0);

  $('sOwed').textContent = eurC(sum('owed'));
  $('sPaid').textContent = eurC(sum('paid'));
  $('sCredit').textContent = eurC(sum('credit'));
  $('sCount').textContent = eurC(sum('total'));

  renderCash(rows);
  renderPodium(podium);
  renderPlayers(rows, podium);

  $('publicRules').innerHTML = state.rules
    .map(rule => `<span class="chip">${esc(rule.reason)} <b>${ruleLabel(rule)}</b></span>`).join('')
    || '<div class="empty">Ainda sem tabela.</div>';

  if (state.admin) renderAdminOptions(rows);
}

/** Mostra o efeito do pagamento que está a ser preenchido. */
export function payPreview() {
  const box = $('payPreview');
  const playerId = $('payPlayer').value;
  const value = toCents($('payAmount').value || 0);
  if (!playerId || !value) {
    box.classList.add('hidden');
    return;
  }
  const row = buildModel(state).find(item => item.p.id === playerId);
  if (!row) return;

  const balance = row.credit - row.owed + value;
  const current = row.owed > 0
    ? `Dívida atual: <b>${eurC(row.owed)}</b>. `
    : row.credit > 0 ? `Saldo atual: <b>${eurC(row.credit)}</b>. ` : '';
  const after = balance >= 0
    ? `Depois deste pagamento: sem dívida${balance > 0 ? ` e <b class="credit">saldo de ${eurC(balance)}</b>` : ''}.`
    : `Depois deste pagamento: ainda deve <b>${eurC(-balance)}</b>.`;
  box.classList.remove('hidden');
  box.innerHTML = current + after;
}

/** Mostra o efeito da despesa que está a ser preenchida. */
export function ePreview(caixa) {
  const box = $('ePreview');
  const value = toCents($('eAmount').value || 0);
  if (!value) {
    box.classList.add('hidden');
    return;
  }
  const after = caixa - value;
  box.classList.remove('hidden');
  box.innerHTML = `Caixa atual <b>${eurC(caixa)}</b>. Depois desta despesa: <b class="${signClass(after)}">${eurC(after)}</b>${after < 0 ? ' (negativa)' : ''}.`;
}
