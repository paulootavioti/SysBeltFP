import { useEffect, useState } from "react";

import { ProgressBar } from "../../../../graduacoes/components/ProgressBar";
import { TimelineGraduacoes } from "../../../../graduacoes/components/TimelineGraduacoes";
import { GraduacaoService } from "../../../../graduacoes/services/GraduacaoService";
import { Loading } from "../../../../../components/ui/Loading";

import type { Graduacao } from "../../../types/graduacao";
import type { EvolucaoAluno } from "../../../../graduacoes/types";

import "./styles.css";

interface GraduacoesTabProps {
  aluno: { id: number; graduacoes?: Graduacao[] };
}

export function GraduacoesTab({ aluno }: GraduacoesTabProps) {
  const [evolucao, setEvolucao] = useState<EvolucaoAluno | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function carregarEvolucao() {
      try {
        setCarregando(true);
        const data = await GraduacaoService.getEvolucao(aluno.id);
        if (ativo) setEvolucao(data);
      } catch {
        if (ativo) setEvolucao(null);
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarEvolucao();

    return () => {
      ativo = false;
    };
  }, [aluno.id]);

  return (
    <div className="graduacoes-tab">
      <section className="graduacoes-tab-secao">
        <h3>Evolução</h3>
        {carregando ? <Loading /> : evolucao ? <ProgressBar evolucao={evolucao} /> : <p>Sem dados de evolução.</p>}
      </section>

      <section className="graduacoes-tab-secao">
        <h3>Histórico de Graduações</h3>
        <TimelineGraduacoes graduacoes={aluno.graduacoes ?? []} />
      </section>
    </div>
  );
}