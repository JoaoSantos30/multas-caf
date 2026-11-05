// Acesso ao Supabase.

import { SUPABASE_KEY, SUPABASE_URL } from './config.js';

// Fica a null se a biblioteca não carregar (CDN em baixo ou SRI recusado).
export const sb = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

/** Lê todos os dados. Devolve null se falhar uma tabela essencial. */
export async function fetchAll() {
  const [players, fines, rules, payments, expenses] = await Promise.all([
    sb.from('players').select('*').order('name'),
    sb.from('fines').select('*').order('date', { ascending: false }),
    sb.from('rules').select('*').order('reason'),
    sb.from('payments').select('*').order('date', { ascending: false }),
    sb.from('expenses').select('*').order('date', { ascending: false }),
  ]);
  if (players.error || fines.error || rules.error || payments.error) return null;
  return {
    players: players.data,
    fines: fines.data,
    rules: rules.data,
    payments: payments.data,
    expenses: expenses.error ? [] : expenses.data,
    noExp: Boolean(expenses.error),
  };
}

// O RLS bloqueia sem devolver erro: a resposta vem apenas com zero linhas.
// Por isso, estas funções confirmam que alguma linha foi mesmo afetada.

/** Apaga uma linha. Devolve true apenas se a linha foi apagada. */
export async function removeRow(table, id) {
  const { data, error } = await sb.from(table).delete().eq('id', id).select('id');
  return !error && data.length > 0;
}

/** Altera uma linha. Devolve true apenas se a linha foi alterada. */
export async function updateRow(table, id, values) {
  const { data, error } = await sb.from(table).update(values).eq('id', id).select('id');
  return !error && data.length > 0;
}
