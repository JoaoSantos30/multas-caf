# Reestruturação do site Caixinha de Multas

Data: 2026-11-05

## Objetivo

Separar o `index.html` em ficheiros com uma responsabilidade clara, documentar o projeto e corrigir os problemas identificados. O site deve continuar com o mesmo aspeto e funcionamento para quem o usa, exceto nas correções listadas abaixo.

## Decisões

| Tema | Decisão |
|---|---|
| Build | Sem build: HTML, CSS e módulos JavaScript nativos |
| Alojamento | GitHub Pages, em `https://joaosantos30.github.io/multas-caf/` |
| Visibilidade | Quem tiver o link vê toda a informação; o site fica com `noindex` |
| Testes | Sem pasta de testes; checklist manual em `docs/testes-manuais.md` |
| Base de dados | Continua no Supabase; o esquema passa a estar documentado no repositório |

## Estrutura

```text
multas-caf/
├── index.html              # apenas a estrutura HTML
├── assets/logo.png
├── css/styles.css
├── js/
│   ├── main.js             # arranque e ligação de eventos gerais
│   ├── config.js           # URL e chave publicável do Supabase
│   ├── state.js            # estado partilhado da página
│   ├── api.js              # leituras e escritas no Supabase
│   ├── model.js            # cálculos; sem acesso ao ecrã nem à rede
│   ├── render.js           # desenho do ecrã e pré-visualizações
│   ├── admin.js            # login, separadores e formulários
│   ├── import-export.js    # importação do Excel e exportação CSV
│   └── utils.js            # formatação, datas e `escape` de HTML
├── supabase/schema.sql     # esquema de referência
├── docs/
│   ├── arquitetura.md
│   ├── base-de-dados.md
│   ├── publicacao.md
│   └── testes-manuais.md
├── README.md
├── CHANGELOG.md
└── .gitignore
```

## Regras da separação

- `index.html` fica na raiz, para o endereço do site não mudar. Todos os caminhos são relativos, porque o site vive em `/multas-caf/`.
- A biblioteca do Supabase continua a ser carregada do jsDelivr, na versão 2.45.4, antes dos módulos.
- `model.js` recebe os dados como parâmetros, em vez de ler o estado global.
- Os 14 atributos `style` fixos passam para classes em `styles.css`. Ficam em linha apenas os valores calculados, como a largura das barras.
- O código passa a ter nomes legíveis, mas a lógica de cálculo não muda.

Consequência: os módulos não funcionam ao abrir o `index.html` com duplo clique. Para ver o site no computador é preciso um servidor local, explicado no `README.md`.

## Correções

1. **Erros visíveis:** as ações de apagar multas, pagamentos, despesas, jogadores e regras, e a de marcar jogador como saído, passam a verificar o resultado e a mostrar uma mensagem se falharem.
2. **Data local:** uma função `today()` em `utils.js` substitui `toISOString()` nos valores por omissão das datas, em `joined_on` e na importação.
3. **Acessibilidade:** todos os campos passam a ter `label`. Ficam visualmente escondidas onde o `placeholder` já explica o campo, para o aspeto não mudar.
4. **SRI:** o `<script>` da biblioteca passa a ter `integrity` e `crossorigin="anonymous"`.
5. **Pesquisa:** é acrescentado `<meta name="robots" content="noindex">`.
6. **Mensagens antigas:** saem as referências ao `despesas.sql`, porque a tabela `expenses` já existe. Uma falha a ler despesas passa a mostrar um aviso genérico ao admin.

## Base de dados

Estado confirmado a 2026-11-05:

- RLS ativo nas cinco tabelas: `players`, `fines`, `payments`, `rules` e `expenses`.
- Leitura pública e escrita apenas para utilizadores autenticados.
- Registo de novas contas desativado, por isso só as contas criadas no Supabase conseguem escrever.
- Apagar um jogador apaga as suas multas e pagamentos (`ON DELETE CASCADE`).
- A coluna `fines.paid` não é usada pelo site; o estado de pagamento é calculado a partir de `payments`. Fica documentada e não é removida.

- `lancar_quotas` é `SECURITY DEFINER`, mas só o papel `authenticated` a pode executar; `anon` não pode.
- O índice único `one_quota_per_week` impede mais do que uma quota por jogador e por semana.

## Quotas automáticas

A quota semanal passa a ser lançada pelo próprio sistema, sem depender de ninguém.

- **Agendamento:** uma tarefa `pg_cron` no Supabase, chamada `lancar-quotas-semanal`, corre `select public.lancar_quotas();` à segunda-feira às 00:05 UTC. A função usa por omissão a segunda-feira da semana atual.
- **Repetições:** correr a função mais do que uma vez na mesma semana não cria quotas repetidas, graças ao `one_quota_per_week`.
- **Lançamento manual:** continua disponível só para o admin, como recurso. O botão passa a dizer "Lançar quota manualmente" e o aviso de confirmação explica que normalmente o sistema já o faz sozinho.
- **Instalação:** antes de criar a tarefa, confirma-se se já existe alguma em `cron.job`. O SQL é corrido pelo João no Supabase e fica guardado em `supabase/schema.sql`.
- **Limitação:** se o projeto Supabase estiver em pausa ou a tarefa falhar, a quota dessa semana não é lançada. O botão manual só cobre a semana atual, por isso `docs/testes-manuais.md` inclui confirmar que a quota apareceu.

`supabase/schema.sql` é uma referência para documentação e para recriar o projeto. Não deve ser corrido sobre a base de dados em produção.

## Documentação

- `README.md`: o que é o site, como o ver localmente, como configurar e onde está o resto da documentação.
- `docs/arquitetura.md`: responsabilidade de cada ficheiro e fluxo dos dados.
- `docs/base-de-dados.md`: tabelas, regras de acesso, função de quotas e regra de abate dos pagamentos.
- `docs/publicacao.md`: como o GitHub Pages publica e como atualizar a versão da biblioteca e o respetivo SRI.
- `docs/testes-manuais.md`: lista a seguir depois de cada alteração, incluindo como criar e apagar um jogador de teste.
- `CHANGELOG.md`: registo das alterações.

## Verificação

- Comparar os resultados do `model()` antigo e do novo com os mesmos dados, incluindo pagamentos parciais, saldos a favor e empates no pódio. Esta comparação não fica no repositório.
- Abrir o site num servidor local e confirmar a vista pública: sem erros na consola, com o SRI aceite e com o aspeto igual em telemóvel e computador.
- As funções de admin são confirmadas pelo João com a checklist manual, porque precisam da sua password e escrevem em dados reais.

## Publicação

O trabalho é feito num ramo separado, porque o `main` é o site em produção. Só é integrado no `main` com a aprovação do João, e a seguir confirma-se o site publicado.

## Fora de âmbito

- Mudanças de aspeto ou funcionalidades novas.
- Testes automáticos, frameworks e ferramentas de build.
- Remover a coluna `fines.paid`.
