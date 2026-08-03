import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";

import { ArenasTab } from "../../components/ArenasTab";

export function Arenas() {
  return (
    <Layout>
      <PageHeader
        title="Arenas"
        subtitle="Tatames, tapetes e demais espaços onde as turmas dão aula."
      />

      <ArenasTab />
    </Layout>
  );
}
