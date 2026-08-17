# Sys Belt — Visão de Produto

## Visão

O Sys Belt é uma plataforma SaaS de gestão para academias de artes marciais.

Nasceu para atender a Cia de Lutas Weberty Viana e evoluiu para um produto
vendido por assinatura a qualquer academia — mantendo o que o originou: unir a
gestão administrativa ao planejamento pedagógico, em vez de tratar a academia
como um negócio genérico com um catálogo de aulas.

---

# Proposta de valor

A maioria dos sistemas de academia resolve mensalidade e catraca. O Sys Belt
resolve isso e mais o que só existe em artes marciais: currículo técnico,
evolução por presença, graduação com grau e faixa, avaliação comportamental,
competições.

É o mesmo motivo pelo qual o produto atende bem o pequeno e o grande: a
cobrança por faixa de 10 alunos faz uma academia de 15 alunos pagar R$ 74,00 e
uma de 200 pagar proporcionalmente, sem degrau que force o pequeno a subir de
plano.

---

# Público

## Cliente pagante

- Proprietário da academia (perfil `DONO`)

## Usuários dentro da academia

- Coordenadores e administradores (`ADMIN`)
- Professores (`PROFESSOR`)
- Secretaria e recepção (`RECEPCAO`)

## Usuários finais

- Responsáveis pelos alunos (Portal da Família)
- Alunos (Portal da Família)

## Operação do SaaS

- Operador da plataforma — autenticado no Control Plane, **não** é um perfil
  do sistema da academia.

---

# Modelo comercial

Assinatura mensal por faixa de alunos:

- cada faixa cobre até 10 alunos e custa R$ 37,00;
- as faixas são contadas **por unidade**, com mínimo de uma por unidade ativa;
- aluno que treina em mais de uma unidade da mesma academia conta uma vez em
  cada unidade.

Cada academia assinante opera sobre um banco de dados exclusivo.

---

# Objetivos

- Eliminar controles em papel e planilhas paralelas.
- Centralizar informação acadêmica, administrativa e financeira.
- Automatizar cobrança, comunicação e registro pedagógico.
- Gerar indicadores para decisão.
- Permitir que uma rede opere várias filiais compartilhando dados entre si,
  sem jamais compartilhar com outra academia.

---

# Fluxo principal

```
Aluno → Responsáveis → Turma → Presença → Graduação
                                    ↓
                    Financeiro → Relatórios → Dashboard
```

---

# Não-objetivos

O que o produto deliberadamente **não** faz:

- **Não** é um sistema de academia de musculação. O modelo de dados assume
  currículo técnico, faixa e grau.
- **Não** compartilha dados entre academias assinantes, nem para
  benchmarking anônimo. O isolamento é físico e essa é a promessa central.
- **Não** armazena template biométrico. O reconhecimento facial guarda apenas
  o identificador do provedor externo.
