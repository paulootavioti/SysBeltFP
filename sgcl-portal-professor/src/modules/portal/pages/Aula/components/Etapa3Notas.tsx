import { useState } from "react";

import { BottomSheet } from "../../../../../components/ui/BottomSheet";
import { Button } from "../../../../../components/ui/Button";
import { Textarea } from "../../../../../components/ui/Textarea";
import { TAGS_NOTA_RAPIDA } from "../../../types";
import type { AulaAlunoDetalhe, NotaAula } from "../../../types";
import "./Etapa3Notas.css";

interface Etapa3NotasProps {
  alunosPresentes: AulaAlunoDetalhe[];
  notas: NotaAula[];
  observacao: string;
  onSalvarNota: (alunoId: number, dados: { tag?: string; texto?: string }) => Promise<void>;
  onSalvarObservacao: (texto: string) => void;
}

export function Etapa3Notas({ alunosPresentes, notas, observacao, onSalvarNota, onSalvarObservacao }: Etapa3NotasProps) {
  const [alunoSelecionado, setAlunoSelecionado] = useState<AulaAlunoDetalhe | null>(null);
  const [tagSelecionada, setTagSelecionada] = useState<string | null>(null);
  const [textoNota, setTextoNota] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [rascunhoObservacao, setRascunhoObservacao] = useState(observacao);

  function abrirSheet(registro: AulaAlunoDetalhe) {
    const notaExistente = notas.find((nota) => nota.alunoId === registro.alunoId);
    setTagSelecionada(notaExistente?.tag ?? null);
    setTextoNota(notaExistente?.texto ?? "");
    setAlunoSelecionado(registro);
  }

  async function handleSalvarNota() {
    if (!alunoSelecionado) return;
    try {
      setSalvando(true);
      await onSalvarNota(alunoSelecionado.alunoId, {
        tag: tagSelecionada ?? undefined,
        texto: textoNota.trim() || undefined,
      });
      setAlunoSelecionado(null);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="etapa-notas">
      <div className="etapa-notas-card">
        <p className="etapa-notas-eyebrow">Destaque um aluno</p>
        <p className="etapa-notas-subtitulo">Toque no aluno e registre o que observou — vai para o prontuário</p>

        <div className="etapa-notas-lista">
          {alunosPresentes.map((registro) => {
            const nota = notas.find((item) => item.alunoId === registro.alunoId);
            return (
              <button key={registro.id} type="button" className="etapa-notas-linha" onClick={() => abrirSheet(registro)}>
                <span className="etapa-notas-nome">{registro.aluno.apelido || registro.aluno.nome}</span>
                <span className={`etapa-notas-chip${nota ? " etapa-notas-chip-preenchido" : ""}`}>
                  {nota?.tag ?? (nota?.texto ? "nota" : "+ nota")}
                </span>
              </button>
            );
          })}

          {alunosPresentes.length === 0 && <p className="etapa-notas-vazio">Nenhum aluno presente ainda.</p>}
        </div>
      </div>

      <div className="etapa-notas-card">
        <p className="etapa-notas-eyebrow">Observação da turma</p>
        <Textarea
          placeholder="Como foi o treino de hoje?"
          value={rascunhoObservacao}
          onChange={(e) => setRascunhoObservacao(e.target.value)}
          onBlur={() => {
            if (rascunhoObservacao !== observacao) onSalvarObservacao(rascunhoObservacao);
          }}
        />
      </div>

      <BottomSheet
        open={!!alunoSelecionado}
        title={alunoSelecionado?.aluno.apelido || alunoSelecionado?.aluno.nome || ""}
        onClose={() => setAlunoSelecionado(null)}
      >
        <div className="etapa-notas-tags">
          {TAGS_NOTA_RAPIDA.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`etapa-notas-tag${tagSelecionada === tag ? " etapa-notas-tag-selecionada" : ""}`}
              onClick={() => setTagSelecionada(tagSelecionada === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <Textarea
          label="Observação (opcional)"
          value={textoNota}
          onChange={(e) => setTextoNota(e.target.value)}
          placeholder="Algo mais que queira registrar..."
        />

        <div className="etapa-notas-sheet-acoes">
          <Button variant="secondary" onClick={() => setAlunoSelecionado(null)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={handleSalvarNota} disabled={salvando || (!tagSelecionada && !textoNota.trim())}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
