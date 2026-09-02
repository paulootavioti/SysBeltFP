# Sprint 03 - Portal da Familia e autoatendimento

## Objetivo

Reduzir a dependencia da recepcao para consultar documentos e manter a conta,
sem ampliar o acesso da familia para alunos fora do seu vinculo.

## Entregas

- nova aba **Documentos** com contratos emitidos para o aluno selecionado;
- situacao do contrato visivel em linguagem direta;
- visualizacao do conteudo integral do contrato no portal;
- acesso ao fluxo externo de assinatura quando houver solicitacao pendente;
- acesso ao arquivo assinado quando disponibilizado pelo provedor;
- rascunhos internos da academia nao sao expostos para a familia;
- nova aba **Conta** com troca autenticada de senha;
- validacao da senha atual e exigencia de oito caracteres na nova senha;
- navegacao inferior rolavel no celular, sem comprimir ou cortar os rotulos;
- layouts de documentos, acoes e formulario adaptados para telas pequenas.

## API

- `GET /portal-familia/contratos/:alunoId`: lista os contratos publicaveis do
  aluno, depois de validar o vinculo presente no token da familia;
- `PATCH /portal-familia/conta/senha`: valida a senha atual e atualiza a
  credencial correspondente ao e-mail autenticado.

O middleware do portal passa a manter o e-mail validado no contexto da
requisicao. A troca de senha nao aceita um e-mail enviado pelo cliente, evitando
que a operacao seja direcionada para outra conta.

## Criterios de aceite

- a familia visualiza somente contratos do aluno selecionado e vinculado;
- contratos em rascunho permanecem restritos ao backoffice;
- links de assinatura e documento assinado abrem em nova aba;
- senha atual incorreta nao altera a credencial existente;
- depois da troca, a senha antiga deixa de autenticar e a nova passa a valer;
- as oito opcoes do portal continuam legiveis e acessiveis em tela de celular.

## Verificacao

- backend: 153 arquivos e 718 testes aprovados;
- Portal da Familia: 5 arquivos e 42 testes aprovados;
- build de producao do Portal da Familia aprovado;
- typecheck da API aprovado;
- `git diff --check` sem inconsistencias.
