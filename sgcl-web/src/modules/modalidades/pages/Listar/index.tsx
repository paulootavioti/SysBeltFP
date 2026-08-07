import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";

import { ModalidadesTab } from "../../components/ModalidadesTab";

export function Modalidades() {
  return (
    <Layout>
      <PageHeader
        title="Modalidades"
        subtitle="O que a academia ensina. Organiza turmas, currículos e o que aparece no site."
      />

      <ModalidadesTab />
    </Layout>
  );
}
