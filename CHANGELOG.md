# Alterações

## 2026-11-05

### Alterado

- O `index.html` foi separado em CSS, módulos JavaScript e assets.
- O botão de quotas passou a ser "Lançar quota manualmente", porque as quotas passam a ser automáticas.

### Acrescentado

- Documentação do projeto e esquema da base de dados.
- Verificação de integridade (SRI) da biblioteca do Supabase.
- Indicação `noindex`, para o site não aparecer nas pesquisas.
- Etiquetas (`label`) em todos os campos, para leitores de ecrã.
- Mensagem de erro quando a biblioteca do Supabase não carrega.

### Corrigido

- Ações de apagar e de marcar jogador como saído que falhavam sem aviso.
- Datas erradas entre a meia-noite e a 1h no horário de verão.
- Mensagens que referiam o ficheiro `despesas.sql`, que não existe.
