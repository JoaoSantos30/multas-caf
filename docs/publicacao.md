# Publicação

O site é publicado pelo GitHub Pages a partir do ramo `main`. Tudo o que entra no `main` fica público passados alguns minutos.

## Publicar uma alteração

1. Faz a alteração num ramo separado.
2. Vê o resultado localmente, como explicado no [README](../README.md).
3. Segue a lista de [testes manuais](testes-manuais.md).
4. Integra o ramo no `main`.
5. Abre o [site publicado](https://joaosantos30.github.io/multas-caf/) e atualiza a página para confirmar.

O browser pode guardar ficheiros antigos durante alguns minutos. Se a alteração não aparecer, força a atualização da página.

## Atualizar a biblioteca do Supabase

A biblioteca está fixa na versão 2.45.4 e tem verificação de integridade (SRI). Se o `integrity` não corresponder ao ficheiro, o browser recusa-o e o site mostra uma mensagem de erro.

Para mudar de versão:

1. Altera a versão no URL do `<script>`, em `index.html`.
2. Calcula o novo valor, substituindo `VERSAO`:

```bash
curl -s https://cdn.jsdelivr.net/npm/@supabase/supabase-js@VERSAO/dist/umd/supabase.min.js | openssl dgst -sha384 -binary | openssl base64 -A
```

3. Atualiza o atributo `integrity` para `sha384-` seguido desse valor.
4. Segue a lista de testes manuais.

## Ativar as quotas automáticas

Isto só é preciso fazer uma vez, no Supabase:

1. Em **Database > Extensions**, procura `pg_cron` e ativa.
2. No **SQL Editor**, confirma se já existe alguma tarefa:

```sql
select jobname, schedule, command, active from cron.job;
```

3. Se não houver nenhuma tarefa de quotas, cria-a:

```sql
select cron.schedule(
  'lancar-quotas-semanal',
  '5 0 * * 1',
  $$select public.lancar_quotas();$$
);
```

4. Corre outra vez a consulta do passo 2. Deve aparecer `lancar-quotas-semanal`, com `active` a `true`.
