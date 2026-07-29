import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../contexts/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import { LuLogOut, LuMenu, LuX } from "react-icons/lu";
import { perfilTemAcesso } from "../../../shared/constants/acessoPorPerfil";
import { NAV_TREE, encontrarGrupoDaRota, type NavEntry } from "../../../shared/constants/navegacao";
import { useContadoresMenu } from "../../../hooks/useContadoresMenu";
import { useFavoritosMenu } from "../../../hooks/useFavoritosMenu";
import { NotificationBell } from "../../ui/NotificationBell";
import { SeletorUnidadeVisualizada } from "../SeletorUnidadeVisualizada";
import { SeletorUnidadeAtiva } from "../SeletorUnidadeAtiva";
import { NavItemLink } from "./NavItemLink";
import { NavGroupSection } from "./NavGroupSection";
import "./styles.css";

interface LayoutProps {
  children: ReactNode;
}

const CHAVE_GRUPOS_ABERTOS = "@sgcl:menuGruposAbertos";

export function Layout({ children }: LayoutProps) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const contadores = useContadoresMenu();
  const { favoritos, alternarFavorito } = useFavoritosMenu();

  const [menuAberto, setMenuAberto] = useState(false);
  const [gruposAbertos, setGruposAbertos] = useState<Set<string>>(() => {
    try {
      const salvo = localStorage.getItem(CHAVE_GRUPOS_ABERTOS);
      if (salvo) return new Set(JSON.parse(salvo));
    } catch {
      // ignora storage corrompido, cai no fallback abaixo
    }
    const grupoDaRotaAtual = encontrarGrupoDaRota(location.pathname);
    return grupoDaRotaAtual ? new Set([grupoDaRotaAtual]) : new Set();
  });

  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

  // ao navegar pra dentro de um grupo fechado (ex.: via favorito ou link
  // direto), abre esse grupo sozinho — nunca fecha os demais.
  useEffect(() => {
    const grupoDaRotaAtual = encontrarGrupoDaRota(location.pathname);
    if (grupoDaRotaAtual) {
      setGruposAbertos((atual) => (atual.has(grupoDaRotaAtual) ? atual : new Set(atual).add(grupoDaRotaAtual)));
    }
  }, [location.pathname]);

  function alternarGrupo(id: string) {
    setGruposAbertos((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) {
        proximo.delete(id);
      } else {
        proximo.add(id);
      }
      localStorage.setItem(CHAVE_GRUPOS_ABERTOS, JSON.stringify(Array.from(proximo)));
      return proximo;
    });
  }

  // SUPERADMIN administra unidades pelo Dashboard (que já tem item
  // próprio no menu), então "Arenas" (dentro de Configurações) some
  // daqui pra esse perfil.
  const arvoreVisivel = useMemo<NavEntry[]>(() => {
    return NAV_TREE.map((entrada): NavEntry | null => {
      if (entrada.kind === "item") {
        return perfilTemAcesso(usuario?.perfil, entrada.to) ? entrada : null;
      }

      const itensVisiveis = entrada.items
        .filter((item) => item.to !== "/unidades" || usuario?.perfil !== "SUPERADMIN")
        .filter((item) => perfilTemAcesso(usuario?.perfil, item.to));

      return itensVisiveis.length > 0 ? { ...entrada, items: itensVisiveis } : null;
    }).filter((entrada): entrada is NavEntry => entrada !== null);
  }, [usuario?.perfil]);

  const caminhosVisiveis = useMemo(() => {
    const caminhos = new Set<string>();
    arvoreVisivel.forEach((entrada) => {
      if (entrada.kind === "item") caminhos.add(entrada.to);
      else entrada.items.forEach((item) => caminhos.add(item.to));
    });
    return caminhos;
  }, [arvoreVisivel]);

  const itensFavoritos = useMemo(() => {
    return favoritos
      .filter((to) => caminhosVisiveis.has(to))
      .map((to) => arvoreVisivel.flatMap((e) => (e.kind === "group" ? e.items : [e])).find((item) => item.to === to))
      .filter((item): item is NonNullable<typeof item> => !!item);
  }, [favoritos, caminhosVisiveis, arvoreVisivel]);

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
          {itensFavoritos.length > 0 && (
            <div className="sidebar-grupo sidebar-grupo-favoritos">
              <span className="sidebar-secao-titulo">Favoritos</span>
              {itensFavoritos.map((item) => (
                <NavItemLink
                  key={item.to}
                  item={item}
                  badge={item.badgeKey ? contadores[item.badgeKey] : undefined}
                  favorito
                  onAlternarFavorito={alternarFavorito}
                />
              ))}
            </div>
          )}

          {arvoreVisivel.map((entrada) =>
            entrada.kind === "item" ? (
              <NavItemLink
                key={entrada.to}
                item={entrada}
                badge={entrada.badgeKey ? contadores[entrada.badgeKey] : undefined}
                favorito={favoritos.includes(entrada.to)}
                onAlternarFavorito={alternarFavorito}
              />
            ) : (
              <NavGroupSection
                key={entrada.id}
                group={entrada}
                aberto={gruposAbertos.has(entrada.id)}
                ativo={entrada.items.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))}
                contadores={contadores}
                favoritos={favoritos}
                onAlternarAberto={alternarGrupo}
                onAlternarFavorito={alternarFavorito}
              />
            )
          )}
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

          {(usuario?.perfil === "ADMIN" || usuario?.perfil === "RECEPCAO") && (
            <NotificationBell />
          )}

          <SeletorUnidadeVisualizada />
          <SeletorUnidadeAtiva />

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
