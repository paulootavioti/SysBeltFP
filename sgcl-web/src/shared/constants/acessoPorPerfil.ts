export type { Perfil } from "./perfis";

import type { Perfil } from "./perfis";

interface RegraAcesso {
  prefixo: string;
  perfis: Perfil[];
}

// Espelha as permissões (ensureRole) já aplicadas no backend, módulo a
// módulo, pra que o menu e as rotas nunca ofereçam algo que a API recusaria.
const REGRAS_ACESSO: RegraAcesso[] = [
  // Cadastro de unidades (academias/filiais) — DONO/ADMIN administram as
  // unidades do próprio assinante.
  { prefixo: "/unidades", perfis: ["ADMIN"] },
  // Arenas (tatames/espaços) da unidade ativa.
  { prefixo: "/arenas", perfis: ["ADMIN", "RECEPCAO"] },
  // Modalidades organizam turmas, currículos e a vitrine do site.
  { prefixo: "/modalidades", perfis: ["ADMIN", "RECEPCAO"] },
  { prefixo: "/dashboard", perfis: ["ADMIN"] },
  { prefixo: "/alunos", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/turmas", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/aulas", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/planejamento", perfis: ["ADMIN", "PROFESSOR"] },
  { prefixo: "/mensalidades", perfis: ["ADMIN", "RECEPCAO"] },
  { prefixo: "/assinaturas", perfis: ["ADMIN", "RECEPCAO"] },
  { prefixo: "/modelos-contrato", perfis: ["ADMIN", "RECEPCAO"] },
  { prefixo: "/contratos", perfis: ["ADMIN", "RECEPCAO"] },
  { prefixo: "/graduacoes", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/usuarios", perfis: ["ADMIN"] },
  { prefixo: "/competicoes", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/relatorios", perfis: ["ADMIN", "RECEPCAO"] },
  { prefixo: "/financeiro", perfis: ["ADMIN"] },
  { prefixo: "/loja", perfis: ["ADMIN"] },
  { prefixo: "/planos", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/mensagens", perfis: ["ADMIN", "RECEPCAO"] },
  { prefixo: "/mensagens-familia", perfis: ["ADMIN", "RECEPCAO"] },
  { prefixo: "/metas", perfis: ["ADMIN"] },
  { prefixo: "/eventos", perfis: ["ADMIN", "RECEPCAO"] },
  { prefixo: "/leads", perfis: ["ADMIN", "RECEPCAO"] },
  { prefixo: "/professor", perfis: ["ADMIN", "PROFESSOR"] },
  // A assinatura da academia no SysBelt: quanto custa, quantos alunos
  // estão sendo contados, quais faturas foram emitidas. É assunto do dono
  // do negócio, não de quem opera o dia a dia.
  { prefixo: "/minha-assinatura", perfis: ["DONO", "ADMIN"] },
];

// Página segura para qualquer perfil autenticado — usada como destino
// depois do login e como fallback quando o perfil não tem acesso à rota atual.
export const ROTA_PADRAO_POR_PERFIL: Record<Perfil, string> = {
  DONO: "/dashboard",
  ADMIN: "/dashboard",
  PROFESSOR: "/aulas",
  RECEPCAO: "/alunos",
};

export function perfilTemAcesso(perfil: string | undefined, caminho: string): boolean {
  const regra = REGRAS_ACESSO.find(
    (r) => caminho === r.prefixo || caminho.startsWith(`${r.prefixo}/`)
  );

  if (!regra) return true;

  const perfis = regra.perfis as string[];

  if (!perfil) return false;
  if (perfis.includes(perfil)) return true;

  // O DONO da academia manda onde um ADMIN dela manda — mesma herança
  // declarada no backend (shared/constants/perfis.ts). Sem isto ele não
  // navegaria em lugar nenhum, porque as regras acima falam de ADMIN.
  return perfil === "DONO" && perfis.includes("ADMIN");
}
