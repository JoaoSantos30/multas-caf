// Cálculos do site. Este módulo não acede ao ecrã nem à rede.
// Todos os valores calculados estão em cêntimos.

import { sumCents, toCents } from './utils.js';

export const MEDALS = {
  1: ['🥇', '👑', 'Rei das Multas'],
  2: ['🥈', '🤡', 'Vice-Rei'],
  3: ['🥉', '💸', 'Mealheiro'],
};

/** Calcula a situação de cada jogador. */
export function buildModel({ players, fines, payments }) {
  return players.map(player => {
    const mine = fines.filter(fine => fine.player_id === player.id);
    const pays = payments.filter(payment => payment.player_id === player.id);
    const total = sumCents(mine);
    const paid = sumCents(pays);
    const balance = paid - total;

    // Os pagamentos abatem às multas mais antigas primeiro.
    const oldestFirst = [...mine].sort((a, b) =>
      (a.date + (a.created_at || '')).localeCompare(b.date + (b.created_at || '')));
    let remaining = paid;
    const st = {};
    oldestFirst.forEach(fine => {
      const amount = toCents(fine.amount);
      const used = Math.min(remaining, amount);
      remaining -= used;
      st[fine.id] = { used, state: used >= amount ? 'paid' : used > 0 ? 'part' : 'open' };
    });

    return {
      p: player,
      mine,
      pays,
      st,
      owed: Math.max(0, -balance),
      credit: Math.max(0, balance),
      paid,
      multas: sumCents(mine.filter(fine => fine.kind === 'multa')),
      quotas: sumCents(mine.filter(fine => fine.kind === 'quota')),
      total,
    };
  });
}

/** Devolve os jogadores ativos no pódio. Quem empata fica com o mesmo lugar. */
export function podiumOf(rows) {
  const ranked = rows
    .filter(row => row.p.active && row.total > 0)
    .sort((a, b) => b.total - a.total || a.p.name.localeCompare(b.p.name));
  const podium = [];
  ranked.forEach(row => {
    const rank = ranked.findIndex(other => other.total === row.total) + 1;
    if (rank <= 3) podium.push({ ...row, rank });
  });
  return podium;
}

/** Calcula os totais da caixa da equipa. */
export function cashTotals(rows, expenses) {
  const recebido = rows.reduce((sum, row) => sum + row.paid, 0);
  const gasto = sumCents(expenses);
  const caixa = recebido - gasto;
  const aReceber = rows.reduce((sum, row) => sum + row.owed, 0);
  return { recebido, gasto, caixa, aReceber, previsao: caixa + aReceber };
}
