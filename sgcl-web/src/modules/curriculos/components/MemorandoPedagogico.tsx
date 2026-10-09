import { Textarea } from "../../../components/ui/Textarea";

interface MemorandoPedagogicoProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  sugestoes: string[];
  placeholder: string;
  rows?: number;
  className?: string;
  abrirAoIniciar?: boolean;
}

export function MemorandoPedagogico({ label, value, onChange, sugestoes, placeholder, rows = 3, className, abrirAoIniciar: _abrirAoIniciar }: MemorandoPedagogicoProps) {
  function usarSugestao(sugestao: string) {
    onChange(value.trim() ? `${value.trim()}\n${sugestao}` : sugestao);
  }

  return (
    <div className={`memorando-pedagogico ${className ?? ""}`.trim()}>
      <Textarea label={label} rows={rows} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
      <div className="memorando-pedagogico-sugestoes">
        {sugestoes.map((sugestao) => <button key={sugestao} type="button" onClick={() => usarSugestao(sugestao)}>+ {sugestao}</button>)}
      </div>
    </div>
  );
}
