# Testes manuais

Segue esta lista depois de cada alteração. A base de dados é a real, por isso usa sempre um jogador de teste e apaga-o no fim.

## Vista pública

- [ ] A página carrega sem erros e mostra a caixa, o pódio e o plantel.
- [ ] A pesquisa, o filtro e a ordenação funcionam.
- [ ] Clicar num jogador abre e fecha as suas multas.
- [ ] A página fica bem no telemóvel.

## Preparação

- [ ] Entra como admin. Uma password errada deve mostrar "Email ou password incorretos."
- [ ] Em Gestão, adiciona o jogador `Teste Apagar`.

## Multas e pagamentos

- [ ] Adiciona uma multa de 10 € ao jogador de teste. Deve dever 10,00 €.
- [ ] Marca "Dia de jogo" numa multa predefinida. O valor deve dobrar.
- [ ] Remove a multa de dia de jogo.
- [ ] Regista um pagamento de 4 €. A multa deve ficar "Parcial (4,00 € pagos)" e a dívida em 6,00 €.
- [ ] Regista um pagamento de 8 €. A multa deve ficar "Paga" e o saldo em +2,00 €.
- [ ] Confirma que a pré-visualização do pagamento bate certo antes de gravar.

## Tabela de multas e despesas

- [ ] Cria a regra `Teste Regra` e confirma que aparece na tabela pública.
- [ ] Apaga a regra.
- [ ] Regista uma despesa de 1 € e confirma que a caixa desce 1,00 €.
- [ ] Apaga a despesa e confirma que a caixa volta ao valor anterior.

## Importar e exportar

- [ ] Importa a linha abaixo, separando os campos com tabulações: `Teste Apagar`, `Teste importação`, `1`, `05/11/2026`, `n`.
- [ ] Importa uma linha inválida. Deve aparecer "Linhas inválidas" e nada deve ser importado.
- [ ] Carrega em "Exportar CSV". Devem descarregar três ficheiros.

## Quotas

- [ ] Carrega em "Lançar quota manualmente". Se a quota da semana já tiver sido lançada a todos, deve dizer "0 quota(s) lançada(s)".
- [ ] Na primeira semana depois de cada alteração às quotas, confirma à segunda-feira que a "Quota semanal" apareceu sozinha.

Se a quota manual criar uma quota para o jogador de teste, ela desaparece ao apagá-lo.

## Limpeza

- [ ] Apaga o jogador `Teste Apagar` e confirma que as multas e os pagamentos dele desapareceram.
- [ ] Confirma que a caixa voltou ao valor inicial.
- [ ] Sai da conta de admin.
