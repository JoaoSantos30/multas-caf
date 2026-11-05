# Plano de implementação da reestruturação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar o `index.html` em ficheiros com responsabilidades claras, documentar o projeto, corrigir os problemas identificados e automatizar as quotas semanais.

**Architecture:** Site estático sem build, com módulos JavaScript nativos sobre o Supabase. Os cálculos ficam em `model.js`, sem acesso ao ecrã nem à rede. A interface fica separada do acesso a dados.

**Tech Stack:** HTML, CSS, JavaScript (ES modules), `@supabase/supabase-js` 2.45.4 via jsDelivr, Supabase (Postgres, RLS, `pg_cron`), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-05-reestruturacao-design.md`

## Global Constraints

- Sem build, sem `package.json` e sem dependências novas.
- Sem pasta `tests/`: a verificação é feita com scripts temporários no scratchpad e com a checklist manual. Esta decisão do João substitui o TDD.
- `index.html` fica na raiz e todos os caminhos são relativos, porque o site vive em `/multas-caf/`.
- O aspeto e o funcionamento não mudam, exceto nas correções da especificação.
- A lógica de cálculo não muda.
- Todo o texto visível fica em português de Portugal.
- Nunca escrever em dados reais durante a verificação.
- Commits apenas no ramo `reestruturacao`, terminados com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Nada é integrado no `main` nem enviado para o GitHub sem aprovação do João.

## Review Focus

1. Sessão expirada ao apagar: o Supabase devolve zero linhas sem erro quando o RLS bloqueia a ação, e o admin deve ver uma mensagem em vez de achar que funcionou (Tarefa 3).
2. Biblioteca bloqueada pelo SRI ou CDN em baixo: a página deve mostrar um erro, em vez de ficar presa em "A carregar..." (Tarefa 3).
3. Admin a usar o site entre a meia-noite e a 1h no horário de verão: as datas devem ser as do dia local (Tarefa 2).
4. Valores decimais, pagamentos parciais, saldos a favor e empates no pódio: os resultados devem ser iguais aos do código antigo (Tarefa 2).
5. Nomes com caracteres HTML: devem aparecer como texto, sem serem interpretados (Tarefa 3).

---

### Tarefa 1: Ramo, CSS, assets e HTML

**Files:**
- Create: `css/styles.css`, `assets/logo.png` (movido com `git mv`)
- Modify: `index.html`

**Interfaces:**
- Produces: `index.html` sem `<style>`, com classes para os estilos fixos e com a classe `.sr-only`.

- [ ] **Passo 1:** Criar o ramo `reestruturacao` a partir do `main` e fazer commit da especificação e deste plano.
- [ ] **Passo 2:** Mover o CSS das linhas 12-110 para `css/styles.css`, sem alterar a ordem das regras, e ligar com `<link rel="stylesheet" href="css/styles.css">`.
- [ ] **Passo 3:** Mover `logo.png` para `assets/` e atualizar as referências no ícone, no `apple-touch-icon` e no cabeçalho.
- [ ] **Passo 4:** Passar os atributos `style` fixos do HTML para classes em `styles.css`. Os dos templates JavaScript passam na Tarefa 3.
- [ ] **Passo 5:** Dar uma `label` a todos os campos sem etiqueta. Onde o `placeholder` já explica o campo, usar `.sr-only`, que esconde o texto visualmente sem o esconder aos leitores de ecrã.
- [ ] **Passo 6:** Acrescentar `<meta name="robots" content="noindex">`.
- [ ] **Passo 7:** Calcular o SRI e acrescentar `integrity` e `crossorigin="anonymous"` ao `<script>` da biblioteca.

```bash
curl -s https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js | openssl dgst -sha384 -binary | openssl base64 -A
```

- [ ] **Passo 8:** Servir o site com `python3 -m http.server 8000` e comparar com o site publicado a 375 px e a 1280 px. Esperado: aspeto igual, sem erros na consola e sem pedidos com resposta 404.
- [ ] **Passo 9:** Commit: `refactor: separar CSS e assets do index`.

### Tarefa 2: Utilitários e cálculos

**Files:**
- Create: `js/utils.js`, `js/model.js`

**Interfaces:**
- Produces em `utils.js`: `$(id)`, `esc(value)`, `eur(number)`, `eurC(cents)`, `dt(isoDate)`, `toCents(value)`, `sumCents(rows)`, `today()`. `today()` devolve `AAAA-MM-DD` na data local.
- Produces em `model.js`:
  - `buildModel({players, fines, payments})` devolve as linhas com `{p, mine, pays, st, owed, credit, paid, multas, quotas, total}`.
  - `podiumOf(rows)` devolve as linhas do pódio, com `rank`.
  - `cashTotals(rows, expenses)` devolve `{recebido, gasto, caixa, aReceber, previsao}`.
  - `MEDALS` mantém os valores atuais.

- [ ] **Passo 1:** Criar os dois módulos a partir das linhas 227-230 e 248-269 do `index.html`. `model.js` não pode usar `document` nem o estado global.
- [ ] **Passo 2:** Criar no scratchpad um script que extraia `model()` e `podiumOf()` de `git show main:index.html` e compare os resultados com os novos usando dados fictícios. Os dados devem incluir: pagamento parcial, pagamento acima da dívida, jogador sem multas, jogador inativo, empate no 3.º lugar, multas na mesma data com `created_at` diferente, valores como `0.1` e `0.2`, e uma quota.
- [ ] **Passo 3:** Correr a comparação. Esperado: resultados iguais em todos os casos.
- [ ] **Passo 4:** Confirmar `today()`, simulando 00:30 de 1 de julho em `Europe/Lisbon`. Esperado: `2026-07-01`, onde `toISOString()` dá `2026-06-30`.
- [ ] **Passo 5:** Commit: `refactor: extrair utilitários e cálculos`.

### Tarefa 3: Módulos da interface e correções

**Files:**
- Create: `js/state.js`, `js/api.js`, `js/render.js`, `js/admin.js`, `js/import-export.js`, `js/main.js`
- Move: `config.js` para `js/config.js`, com `export`
- Modify: `index.html`, `css/styles.css`

**Interfaces:**
- Consumes: funções da Tarefa 2.
- Produces em `state.js`: `state`, com os campos do atual `S`.
- Produces em `api.js`:
  - `sb`, o cliente do Supabase.
  - `fetchAll()` devolve as listas e o indicador de erro nas despesas.
  - `removeRow(table, id)` e `updateRow(table, id, values)` devolvem `true` apenas se afetarem pelo menos uma linha.
- Produces em `render.js`: `render()`, `refresh()`, `payPreview()`, `ePreview(caixa)`.
- Produces em `admin.js`: `setAdmin(on)`, `bindAdmin()`, `handleListAction(button)`, `showMessage(text)`.
- Produces em `import-export.js`: `bindImportExport()`.
- `main.js` é o único ponto de arranque e liga a pesquisa, os filtros e o clique na lista.

- [ ] **Passo 1:** Mover o código das linhas 226-503 para os módulos, sem mudar a lógica. Substituir o `<script>` em linha por `<script type="module" src="js/main.js"></script>`.
- [ ] **Passo 2:** Implementar `removeRow` e `updateRow` com `.select('id')`, porque um bloqueio do RLS devolve zero linhas sem erro. Usá-las em todas as ações de apagar, incluindo regras e despesas, e em marcar jogador como saído. Se devolverem `false`, chamar `showMessage` com um texto que sugira entrar de novo.
- [ ] **Passo 3:** Substituir todos os `toISOString().slice(0,10)` por `today()`.
- [ ] **Passo 4:** Retirar as referências ao `despesas.sql`. Uma falha a ler despesas mostra ao admin o aviso "Não foi possível carregar as despesas."
- [ ] **Passo 5:** Mudar o botão para "Lançar quota manualmente". A confirmação deve dizer: "Normalmente o sistema lança a quota sozinho à segunda-feira. Lançar agora a quota de 0,50 € desta semana? Quem já a tiver não é cobrado outra vez."
- [ ] **Passo 6:** Se `window.supabase` não existir no arranque, mostrar em `#list` a mensagem "Não foi possível carregar o site. Tenta atualizar a página."
- [ ] **Passo 7:** Passar para classes os `style` fixos dos templates. Ficam em linha apenas a largura das barras.
- [ ] **Passo 8:** Confirmar com `grep` que `index.html` já não tem `<style>`, JavaScript em linha nem `toISOString`.
- [ ] **Passo 9:** Abrir localmente, só com leituras. Esperado: dados iguais aos do site publicado, sem erros na consola, e pesquisa, filtros, ordenação e abertura das fichas a funcionar.
- [ ] **Passo 10:** Bloquear o URL do jsDelivr no browser e recarregar. Esperado: a mensagem do Passo 6.
- [ ] **Passo 11:** Com dados fictícios injetados no estado do browser, sem os gravar, confirmar que um nome `<b>Teste</b>` aparece como texto.
- [ ] **Passo 12:** Commit: `refactor: separar a interface em módulos e corrigir erros`.

### Tarefa 4: Base de dados e quotas automáticas

**Files:**
- Create: `supabase/schema.sql`

**Interfaces:**
- Consumes: exportação do Supabase colada pelo João nesta conversa.

- [ ] **Passo 1:** Escrever `supabase/schema.sql` com as tabelas, restrições, índices, RLS, políticas, a função, as permissões e a tarefa `pg_cron`. Começar com um aviso de que é uma referência e não deve ser corrido em produção.
- [ ] **Passo 2:** Pedir ao João para ativar a extensão `pg_cron` no Supabase e correr `select jobname, schedule, command, active from cron.job;`.
- [ ] **Passo 3:** Se não existir uma tarefa de quotas, pedir ao João para correr:

```sql
select cron.schedule(
  'lancar-quotas-semanal',
  '5 0 * * 1',
  $$select public.lancar_quotas();$$
);
```

- [ ] **Passo 4:** Confirmar com a consulta do Passo 2. Esperado: `lancar-quotas-semanal`, `5 0 * * 1`, `active = true`.
- [ ] **Passo 5:** Commit: `docs: acrescentar o esquema da base de dados`.

### Tarefa 5: Documentação

**Files:**
- Create: `docs/arquitetura.md`, `docs/base-de-dados.md`, `docs/publicacao.md`, `docs/testes-manuais.md`, `CHANGELOG.md`, `.gitignore`
- Modify: `README.md`

- [ ] **Passo 1:** Escrever os documentos com o conteúdo definido na secção "Documentação" da especificação. O `README.md` deve incluir `python3 -m http.server 8000`.
- [ ] **Passo 2:** Em `docs/testes-manuais.md`, cobrir: login, multa, pagamento parcial, pagamento acima da dívida, despesa, regra, importação, exportação, quota manual repetida, confirmação da quota automática à segunda-feira, e criar e apagar um jogador de teste.
- [ ] **Passo 3:** Criar o `.gitignore` com `.DS_Store`, `*.csv` e `.env*`.
- [ ] **Passo 4:** Confirmar que todos os caminhos citados nos documentos existem.
- [ ] **Passo 5:** Commit: `docs: documentar o projeto`.

### Tarefa 6: Verificação final e publicação

- [ ] **Passo 1:** Fazer a revisão de todo o ramo e corrigir o que for encontrado.
- [ ] **Passo 2:** Pedir ao João para seguir `docs/testes-manuais.md` na versão local, com a sua conta de admin.
- [ ] **Passo 3:** Com a aprovação do João, integrar no `main` e enviar para o GitHub.
- [ ] **Passo 4:** Abrir `https://joaosantos30.github.io/multas-caf/`. Esperado: dados carregados, sem erros na consola e sem pedidos com resposta 404.
- [ ] **Passo 5:** Na segunda-feira seguinte, confirmar que a quota apareceu sozinha.
