import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/useAuth";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import {
  LuLayoutDashboard,
  LuUsers,
  LuSchool,
  LuCalendarDays,
  LuCalendarClock,
  LuBookOpen,
  LuWallet,
  LuAward,
  LuStar,
  LuUserCog,
  LuTrophy,
  LuChartLine,
  LuPiggyBank,
  LuCreditCard,
  LuMessageCircle,
  LuLogOut,
  LuMenu,
  LuX,
} from "react-icons/lu";
import "./styles.css";

interface LayoutProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LuLayoutDashboard },
  { to: "/alunos", label: "Alunos", icon: LuUsers },
  { to: "/turmas", label: "Turmas", icon: LuSchool },
  { to: "/aulas", label: "Aulas", icon: LuCalendarDays },
  { to: "/aulas/programacao", label: "Programação de Aulas", icon: LuCalendarClock },
  { to: "/planejamento", label: "Planejamento Pedagógico", icon: LuBookOpen },
  { to: "/mensalidades", label: "Mensalidades", icon: LuWallet },
  { to: "/graduacoes", label: "Graduações", icon: LuAward },
  { to: "/graduacoes/proximas", label: "Próximas Promoções", icon: LuStar },
  { to: "/usuarios", label: "Usuários", icon: LuUserCog },
  { to: "/competicoes", label: "Competições", icon: LuTrophy },
  { to: "/relatorios", label: "Relatórios", icon: LuChartLine },
  { to: "/financeiro", label: "Financeiro", icon: LuPiggyBank },
  { to: "/planos", label: "Planos", icon: LuCreditCard },
  { to: "/mensagens", label: "Mensagens", icon: LuMessageCircle },
];

export function Layout({ children }: LayoutProps) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="layout">
      <aside className={`sidebar${menuAberto ? " sidebar-aberta" : ""}`}>
        <div className="sidebar-topo">
          <div className="sidebar-marca">
            <h2>Sys Belt</h2>
            <span>Sistema Faixa Preta</span>
          </div>

          <button
            type="button"
            className="sidebar-fechar"
            onClick={() => setMenuAberto(false)}
            aria-label="Fechar menu"
          >
            <LuX size={22} />
          </button>
        </div>

        <hr />

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard" || to === "/aulas" || to === "/graduacoes"}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " sidebar-link-ativo" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {menuAberto && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
        />
      )}

      <main className="content">
        <header className="header">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
          >
            <LuMenu size={22} />
          </button>

          <strong className="header-usuario">{usuario?.nome}</strong>

          <Button onClick={handleLogout}>
            <LuLogOut size={16} />
            <span className="botao-sair-texto">Sair</span>
          </Button>
        </header>

        <div className="page">{children}</div>
      </main>
    </div>
  );
}
