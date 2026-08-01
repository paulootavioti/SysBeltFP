import { useState } from "react";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Tabs } from "../../../../components/ui/Tabs";

import { useMinhasTurmas } from "../../hooks/useMinhasTurmas";
import { MinhasTurmasTab } from "../../components/MinhasTurmasTab";
import { PlanejamentoSomenteLeituraTab } from "../../components/PlanejamentoSomenteLeituraTab";
import { ProntuarioAlunosTab } from "../../components/ProntuarioAlunosTab";
import { RegistrarGraduacaoTab } from "../../components/RegistrarGraduacaoTab";

import type { Turma } from "../../../turmas/types/turma";

import "./styles.css";

export function AreaDoProfessor() {
  const { turmas } = useMinhasTurmas();
  const [abaAtiva, setAbaAtiva] = useState("turmas");
  const [turmaParaPlanejamento, setTurmaParaPlanejamento] = useState<Turma | null>(null);

  function handleVerPlanejamento(turma: Turma) {
    setTurmaParaPlanejamento(turma);
    setAbaAtiva("planejamento");
  }

  return (
    <Layout>
      <PageHeader
        title="Área do Professor"
        subtitle="Suas turmas, chamada, planejamento, prontuários e solicitação de graduação."
      />

      <Tabs
        value={abaAtiva}
        onChange={setAbaAtiva}
        tabs={[
          {
            value: "turmas",
            label: "Minhas Turmas",
            content: <MinhasTurmasTab onVerPlanejamento={handleVerPlanejamento} />,
          },
          {
            value: "planejamento",
            label: "Planejamento Pedagógico",
            content: <PlanejamentoSomenteLeituraTab turmas={turmas} turmaSelecionada={turmaParaPlanejamento} />,
          },
          {
            value: "prontuario",
            label: "Prontuário dos Alunos",
            content: <ProntuarioAlunosTab turmas={turmas} />,
          },
          {
            value: "graduacao",
            label: "Registrar Graduação",
            content: <RegistrarGraduacaoTab turmas={turmas} />,
          },
        ]}
      />
    </Layout>
  );
}
