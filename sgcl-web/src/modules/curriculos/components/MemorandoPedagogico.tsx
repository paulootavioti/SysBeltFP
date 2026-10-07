import { useRef } from "react";

import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/Textarea";

interface MemorandoPedagogicoProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  sugestoes: string[];
  placeholder: string;
  rows?: number;
  className?: string;
}

/** Campo de texto livre com repertório rápido, sem forçar o professor a usar um modelo. */
export function MemorandoPedagogico({ label, value, onChange, sugestoes, placeholder, rows = 3, className }: MemorandoPedagogicoProps) {
  const area = useRef<HTMLTextAreaElement | null>(null);

  function usarSugestao(sugestao: string) {
    onChange(value.trim() ? `${value.trim()}\n${sugestao}` : sugestao);
  }

  return (
    <div className={`memorando-pedagogico ${className ?? ""}`.trim()}>
      <div className="memorando-pedagogico-sugestoes" aria-label={`Sugestões para ${label}`}>
        {sugestoes.map((sugestao) => (
          <button key={sugestao} type="button" onClick={() => usarSugestao(sugestao)}>{sugestao}</button>
        ))}
        <Button type="button" variant="secondary" onClick={() => area.current?.focus()}>Escrever nova orientação</Button>
      </div>
      <Textarea label={label} rows={rows} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} ref={area} />
    </div>
  );
}
