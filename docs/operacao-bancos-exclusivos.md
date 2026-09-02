# Operacao de bancos exclusivos (descontinuada)

> Documento historico. Esta arquitetura foi substituida em 31/08/2026 e nao
> deve ser implementada nem ativada.

O Sys Belt usa banco operacional compartilhado entre assinantes, com
isolamento logico por `Conta` e `Unidade`. Nao se provisiona banco, projeto
Neon, segredo ou `PrismaClient` por tenant.

Consulte:

- [Arquitetura multitenant vigente](arquitetura-multitenant.md)
- [Percurso funcional](percurso-funcional.md)
- [Resolucao de tenant vigente](resolucao-tenant.md)
