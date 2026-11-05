# Caixinha de Multas

Site da caixinha de multas dos Séniores do Clube Académico do Fundão, época 2026/27.

Quem tiver o link vê a caixa da equipa, o pódio, o plantel, as despesas e a tabela de multas. O administrador entra com a sua conta para registar multas, pagamentos e despesas.

**Site:** <https://joaosantos30.github.io/multas-caf/>

## Tecnologias

- HTML, CSS e módulos JavaScript, sem build e sem dependências para instalar.
- [Supabase](https://supabase.com) para a base de dados e o login.
- GitHub Pages para o alojamento.

## Ver o site no computador

Os módulos JavaScript não funcionam ao abrir o `index.html` com duplo clique. Na pasta do projeto, corre:

```bash
python3 -m http.server 8000
```

Depois abre <http://localhost:8000>.

**Atenção:** a versão local usa a base de dados real. Tudo o que for alterado no modo de administrador fica guardado.

## Configuração

Os dados de ligação ao Supabase estão em `js/config.js`. A chave publicável pode ficar no repositório, porque os dados são protegidos pelas regras RLS. Nunca coloques lá a chave `service_role`.

## Documentação

- [Arquitetura](docs/arquitetura.md)
- [Base de dados](docs/base-de-dados.md)
- [Publicação](docs/publicacao.md)
- [Testes manuais](docs/testes-manuais.md)
- [Alterações](CHANGELOG.md)
