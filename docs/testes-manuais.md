# Testes manuais

Segue esta lista depois de cada alteração. A base de dados é a real, por isso usa sempre o jogador de teste e apaga-o no fim.

## Vista pública

- [ ] A página carrega sem erros e mostra a caixa, o pódio e o plantel.
- [ ] A pesquisa, o filtro e a ordenação funcionam.
- [ ] Clicar num jogador abre e fecha as suas multas.
- [ ] A página fica bem no telemóvel.

## Preparação

- [ ] Aponta o valor "Disponível em caixa".
- [ ] Entra como admin. Uma password errada deve mostrar "Email ou password incorretos."
- [ ] Em Gestão, adiciona o jogador `Teste Apagar`.

## Multas e pagamentos

- [ ] Adiciona uma multa de 10 € ao jogador de teste. Deve dever 10,00 €.
- [ ] Escolhe uma multa predefinida, marca "Dia de jogo" e confirma que o valor dobra. Adiciona-a ao jogador de teste e remove-a a seguir com ✕.
- [ ] Em Pagamento, escolhe o jogador de teste e escreve 4 €. Antes de gravar, a pré-visualização deve dizer que ainda deve 6,00 €.
- [ ] Regista o pagamento. A multa deve ficar "Parcial (4,00 € pagos)".
- [ ] Regista um pagamento de 8 €. A multa deve ficar "Paga" e o saldo em +2,00 €.
- [ ] Remove o pagamento de 8 € com ✕. A multa deve voltar a "Parcial (4,00 € pagos)".

## Estado do jogador

- [ ] Carrega em "Marcar como saiu". O jogador deve ficar com a etiqueta "Saiu".
- [ ] Carrega em "Reativar". A etiqueta deve desaparecer.

## Tabela de multas e despesas

- [ ] Cria a regra `Teste Regra` e confirma que aparece na tabela pública.
- [ ] Apaga a regra.
- [ ] Regista uma despesa de 1 € e confirma que a caixa desce 1,00 €.
- [ ] Apaga a despesa e confirma que a caixa volta ao valor anterior.

## Importar e exportar

- [ ] Importa exatamente esta linha: `Teste Apagar;Teste importação;1;05/11/2026;n`.
- [ ] Importa exatamente esta linha: `Teste Apagar;sem valor`. Deve aparecer "Linhas inválidas" e nada deve ser importado.
- [ ] Carrega em "Exportar CSV". Devem descarregar três ficheiros.

## Sessão expirada

- [ ] Abre o site num segundo separador e carrega em "Sair" nesse separador.
- [ ] Sem atualizar o primeiro separador, tenta apagar uma multa do jogador de teste. Deve aparecer um aviso a dizer que não foi possível guardar, e a multa deve continuar lá.
- [ ] Atualiza a página e entra outra vez como admin. O aviso deve desaparecer.

## Quotas

**Atenção:** só faças o primeiro passo se a "Quota semanal" desta semana já aparecer nos jogadores. Caso contrário, lanças quotas reais a toda a equipa.

- [ ] Carrega em "Lançar quota manualmente". Deve dizer "0 quota(s) lançada(s)". À segunda-feira pode dizer 1, por causa do jogador de teste, que desaparece ao apagá-lo.
- [ ] Depois de ativar as quotas automáticas ou de as alterar, confirma na segunda-feira seguinte que a "Quota semanal" apareceu sozinha.

## Limpeza

- [ ] Pesquisa `Teste Apagar` e apaga esse jogador. As multas e os pagamentos dele devem desaparecer.
- [ ] Confirma que a caixa voltou ao valor apontado na preparação.
- [ ] Sai da conta de admin.
