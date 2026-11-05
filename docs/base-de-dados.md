# Base de dados

A base de dados está no Supabase. O esquema de referência está em [`supabase/schema.sql`](../supabase/schema.sql), que não deve ser corrido em produção.

## Tabelas

| Tabela | Conteúdo |
|---|---|
| `players` | Jogadores e treinadores |
| `fines` | Multas e quotas, distinguidas pela coluna `kind` |
| `payments` | Dinheiro entregue por cada jogador |
| `rules` | Tabela de multas predefinidas |
| `expenses` | Despesas da caixinha |

Apagar um jogador apaga também as suas multas e pagamentos.

## Como é calculado o saldo

Os pagamentos não ficam ligados a uma multa específica. O site soma os pagamentos de cada jogador e abate-os às multas mais antigas primeiro. Se sobrar dinheiro, fica como saldo a favor.

A coluna `fines.paid` é antiga e o site não a usa.

## Quem pode fazer o quê

As regras RLS estão ativas nas cinco tabelas:

- **Visitantes:** podem ler tudo.
- **Utilizadores com login:** podem ler e escrever tudo.

Por isso, o registo de novas contas tem de ficar **desativado** em Authentication, no Supabase. Se for ativado, qualquer pessoa pode criar uma conta e alterar os dados.

## Quotas semanais

A função `lancar_quotas` cria uma quota de 0,50 € para cada jogador ativo que já tenha entrado na equipa nessa semana.

- **Automático:** a tarefa `lancar-quotas-semanal`, do `pg_cron`, corre à segunda-feira às 00:05 UTC.
- **Manual:** o botão "Lançar quota manualmente" fica disponível para o admin, em Gestão, e serve apenas de recurso. Só lança a semana atual.
- **Sem repetições:** o índice `one_quota_per_week` impede duas quotas para o mesmo jogador na mesma semana.
- **Permissões:** a função ignora o RLS, por isso só utilizadores com login a podem executar.

Se o projeto Supabase estiver em pausa ou a tarefa falhar, a quota dessa semana não é lançada. Para ver as últimas execuções, corre no SQL Editor:

```sql
select start_time, status, return_message
from cron.job_run_details
order by start_time desc
limit 5;
```
