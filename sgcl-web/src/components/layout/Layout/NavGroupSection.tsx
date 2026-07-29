import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import type { ContadoresMenu } from "../../../shared/services/NotificacoesService";
import type { NavGroup } from "../../../shared/constants/navegacao";
import { NavItemLink } from "./NavItemLink";

interface NavGroupSectionProps {
  group: NavGroup;
  aberto: boolean;
  ativo: boolean;
  contadores: ContadoresMenu;
  favoritos: string[];
  onAlternarAberto: (id: string) => void;
  onAlternarFavorito: (to: string) => void;
}

export function NavGroupSection({
  group,
  aberto,
  ativo,
  contadores,
  favoritos,
  onAlternarAberto,
  onAlternarFavorito,
}: NavGroupSectionProps) {
  const Icon = group.icon;

  // Badge do cabeçalho = soma dos badges dos itens do grupo — assim uma
  // pendência continua visível mesmo com o grupo fechado.
  const badgeTotal = group.items.reduce(
    (soma, item) => soma + (item.badgeKey ? contadores[item.badgeKey] : 0),
    0
  );

  return (
    <div className="sidebar-grupo">
      <button
        type="button"
        className={`sidebar-grupo-cabecalho${ativo ? " sidebar-grupo-cabecalho-ativo" : ""}`}
        onClick={() => onAlternarAberto(group.id)}
        aria-expanded={aberto}
        title={group.label}
      >
        <Icon size={18} />
        <span className="sidebar-grupo-label">{group.label}</span>
        {!!badgeTotal && <span className="sidebar-badge">{badgeTotal > 99 ? "99+" : badgeTotal}</span>}
        {aberto ? <LuChevronDown size={16} className="sidebar-grupo-chevron" /> : <LuChevronRight size={16} className="sidebar-grupo-chevron" />}
      </button>

      {aberto && (
        <div className="sidebar-grupo-itens">
          {group.items.map((item) => (
            <NavItemLink
              key={item.to}
              item={item}
              badge={item.badgeKey ? contadores[item.badgeKey] : undefined}
              favorito={favoritos.includes(item.to)}
              onAlternarFavorito={onAlternarFavorito}
              indentado
            />
          ))}
        </div>
      )}
    </div>
  );
}
