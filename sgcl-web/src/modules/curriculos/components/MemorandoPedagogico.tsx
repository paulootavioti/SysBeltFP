import { useRef, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Select";
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

const NOVA_ORIENTACAO = "__nova_orientacao__";

/** Lista de sugestões com editor textual aberto apenas sob demanda. */
export function MemorandoPedagogico({ label, value, onChange, sugestoes, placeholder, rows = 3, className, abrirAoIniciar = false }: MemorandoPedagogicoProps) {
  const area = useRef<HTMLTextAreaElement | null>(null);
  const [editorAberto, setEditorAberto] = useState(abrirAoIniciar);
  const [selecao, setSelecao] = useState("");

  function usarSugestao(sugestao: string) {
    onChange(value.trim() ? `${value.trim()}\n${sugestao}` : sugestao);
  }

  function abrirEditor() {
    setEditorAberto(true);
    requestAnimationFrame(() => area.current?.focus());
  }

  function selecionarSugestao(proximaSelecao: string) {
    setSelecao("");
    if (proximaSelecao === NOVA_ORIENTACAO) return abrirEditor();
    if (proximaSelecao) usarSugestao(proximaSelecao);
  }

  return (
    <div className={`memorando-pedagogico ${className ?? ""}`.trim()}>
      <Select
        label={label}
        value={selecao}
        onChange={(event) => selecionarSugestao(event.target.value)}
        options={[
          ...sugestoes.map((sugestao) => ({ label: sugestao, value: sugestao })),
          { label: "Cadastrar nova orientação", value: NOVA_ORIENTACAO },
        ]}
      />
      {!editorAberto && value.trim() && <p className="memorando-pedagogico-resumo">{value}</p>}
      {!editorAberto && value.trim() && <Button type="button" variant="secondary" onClick={abrirEditor}>Editar orientação</Button>}
      {editorAberto && <Textarea label={`Editar: ${label}`} rows={rows} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} ref={area} />}
    </div>
  );
}
