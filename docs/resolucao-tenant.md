# Resolucao de tenant no banco compartilhado

Versao: 3.0
Atualizado em: 31/08/2026

Hostname, slug ou dominio personalizado identificam a `Conta` para marca,
roteamento, concessoes e autorizacao. Eles **nao selecionam um banco**.

```text
hostname/slug
  -> diretorio valida a Conta e seu status
  -> contexto recebe contaId/tenantKey
  -> autenticacao confirma o usuario nessa Conta
  -> services aplicam unidades autorizadas
  -> Prisma usa a DATABASE_URL compartilhada
```

## Regras

- host desconhecido falha fechado, sem conta padrao;
- `tenantKey` e opaco e nao substitui `contaId` nas relacoes;
- o JWT, quando carregar `tenantKey`, coincide com a conta resolvida;
- depois do login, a conta vem dos vinculos confiaveis do usuario;
- cache de diretorio nunca armazena connection string;
- suspensao bloqueia uma conta sem afetar assinantes vizinhos;
- erros nao confirmam a existencia de outra conta, usuario ou unidade.

## Transicao

O middleware, registry, provider de connection strings, flags e preflight do
antigo modelo multi-banco foram removidos em 31/08/2026.

Nao configurar segredo de banco por tenant. A resolucao de dominio deve
retornar identidade e estado da `Conta`, usando sempre o cliente Prisma da
`DATABASE_URL` compartilhada.

Fonte normativa: [arquitetura-multitenant.md](arquitetura-multitenant.md).
