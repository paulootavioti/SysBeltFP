import type { IconType } from "react-icons";
import {
  LuLayoutDashboard,
  LuUsers,
  LuSchool,
  LuCalendarDays,
  LuBookOpen,
  LuWallet,
  LuAward,
  LuStar,
  LuUserCog,
  LuTrophy,
  LuChartLine,
  LuPiggyBank,
  LuCreditCard,
  LuDoorOpen,
  LuMessageCircle,
  LuTarget,
  LuMegaphone,
  LuBanknote,
  LuReceipt,
  LuRepeat,
  LuFileText,
  LuFileStack,
  LuGraduationCap,
  LuBriefcase,
  LuTrendingUp,
  LuSettings,
  LuCircleHelp,
  LuClipboardCheck,
  LuInbox,
  LuShoppingBag,
  LuUserPlus,
  LuBuilding2,
  LuSwords,
} from "react-icons/lu";

import type { ContadoresMenu } from "../services/NotificacoesService";

// Chave de contador exibida como badge numérico no item — ver
// useContadoresMenu (busca os números) e NotificacoesService (contrato
// com o backend). Cada chave aqui tem uma tela de destino já existente.
export type BadgeKey = keyof ContadoresMenu;

export interface NavItem {
  kind: "item";
  to: string;
  label: string;
  icon: IconType;
  badgeKey?: BadgeKey;
  // rotas cujo prefixo já ativa este item mesmo sem bater exatamente
  // (ex.: "/graduacoes/:id" continua realçando "Graduações").
  matchExato?: boolean;
}

export interface NavGroup {
  kind: "group";
  id: string;
  label: string;
  icon: IconType;
  items: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

function item(to: string, label: string, icon: IconType, badgeKey?: BadgeKey): NavItem {
  return { kind: "item", to, label, icon, badgeKey };
}

// Match exato (sem prefixo) pros itens cujo caminho é prefixo de outro
// item — sem isso os dois ficariam destacados ao mesmo tempo (ex.:
// "/graduacoes" e "/graduacoes/proximas").
function itemExato(to: string, label: string, icon: IconType, badgeKey?: BadgeKey): NavItem {
  return { kind: "item", to, label, icon, badgeKey, matchExato: true };
}

// Árvore de navegação do sistema — a única fonte de verdade da sidebar.
// Grupos existem pra reduzir o primeiro nível (de ~19 itens soltos pra um
// punhado de seções) e deixar claro onde um módulo novo deve entrar; um
// módulo novo normalmente só precisa de uma linha aqui (ver
// docs/coding-standards.md), sem tocar no componente da sidebar.
//
// "Dashboard" e "Relatórios" ficam fora de qualquer grupo de propósito —
// são hubs que cruzam vários módulos, não pertencem a um domínio só, e
// isso segue a convenção usual de ERPs (Omie, Conta Azul) de manter
// Dashboard/Relatórios sempre soltos no topo/rodapé.
export const NAV_TREE: NavEntry[] = [
  itemExato("/dashboard", "Dashboard", LuLayoutDashboard),

  // hub dedicado do perfil PROFESSOR (também visível ao ADMIN) — mesma
  // razão de ficar solto que Dashboard/Relatórios: não é um módulo de
  // domínio, é uma tela que reúne o que o professor usa no dia a dia.
  itemExato("/professor", "Área do Professor", LuClipboardCheck),

  {
    kind: "group",
    id: "academico",
    label: "Gestão Acadêmica",
    icon: LuUsers,
    items: [
      item("/alunos", "Alunos", LuUsers),
      item("/turmas", "Turmas", LuSchool),
      itemExato("/aulas", "Aulas", LuCalendarDays),
    ],
  },

  {
    kind: "group",
    id: "pedagogico",
    label: "Gestão Pedagógica",
    icon: LuGraduationCap,
    items: [
      item("/planejamento", "Planejamento Pedagógico", LuBookOpen),
      itemExato("/graduacoes", "Graduações", LuAward),
      item("/graduacoes/proximas", "Próximas Graduações", LuStar, "graduacoesPendentes"),
      item("/competicoes", "Competições", LuTrophy),
    ],
  },

  {
    kind: "group",
    id: "financeiro",
    label: "Gestão Financeira",
    icon: LuPiggyBank,
    items: [
      itemExato("/financeiro", "Financeiro", LuPiggyBank),
      item("/mensalidades", "Mensalidades", LuWallet, "mensalidadesVencidas"),
      item("/assinaturas", "Assinaturas", LuRepeat),
      item("/financeiro/formas-pagamento", "Formas de Pagamento", LuBanknote),
      // A assinatura da ACADEMIA no SysBelt — não confundir com as
      // assinaturas dos alunos, logo acima. Fica no financeiro porque é
      // uma despesa fixa do negócio.
      item("/minha-assinatura", "Minha Assinatura (SysBelt)", LuReceipt),
    ],
  },

  {
    kind: "group",
    id: "comercial",
    label: "Gestão Comercial",
    icon: LuBriefcase,
    items: [
      item("/planos", "Planos", LuCreditCard),
      item("/contratos", "Contratos", LuFileText, "contratosAguardandoAssinatura"),
      item("/modelos-contrato", "Modelos de Contrato", LuFileStack),
      item("/loja", "Loja", LuShoppingBag, "pedidosAguardandoRetirada"),
    ],
  },

  {
    kind: "group",
    id: "comunicacao",
    label: "Comunicação",
    icon: LuMessageCircle,
    items: [
      item("/mensagens", "Mensagens", LuMessageCircle),
      item("/mensagens-familia", "Mensagens da Família", LuInbox, "mensagensFamiliaNaoLidas"),
    ],
  },

  {
    kind: "group",
    id: "crescimento",
    label: "Crescimento",
    icon: LuTrendingUp,
    items: [
      item("/eventos", "Campanhas e Seminários", LuMegaphone),
      item("/metas", "Metas", LuTarget),
      item("/leads", "Leads", LuUserPlus),
    ],
  },

  item("/relatorios", "Relatórios", LuChartLine),

  {
    kind: "group",
    id: "configuracoes",
    label: "Configurações",
    icon: LuSettings,
    items: [
      // "Unidades" só é visível pro SUPERADMIN (ver acessoPorPerfil.ts) —
      // é quem administra as unidades/filiais do sistema como um todo.
      item("/unidades", "Unidades", LuBuilding2),
      item("/arenas", "Arenas", LuDoorOpen),
      item("/modalidades", "Modalidades", LuSwords),
      item("/usuarios", "Usuários", LuUserCog),
      // Painel do OPERADOR do SaaS: os assinantes do SysBelt, o catálogo
      // de planos e o faturamento da plataforma. Só o SUPERADMIN enxerga
      // (ver acessoPorPerfil.ts) — nem o dono da academia.
      item("/plataforma/assinantes", "Assinantes (SysBelt)", LuBuilding2),
    ],
  },

  // Sempre visível a todos os perfis autenticados — não pertence a
  // nenhum domínio, por isso fica solta como Dashboard/Relatórios.
  itemExato("/ajuda", "Central de Ajuda", LuCircleHelp),
];

// Índice plano (caminho -> item) — usado pra resolver os favoritos
// (guardados como lista de caminhos) de volta pro item completo
// (ícone/label/badge), sem precisar varrer a árvore toda vez.
export const NAV_ITENS_POR_CAMINHO: Record<string, NavItem> = Object.fromEntries(
  NAV_TREE.flatMap((entrada) => (entrada.kind === "group" ? entrada.items : [entrada])).map((item) => [
    item.to,
    item,
  ])
);

function rotaPertenceAoItem(pathname: string, item: NavItem): boolean {
  return item.matchExato ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

// Qual grupo contém a rota atual — usado só pra decidir qual seção abrir
// automaticamente ao navegar, não precisa ser tão preciso quanto o
// destaque de item ativo (que fica a cargo do próprio NavLink).
export function encontrarGrupoDaRota(pathname: string): string | null {
  for (const entrada of NAV_TREE) {
    if (entrada.kind === "group" && entrada.items.some((item) => rotaPertenceAoItem(pathname, item))) {
      return entrada.id;
    }
  }
  return null;
}
