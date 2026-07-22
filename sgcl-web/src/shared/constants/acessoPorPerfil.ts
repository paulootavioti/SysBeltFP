export type Perfil = "ADMIN" | "PROFESSOR" | "RECEPCAO";

interface RegraAcesso {
  prefixo: string;
  perfis: Perfil[];
}

// Espelha as permissões (ensureRole) já aplicadas no backend, módulo a
// módulo, pra que o menu e as rotas nunca ofereçam algo que a API recusaria.
const REGRAS_ACESSO: RegraAcesso[] = [
  { prefixo: "/dashboard", perfis: ["ADMIN"] },
  { prefixo: "/alunos", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/turmas", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/aulas", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/planejamento", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/mensalidades", perfis: ["ADMIN", "RECEPCAO"] },
  { prefixo: "/graduacoes", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/usuarios", perfis: ["ADMIN"] },
  { prefixo: "/competicoes", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/relatorios", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/financeiro", perfis: ["ADMIN", "RECEPCAO"] },
  { prefixo: "/planos", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
  { prefixo: "/mensagens", perfis: ["ADMIN", "PROFESSOR", "RECEPCAO"] },
];

// Página segura para qualquer perfil autenticado — usada como destino
// depois do login e como fallback quando o perfil não tem acesso à rota atual.
export const ROTA_PADRAO_POR_PERFIL: Record<Perfil, string> = {
  ADMIN: "/dashboard",
  PROFESSOR: "/alunos",
  RECEPCAO: "/alunos",
};

export function perfilTemAcesso(perfil: string | undefined, caminho: string): boolean {
  const regra = REGRAS_ACESSO.find(
    (r) => caminho === r.prefixo || caminho.startsWith(`${r.prefixo}/`)
  );

  if (!regra) return true;

  return !!perfil && (regra.perfis as string[]).includes(perfil);
}
