// Funções de apoio partilhadas por todos os módulos.

export const $ = id => document.getElementById(id);

const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Torna um valor seguro para inserir em HTML. */
export const esc = value => String(value).replace(/[&<>"']/g, ch => HTML_ENTITIES[ch]);

/** Formata um valor em euros. */
export const eur = number =>
  Number(number).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });

/** Formata um valor em cêntimos como euros. */
export const eurC = cents => eur(cents / 100);

/** Formata uma data AAAA-MM-DD para o formato português. */
export const dt = isoDate => new Date(isoDate + 'T00:00:00').toLocaleDateString('pt-PT');

/** Converte euros em cêntimos, para evitar erros de arredondamento. */
export const toCents = value => Math.round(Number(value) * 100);

/** Soma o campo `amount` de uma lista, em cêntimos. */
export const sumCents = rows => rows.reduce((sum, row) => sum + toCents(row.amount), 0);

/** Devolve a data de hoje em AAAA-MM-DD, no fuso horário de quem usa o site. */
export function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
