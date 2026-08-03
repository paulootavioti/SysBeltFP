import { Input } from "../Input";
import { Select } from "../Select";

import "./styles.css";

export interface FiltroAtivo {
  chave: string;
  rotulo: string;
  limpar: () => void;
}

export interface FilterBarSelect {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

interface FilterBarProps {
  buscaLabel?: string;
  buscaPlaceholder?: string;
  buscaValue: string;
  onBuscaChange: (value: string) => void;
  selects?: FilterBarSelect[];
  filtrosAtivos?: FiltroAtivo[];
}

// Busca (flex:1) + selects à direita + pills de filtro ativo removíveis —
// mesmo padrão já usado em alunos/loja (array filtrosAtivos), agora
// compartilhado. Cada tela decide o que entra em `selects` e como calcula
// `filtrosAtivos` a partir do próprio estado de filtro.
export function FilterBar({
  buscaLabel = "Pesquisar",
  buscaPlaceholder = "Digite para buscar...",
  buscaValue,
  onBuscaChange,
  selects = [],
  filtrosAtivos = [],
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="filter-bar-linha">
        <Input
          label={buscaLabel}
          placeholder={buscaPlaceholder}
          value={buscaValue}
          onChange={(e) => onBuscaChange(e.target.value)}
        />

        {selects.map((select) => (
          <Select
            key={select.label}
            label={select.label}
            options={select.options}
            value={select.value}
            onChange={(e) => select.onChange(e.target.value)}
          />
        ))}
      </div>

      {filtrosAtivos.length > 0 && (
        <div className="filter-bar-chips">
          {filtrosAtivos.map((filtro) => (
            <span key={filtro.chave} className="filter-bar-chip">
              {filtro.rotulo}
              <button type="button" onClick={filtro.limpar} aria-label={`Remover filtro ${filtro.rotulo}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
