# Arquitetura

O site é estático: o browser carrega os ficheiros do GitHub Pages e fala diretamente com o Supabase. Não há servidor próprio nem passo de build.

## Ficheiros

| Ficheiro | Responsabilidade |
|---|---|
| `index.html` | Estrutura da página |
| `css/styles.css` | Todo o aspeto visual |
| `js/main.js` | Arranque e controlos públicos |
| `js/config.js` | Dados de ligação ao Supabase |
| `js/state.js` | Estado partilhado da página |
| `js/api.js` | Leituras e escritas no Supabase |
| `js/model.js` | Cálculos, sem acesso ao ecrã nem à rede |
| `js/render.js` | Desenho do ecrã e pré-visualizações |
| `js/admin.js` | Login, separadores e formulários |
| `js/import-export.js` | Importação do Excel e exportação CSV |
| `js/utils.js` | Formatação, datas e proteção de HTML |

## Fluxo dos dados

1. `main.js` liga os eventos e chama `refresh()`.
2. `refresh()` lê tudo com `fetchAll()` e guarda em `state`.
3. `render()` calcula a situação de cada jogador com `model.js` e desenha a página.
4. Depois de uma escrita, o código chama `refresh()` para mostrar os dados atualizados.

## Regras a manter

- Os valores calculados são guardados em cêntimos, para evitar erros de arredondamento.
- Todo o texto vindo da base de dados passa por `esc()` antes de entrar em HTML.
- Apagar e alterar usam `removeRow()` e `updateRow()`. Quando o RLS bloqueia estas ações, o Supabase devolve zero linhas sem erro, e estas funções detetam esse caso.
- As datas de hoje usam `today()`, porque `toISOString()` devolve a data em UTC.
- Os caminhos são relativos, porque o site vive em `/multas-caf/`.
