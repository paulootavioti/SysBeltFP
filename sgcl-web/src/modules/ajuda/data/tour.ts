export interface PassoTour {
  titulo: string;
  texto: string;
}

// Passos fixos do tour guiado — sem depender de estado do backend.
export const PASSOS_TOUR: PassoTour[] = [
  {
    titulo: "Bem-vindo ao Sys Belt",
    texto:
      "O Sys Belt centraliza a gestão da sua academia: alunos, turmas, aulas, planejamento pedagógico, graduações e financeiro, tudo em um só lugar.",
  },
  {
    titulo: "Alunos e Turmas",
    texto:
      "Cadastre alunos, vincule responsáveis e organize turmas por faixa etária, professor e horário. A chamada de cada aula fica registrada por turma.",
  },
  {
    titulo: "Planejamento Pedagógico",
    texto:
      "Estruture o currículo em módulos e aulas planejadas, com técnicas e jogos sugeridos. Esse conteúdo pode ser reaproveitado direto na chamada.",
  },
  {
    titulo: "Financeiro",
    texto:
      "Acompanhe mensalidades, assinaturas recorrentes, planos e formas de pagamento. Os indicadores do painel financeiro ajudam a enxergar a saúde da academia.",
  },
  {
    titulo: "Precisa de ajuda?",
    texto:
      "A Central de Ajuda reúne artigos por categoria e um canal para falar com o suporte. Você pode reabrir este tour a qualquer momento por aqui.",
  },
];
