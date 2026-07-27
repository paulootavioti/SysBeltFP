import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Tabs } from "../../../../components/ui/Tabs";
import { useAuth } from "../../../../contexts/useAuth";

import { UnidadesTab } from "../../components/UnidadesTab";
import { ArenasTab } from "../../../arenas/components/ArenasTab";

export function Unidades() {
  const { usuario } = useAuth();
  const ehSuperadmin = usuario?.perfil === "SUPERADMIN";

  return (
    <Layout>
      <PageHeader
        title={ehSuperadmin ? "Unidades" : "Arenas"}
        subtitle={
          ehSuperadmin
            ? "Academias/filiais administradas por você e suas arenas."
            : "Tatames, tapetes e demais espaços onde as turmas dão aula."
        }
      />

      {ehSuperadmin ? (
        <Tabs
          defaultValue="unidades"
          tabs={[
            {
              label: "Unidades",
              value: "unidades",
              content: <UnidadesTab />,
            },
            {
              label: "Arenas",
              value: "arenas",
              content: <ArenasTab />,
            },
          ]}
        />
      ) : (
        <ArenasTab />
      )}
    </Layout>
  );
}
