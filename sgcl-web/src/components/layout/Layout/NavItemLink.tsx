import { NavLink } from "react-router-dom";
import { LuPin, LuPinOff } from "react-icons/lu";
import type { NavItem } from "../../../shared/constants/navegacao";

interface NavItemLinkProps {
  item: NavItem;
  badge?: number;
  favorito: boolean;
  onAlternarFavorito: (to: string) => void;
  indentado?: boolean;
}

export function NavItemLink({ item, badge, favorito, onAlternarFavorito, indentado }: NavItemLinkProps) {
  const Icon = item.icon;

  return (
    <div className={`sidebar-item${indentado ? " sidebar-item-indentado" : ""}`}>
      <NavLink
        to={item.to}
        end={item.matchExato}
        title={item.label}
        className={({ isActive }) => `sidebar-link${isActive ? " sidebar-link-ativo" : ""}`}
      >
        <Icon size={18} />
        <span className="sidebar-link-label">{item.label}</span>
        {!!badge && <span className="sidebar-badge">{badge > 99 ? "99+" : badge}</span>}
      </NavLink>

      <button
        type="button"
        className={`sidebar-favorito${favorito ? " sidebar-favorito-ativo" : ""}`}
        onClick={() => onAlternarFavorito(item.to)}
        aria-label={favorito ? `Remover ${item.label} dos favoritos` : `Favoritar ${item.label}`}
        title={favorito ? "Remover dos favoritos" : "Favoritar"}
      >
        {favorito ? <LuPin size={14} /> : <LuPinOff size={14} />}
      </button>
    </div>
  );
}
