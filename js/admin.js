// Login, separadores e formulários do administrador.

import { removeRow, sb, updateRow } from './api.js';
import { buildModel, cashTotals } from './model.js';
import { ePreview, payPreview, refresh, render } from './render.js';
import { state } from './state.js';
import { $, today } from './utils.js';

const WRITE_FAILED = 'Não foi possível guardar a alteração. A sessão pode ter expirado: sai e entra de novo.';
const DESKTOP_MIN_WIDTH = 700;

let currentTab = null;

/** Mostra uma mensagem no painel de admin. Um texto vazio limpa a mensagem. */
export function showMessage(text) {
  $('adminMsg').textContent = text;
}

function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.apanel').forEach(panel => panel.classList.toggle('hidden', panel.dataset.p !== tab));
  document.querySelectorAll('#admTabs button').forEach(button => button.classList.toggle('on', button.dataset.t === tab));
}

/** Liga ou desliga o modo de administrador. */
export function setAdmin(on) {
  state.admin = on;
  if (on && currentTab === null && window.innerWidth >= DESKTOP_MIN_WIDTH) setTab('fine');
  if (!on) setTab(null);
  $('adminPanel').classList.toggle('hidden', !on);
  $('loginCard').classList.add('hidden');
  $('adminBtn').textContent = on ? 'Sair' : 'Admin';
  render();
}

async function finishWrite(ok) {
  showMessage(ok ? '' : WRITE_FAILED);
  await refresh();
}

/** Trata dos botões de admin dentro da lista de jogadores. */
export async function handleListAction(button) {
  const { delpay, del, delp, act, v } = button.dataset;
  let ok = true;
  if (delpay) {
    if (!confirm('Remover este pagamento?')) return;
    ok = await removeRow('payments', delpay);
  } else if (del) {
    if (!confirm('Remover esta multa?')) return;
    ok = await removeRow('fines', del);
  } else if (delp) {
    if (!confirm('Apagar jogador, as suas multas e pagamentos?')) return;
    ok = await removeRow('players', delp);
  } else if (act) {
    ok = await updateRow('players', act, { active: v !== 'true' });
  }
  await finishWrite(ok);
}

/** Calcula o valor da multa a partir da regra escolhida. */
function updateFineFromRule() {
  const rule = state.rules.find(item => item.id === $('fRule').value);
  $('fMin').classList.toggle('hidden', !(rule && rule.per_minute));
  if (!rule) return;
  $('fReason').value = rule.reason;
  const units = rule.per_minute ? Number($('fMin').value || 0) : 1;
  $('fAmount').value = (rule.amount * units * ($('fGame').checked ? 2 : 1)).toFixed(2);
}

function bindLogin() {
  $('adminBtn').onclick = async () => {
    if (state.admin) {
      await sb.auth.signOut();
      setAdmin(false);
    } else {
      $('loginCard').classList.toggle('hidden');
    }
  };
  $('loginForm').onsubmit = async event => {
    event.preventDefault();
    const { error } = await sb.auth.signInWithPassword({ email: $('email').value, password: $('password').value });
    if (error) {
      $('loginMsg').textContent = 'Email ou password incorretos.';
      return;
    }
    $('password').value = '';
    $('loginMsg').textContent = '';
    setAdmin(true);
  };
}

function bindFineForm() {
  $('fRule').onchange = updateFineFromRule;
  $('fMin').oninput = updateFineFromRule;
  $('fGame').onchange = () => {
    if ($('fRule').value) {
      updateFineFromRule();
      return;
    }
    const value = Number($('fAmount').value);
    if (value) $('fAmount').value = (value * ($('fGame').checked ? 2 : 0.5)).toFixed(2);
  };
  $('fineForm').onsubmit = async event => {
    event.preventDefault();
    const { error } = await sb.from('fines').insert({
      player_id: $('fPlayer').value,
      reason: $('fReason').value.trim(),
      amount: $('fAmount').value,
      date: $('fDate').value,
      game_day: $('fGame').checked,
    });
    if (error) {
      showMessage('Erro ao adicionar multa.');
      return;
    }
    showMessage('');
    state.open.add($('fPlayer').value);
    $('fReason').value = '';
    $('fAmount').value = '';
    $('fRule').value = '';
    $('fGame').checked = false;
    $('fMin').value = '';
    $('fMin').classList.add('hidden');
    refresh();
  };
}

function bindPaymentForm() {
  $('payPlayer').onchange = payPreview;
  $('payAmount').oninput = payPreview;
  $('payForm').onsubmit = async event => {
    event.preventDefault();
    const { error } = await sb.from('payments').insert({
      player_id: $('payPlayer').value,
      amount: $('payAmount').value,
      date: $('payDate').value,
      note: $('payNote').value.trim() || null,
    });
    if (error) {
      showMessage('Erro ao registar pagamento.');
      return;
    }
    showMessage('');
    state.open.add($('payPlayer').value);
    $('payAmount').value = '';
    $('payNote').value = '';
    refresh();
  };
}

function bindManagement() {
  $('playerAddForm').onsubmit = async event => {
    event.preventDefault();
    const { error } = await sb.from('players').insert({
      name: $('pName').value.trim(),
      role: $('pRole').value,
      joined_on: today(),
    });
    if (error) {
      showMessage('Erro (o nome já existe?).');
      return;
    }
    showMessage('');
    $('pName').value = '';
    refresh();
  };
  $('ruleForm').onsubmit = async event => {
    event.preventDefault();
    const { error } = await sb.from('rules').upsert({
      reason: $('rReason').value.trim(),
      amount: $('rAmount').value,
      per_minute: $('rMin').checked,
    }, { onConflict: 'reason' });
    if (error) {
      showMessage('Erro ao guardar multa predefinida.');
      return;
    }
    showMessage('');
    $('rReason').value = '';
    $('rAmount').value = '';
    refresh();
  };
  $('rulesList').onclick = async event => {
    const button = event.target.closest('button');
    if (!button) return;
    await finishWrite(await removeRow('rules', button.dataset.delr));
  };
  $('quotaBtn').onclick = async () => {
    if (!confirm('Normalmente o sistema lança a quota sozinho à segunda-feira. Lançar agora a quota de 0,50 € desta semana? Quem já a tiver não é cobrado outra vez.')) return;
    const { data, error } = await sb.rpc('lancar_quotas');
    if (error) {
      showMessage('Erro a lançar quotas.');
      return;
    }
    showMessage('');
    alert(`${data} quota(s) lançada(s).`);
    refresh();
  };
}

function bindExpenses() {
  $('expenses').onclick = async event => {
    const button = event.target.closest('button[data-delexp]');
    if (!button) return;
    if (!confirm('Remover esta despesa?')) return;
    await finishWrite(await removeRow('expenses', button.dataset.delexp));
  };
  $('eCat').onchange = () => {
    const isOther = $('eCat').value === '__other';
    $('eCustom').classList.toggle('hidden', !isOther);
    $('eCustom').required = isOther;
    if (isOther) $('eCustom').focus();
  };
  $('eAmount').oninput = () => ePreview(cashTotals(buildModel(state), state.expenses).caixa);
  $('expForm').onsubmit = async event => {
    event.preventDefault();
    const category = $('eCat').value === '__other' ? $('eCustom').value.trim() : $('eCat').value;
    if (!category) {
      showMessage('Escreve o nome da categoria.');
      return;
    }
    const { error } = await sb.from('expenses').insert({
      category,
      description: $('eDesc').value.trim(),
      amount: $('eAmount').value,
      date: $('eDate').value,
    });
    if (error) {
      showMessage('Erro ao registar despesa.');
      return;
    }
    showMessage('');
    $('eDesc').value = '';
    $('eAmount').value = '';
    $('eCustom').value = '';
    refresh();
  };
}

/** Liga todos os eventos do painel de administrador. */
export function bindAdmin() {
  $('admTabs').onclick = event => {
    const button = event.target.closest('button');
    if (button) setTab(currentTab === button.dataset.t ? null : button.dataset.t);
  };
  bindLogin();
  bindFineForm();
  bindPaymentForm();
  bindManagement();
  bindExpenses();
  $('fDate').value = $('payDate').value = $('eDate').value = today();
}
