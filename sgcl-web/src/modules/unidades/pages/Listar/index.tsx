import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";

import { UnidadesTab } from "../../components/UnidadesTab";

export function Unidades() {
  return (
    <Layout>
      <PageHeader
        title="Unidades"
        subtitle="Cadastro das unidades (academias/filiais) administradas no sistema."
      />

      <UnidadesTab />
    </Layout>
  );
}
