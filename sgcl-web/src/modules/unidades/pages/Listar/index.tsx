import { Navigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { useAuth } from "../../../../contexts/useAuth";

import { ArenasTab } from "../../../arenas/components/ArenasTab";

// SUPERADMIN administra unidades a partir do Dashboard — essa rota, pra
// esse perfil, só existe por compatibilidade com links antigos.
export function Unidades() {
  const { usuario } = useAuth();

  if (usuario?.perfil === "SUPERADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

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
