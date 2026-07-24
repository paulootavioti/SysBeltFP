import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Tabs } from "../../../../components/ui/Tabs";

import { AulasHoje } from "../../components/AulasHoje";
import { GradeHorariaSemanal } from "../../components/GradeHorariaSemanal";
import { ProgramacaoTab } from "../../components/ProgramacaoTab";
import { AulasTab } from "../../components/AulasTab";

import "./styles.css";

export function Aulas() {
  return (
    <Layout>
      <PageHeader
        title="Aulas"
        subtitle="Programação, controle de aulas e chamadas."
      />

      <AulasHoje />

      <div className="aulas-grade-semanal">
        <GradeHorariaSemanal />
      </div>

      <Tabs
        defaultValue="programacao"
        tabs={[
          {
            label: "Programação",
            value: "programacao",
            content: <ProgramacaoTab />,
          },
          {
            label: "Aulas e Chamadas",
            value: "chamadas",
            content: <AulasTab />,
          },
        ]}
      />
    </Layout>
  );
}
