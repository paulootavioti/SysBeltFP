import type { ArtigoAjuda } from "../types";

// Conteúdo estático por enquanto — sem CRUD/admin. Quando isso crescer
// (muitos artigos, precisar editar sem deploy), migrar pra um módulo com
// backend próprio seguindo o mesmo padrão de curriculos/modelosContrato.
export const ARTIGOS_AJUDA: ArtigoAjuda[] = [
  {
    id: "alunos-cadastrar",
    categoria: "Alunos",
    titulo: "Como cadastrar um novo aluno",
    resumo: "Passo a passo para cadastrar um aluno e vincular responsáveis.",
    conteudo: [
      "Acesse Alunos no menu lateral e clique em \"+ Novo Aluno\".",
      "Preencha os dados pessoais, de saúde e de contato do aluno.",
      "Se o aluno for menor de idade, cadastre pelo menos um responsável na aba Responsáveis.",
      "Vincule o aluno a uma turma para que ele apareça na chamada e na grade horária.",
    ],
  },
  {
    id: "alunos-filtros",
    categoria: "Alunos",
    titulo: "Filtrar alunos por status e turma",
    resumo: "Use os filtros ao lado da busca para encontrar alunos rapidamente.",
    conteudo: [
      "Na listagem de Alunos, use o campo de busca para filtrar por nome.",
      "Use o filtro Status para ver apenas alunos ativos ou inativos.",
      "Use o filtro Turma para ver apenas os alunos de uma turma específica.",
      "Os filtros podem ser combinados entre si.",
    ],
  },
  {
    id: "alunos-inativar",
    categoria: "Alunos",
    titulo: "Inativar um aluno",
    resumo: "O que acontece quando um aluno é inativado.",
    conteudo: [
      "Na listagem de Alunos, clique em \"Inativar\" na linha do aluno.",
      "Alunos inativos não aparecem mais na chamada nem na grade de turmas.",
      "O histórico do aluno (presenças, graduações, mensalidades) é mantido.",
      "É possível reativar o aluno a qualquer momento pelo mesmo botão.",
    ],
  },
  {
    id: "turmas-criar",
    categoria: "Turmas e Aulas",
    titulo: "Como criar uma turma",
    resumo: "Defina professor, horário, dias da semana e limite de alunos.",
    conteudo: [
      "Acesse Turmas no menu lateral e clique em \"+ Nova Turma\".",
      "Defina o nome, a faixa etária, o professor responsável e a arena.",
      "Escolha os dias da semana e o horário de início e fim.",
      "Se quiser limitar vagas, preencha o campo de limite de alunos.",
    ],
  },
  {
    id: "aulas-programar",
    categoria: "Turmas e Aulas",
    titulo: "Programar uma aula",
    resumo: "Programe uma aula única ou recorrente a partir da grade horária.",
    conteudo: [
      "Acesse Aulas > Programação e escolha a turma.",
      "Clique em \"+ Programar Aula\" para uma aula única, ou escolha o modo recorrente para replicar em vários dias.",
      "Associe um plano de aula do Planejamento Pedagógico, se quiser que a chamada já venha com o conteúdo sugerido.",
      "Aulas programadas aparecem na grade horária semanal e mensal.",
    ],
  },
  {
    id: "aulas-chamada",
    categoria: "Turmas e Aulas",
    titulo: "Fazer a chamada de uma aula",
    resumo: "Marque presença, comportamento e técnicas praticadas.",
    conteudo: [
      "Abra a aula programada e clique em \"Iniciar Aula\".",
      "Marque a presença de cada aluno na lista da chamada.",
      "Registre os indicadores de comportamento (respeito, valentia, esforço, atenção, disciplina) de cada aluno.",
      "Se a aula tiver um plano vinculado, marque os jogos e técnicas realmente praticados.",
      "Clique em \"Finalizar Aula\" ao final — depois de finalizada, a chamada não pode mais ser editada.",
    ],
  },
  {
    id: "planejamento-modulos",
    categoria: "Planejamento Pedagógico",
    titulo: "Organizar módulos e aulas planejadas",
    resumo: "Estrutura de currículo, módulos, aulas planejadas e técnicas.",
    conteudo: [
      "Cada Currículo é dividido em Módulos (geralmente associados a uma faixa).",
      "Cada Módulo contém Aulas Planejadas, com objetivo, jogos sugeridos e técnicas.",
      "Use os botões \"Expandir tudo\" / \"Recolher tudo\" para navegar mais rápido em currículos grandes.",
      "A busca filtra por nome de módulo, título de aula ou nome de técnica.",
    ],
  },
  {
    id: "planejamento-trilha-faixas",
    categoria: "Planejamento Pedagógico",
    titulo: "Trilha de faixas por módulo",
    resumo: "A faixa de círculos coloridos acima dos módulos indica a progressão.",
    conteudo: [
      "Cada círculo colorido representa a faixa associada a um módulo, na ordem da trilha infantil.",
      "Passe o mouse sobre um círculo para ver o nome do módulo e a faixa correspondente.",
      "Essa trilha ajuda a visualizar rapidamente em que ponto da progressão cada módulo se encaixa.",
    ],
  },
  {
    id: "financeiro-mensalidades",
    categoria: "Financeiro",
    titulo: "Gerenciar mensalidades",
    resumo: "Como cadastrar, marcar como paga, cancelar e estornar mensalidades.",
    conteudo: [
      "Acesse Mensalidades e clique em \"+ Nova Mensalidade\" para cadastrar manualmente.",
      "Use os filtros de status (Pendente, Vencida, Paga, Cancelada, Estornada) para localizar mensalidades.",
      "Os cards de resumo no topo (Pendente, Recebido, Total) refletem o filtro de status selecionado.",
      "Cancelamentos e estornos exigem um motivo, que fica registrado no histórico do aluno.",
    ],
  },
  {
    id: "financeiro-assinaturas",
    categoria: "Financeiro",
    titulo: "Cobrança recorrente com Assinaturas",
    resumo: "Configure uma assinatura para gerar mensalidades automaticamente.",
    conteudo: [
      "Acesse Assinaturas e cadastre o aluno, valor, forma de pagamento e dia de vencimento.",
      "O botão \"Gerar cobranças agora\" cria a mensalidade do mês corrente para todas as assinaturas ativas que ainda não têm cobrança gerada.",
      "Assinaturas podem ser pausadas, reativadas ou canceladas a qualquer momento.",
    ],
  },
  {
    id: "graduacoes-elegibilidade",
    categoria: "Graduações",
    titulo: "Como funciona a elegibilidade para graduação",
    resumo: "Regra de 8 aulas por grau e 4 graus por faixa.",
    conteudo: [
      "A cada 8 aulas com presença confirmada, o aluno completa 1 grau.",
      "Ao completar 4 graus (32 aulas), o aluno fica apto a trocar de faixa.",
      "Acesse Graduações > Próximas Promoções para ver quem já está apto e o progresso de quem ainda não está.",
    ],
  },
  {
    id: "graduacoes-registrar",
    categoria: "Graduações",
    titulo: "Registrar uma graduação",
    resumo: "Promova um aluno de faixa ou grau.",
    conteudo: [
      "Em Próximas Promoções, clique em \"Promover\" no card do aluno elegível.",
      "Escolha entre registrar um novo grau ou a troca de faixa.",
      "Opcionalmente, gere uma cobrança vinculada à graduação (comum em trocas de faixa).",
    ],
  },
];

export const CATEGORIAS_AJUDA = [
  "Alunos",
  "Turmas e Aulas",
  "Planejamento Pedagógico",
  "Financeiro",
  "Graduações",
] as const;
