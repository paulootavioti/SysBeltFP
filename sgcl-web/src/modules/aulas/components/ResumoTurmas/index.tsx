import { useEffect, useState } from "react";

import { Table } from "../../../../components/ui/Table";
import { Loading } from "../../../../components/ui/Loading";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { PeriodoContagemSelector } from "../PeriodoContagemSelector";

import type { PeriodoContagem, ResumoTurmaAulas } from "../../types";

import "./styles.css";

interface ResumoTurmasProps {
  colunaQuantidade: string;
  periodo: PeriodoContagem;
  onPeriodoChange: (periodo: PeriodoContagem) => void;
  carregarResumo: (periodo: PeriodoContagem) => Promise<ResumoTurmaAulas[]>;
  onSelecionarTurma: (turmaId: number, turmaNome: string) => void;
}

export function ResumoTurmas({
  colunaQuantidade,
  periodo,
  onPeriodoChange,
  carregarResumo,
  onSelecionarTurma,
}: ResumoTurmasProps) {
  const [resumo, setResumo] = useState<ResumoTurmaAulas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        const dados = await carregarResumo(periodo);
        if (ativo) setResumo(dados);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  return (
    <div className="resumo-turmas">
      <div className="resumo-turmas-cabecalho">
        <h2>Turmas</h2>
        <PeriodoContagemSelector valor={periodo} onChange={onPeriodoChange} />
      </div>

      {loading ? (
        <Loading />
      ) : resumo.length === 0 ? (
        <EmptyState title="Nenhuma turma ativa" description="Cadastre uma turma para começar." />
      ) : (
        <Table
          columns={[
            {
              header: "Turma",
              accessor: "turmaNome" as const,
              render: (item: ResumoTurmaAulas & { id: number }) => (
                <button
                  type="button"
                  className="resumo-turmas-link"
                  onClick={() => onSelecionarTurma(item.turmaId, item.turmaNome)}
                >
                  {item.turmaNome}
                </button>
              ),
            },
            { header: colunaQuantidade, accessor: "quantidade" as const },
          ]}
          data={resumo.map((item) => ({ ...item, id: item.turmaId }))}
        />
      )}
    </div>
  );
}
