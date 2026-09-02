# Sprint 04 - Fluxo operacional local

## Objetivo

Deixar o ambiente local pronto para simular o uso real na ordem de dependencia:
unidade, usuario professor, arena, turma e aluno.

## Problemas encontrados

- o seed criava o administrador sem unidade ativa e sem vinculo;
- a API exigia unidade ativa para descobrir a conta ao cadastrar a primeira
  filial, produzindo um bloqueio circular;
- o Dono sem unidade ativa nao conseguia listar ou criar filiais;
- uma filial criada por Admin nao era adicionada as unidades disponiveis dele;
- o seletor desaparecia para o Dono quando havia somente uma unidade;
- unidades inativas continuavam disponiveis no seletor;
- turmas aceitavam recursos inativos ou pertencentes a outra unidade;
- o intervalo de horario da turma aceitava termino anterior ao inicio.

## Correcoes

- `seed:admin` garante conta, unidade ativa, administrador e `UsuarioUnidade`;
- a conta do Dono pode ser resolvida a partir de seus vinculos;
- quem cria uma filial recebe acesso a ela automaticamente;
- o Dono pode selecionar sua unica unidade e voltar para todas;
- somente unidades ativas podem ser selecionadas pelo header `X-Unidade-Id`;
- a ultima unidade ativa da academia nao pode ser inativada;
- uma unidade com usuarios ativos fixados nela precisa ter esses usuarios
  transferidos antes da inativacao;
- arena exige unidade ativa e acessivel;
- professor, arena, curriculo e modalidade de uma turma precisam estar ativos
  e pertencer a unidade selecionada;
- o termino da turma deve ser posterior ao inicio.

## Dados locais preparados

Painel da equipe: `http://localhost:5173`

```text
Login: admin@sysbelt.com
Senha: admin123
Unidade ativa: Unidade Principal
Professor: SIMULACAO Professor
Arena: SIMULACAO Tatame Editado
Turma: SIMULACAO Kids Editada
Aluno: SIMULACAO Aluno
```

A filial `SIMULACAO Filial Editada` ficou inativa de proposito para validar o
filtro do seletor. Os demais registros de simulacao estao ativos.

## Roteiro de teste manual

1. Entre no painel e confirme **Unidade Principal** no topo.
2. Abra **Arenas** e confirme a arena de simulacao ativa.
3. Abra **Turmas**, consulte a turma de simulacao e seus dados.
4. Abra **Alunos**, consulte o aluno e confirme o vinculo com a turma.
5. Cadastre uma nova arena, uma nova turma e por fim um novo aluno.
6. Teste editar e inativar os registros criados.

## Verificacao automatizada

- API: 154 arquivos e 723 testes aprovados;
- painel da equipe: 14 arquivos e 92 testes aprovados;
- build de producao do painel aprovado;
- fluxo CRUD exercitado nas rotas de unidades, arenas, turmas e alunos;
- typecheck da API aprovado.
