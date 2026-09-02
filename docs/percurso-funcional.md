# Percurso funcional do Sys Belt

Atualizado em: 31/08/2026

Este documento descreve o sistema encontrado no codigo. Rota implementada nao
significa que a integracao externa correspondente esteja configurada.

## Interfaces

| Interface | Publico | Percurso principal |
|---|---|---|
| `sgcl-web` | equipe da academia | login, unidade ativa, dashboard e gestao |
| `sgcl-portal-familia` | aluno/responsavel | resumo, financeiro, mensagens, loja e pedidos |
| `sgcl-portal-professor` | professor | aulas, chamada, planejamento, prontuarios e graduacoes |
| `landing-academia` | publico | modalidades, horarios, equipe, galeria, produtos e captacao |
| `control-plane/web` | operador Sys Belt | assinantes, planos, cobranca e concessoes |

## Percurso da equipe

1. Login, 2FA e recuperacao de senha.
2. Selecao da unidade ativa dentro da propria conta.
3. Dashboard limitado ao alcance do usuario.
4. Estrutura: unidades, arenas, modalidades, usuarios e turmas.
5. Pessoas: alunos, responsaveis, saude, documentos e prontuario.
6. Pedagogico: curriculos, tecnicas, aulas, chamada, comportamento, metas e
   graduacoes.
7. Operacao: eventos, competicoes, fotos, avisos e mensagens.
8. Financeiro: planos, mensalidades, formas de pagamento, caixa, cobranca,
   contratos, assinatura eletronica e pagamentos.
9. Comercial: leads, funil, atendimento omnichannel e bots.
10. Gestao: relatorios, assinatura Sys Belt, seguranca, suporte e uploads.

## Modulos da API operacional

| Dominio | Modulos e capacidades existentes |
|---|---|
| Estrutura | `unidades`, `arenas`, `modalidades`, `turmas` |
| Identidade | `auth`, `usuarios`, senha, 2FA e unidade ativa |
| Pessoas | `alunos`, `responsaveis`, vinculos e prontuario |
| Pedagogico | `aulas`, `curriculos`, `tecnicas`, `comportamentos`, `metas`, `graduacoes` |
| Esportivo | `competicoes`, `eventos`, `fotosTreino` |
| Financeiro | `planos`, `mensalidades`, `financeiro`, `formasPagamento`, `pagamentos` |
| Contratos | `modelosContrato`, `contratos`, `assinaturaEletronica`, `assinaturas` |
| Loja | catalogo, variantes, pedidos e estoque em `loja` |
| Comunicacao | `avisos`, `mensagens`, `mensagensFamilia`, `notificacoes`, `whatsapp` |
| CRM | `leads`, captacao publica, pipeline e eventos de lead |
| Mensageria | canais Meta, conversas, templates, caixa de entrada e bots |
| Acesso fisico | `controleAcesso`, credenciais, eventos e consentimentos |
| Portais | `portalFamilia`, `portalProfessor`, `publico` |
| Analise | `dashboard`, `relatorios` |
| Plataforma | `plataforma`, `concessaoPlataforma`, integracao Control Plane |
| Apoio | `uploads`, `suporte` |

## Integracoes e prontidao

| Fluxo | Estado encontrado |
|---|---|
| Meta WhatsApp/Instagram | OAuth, webhook, templates e jobs implementados; contas reais pendentes |
| Pagamentos | gateway e credenciais existentes; requer provedor e segredos reais |
| Assinatura eletronica | fluxo presente; integracao depende do provedor |
| Controle de acesso | credenciais/eventos presentes; hardware requer ambiente real |
| E-mail | fluxo presente; entrega depende de SMTP/provedor |
| Uploads | rotas presentes; persistencia depende do ambiente |

## Regras transversais observadas

- `Conta` separa assinantes; `Unidade` separa filiais.
- permissao combina perfil e unidades calculadas no backend.
- `SUPERADMIN` e legado e deve ser recusado no Tenant Plane.
- dados de aluno para professor sao reduzidos ao necessario.
- consentimento condiciona usos sensiveis.
- endpoints internos e webhooks exigem segredo, assinatura e idempotencia.

## Lacunas antes da simulacao completa de producao

1. Remover a infraestrutura multi-banco descontinuada.
2. Testar isolamento negativo com duas contas nos dominios criticos.
3. Auditar jobs globais de cobranca, lembretes e mensageria por conta.
4. Configurar sandboxes dos provedores externos.
5. Executar o percurso ponta a ponta por perfil em desktop e mobile.
6. Validar backup integral e recuperacao seletiva de uma conta.
