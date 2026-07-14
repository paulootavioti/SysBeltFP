import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { CrudDataTable } from "../../../../components/ui/CrudDataTable";
import { Badge } from "../../../../components/ui/Badge";
import { Modal } from "../../../../components/ui/Modal";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";

import { useAuth } from "../../../../contexts/AuthContext";
import { AulaService } from "../../services/AulaService";
import { IniciarAulaForm, type IniciarAulaFormData } from "../../components/IniciarAulaForm";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";

import type { Aula } from "../../types";

export function Aulas() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [erro, setErro] = useState("");

  const ehAdmin = usuario?.perfil === "ADMIN";

  async function carregarAulas() {
    try {
      const data = await AulaService.listar();
      setAulas(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAulas();
  }, []);

  async function handleIniciarAula(data: IniciarAulaFormData) {
    try {
      setIniciando(true);
      setErro("");

      const aula = await AulaService.iniciar({
        turmaId: Number(data.turmaId),
        aulaCurriculoId: data.aulaCurriculoId ? Number(data.aulaCurriculoId) : undefined,
        professor: data.professor || undefined,
        observacoes: data.observacoes || undefined,
      });

      setModalAberto(false);
      navigate(`/aulas/${aula.id}/chamada`);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao iniciar aula."));
    } finally {
      setIniciando(false);
    }
  }

  async function handleExcluirAula(aula: Aula) {
    if (!window.confirm("Excluir esta aula? Os registros de chamada dela também serão apagados. Essa ação não pode ser desfeita.")) {
      return;
    }

    try {
      setErro("");
      await AulaService.excluir(aula.id);
      await carregarAulas();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao excluir aula."));
    }
  }

  return (
    <Layout>
      <PageHeader title="Aulas" subtitle="Controle das aulas e chamadas." />

      <ErrorMessage message={erro} />

      <CrudDataTable
        title="Aulas"
        description="Aulas iniciadas no sistema."
        data={aulas}
        loading={loading}
        searchable
        searchPlaceholder="Pesquisar aula..."
        searchKeys={["professor", "status"]}
        createLabel="Iniciar Aula"
        onCreate={() => setModalAberto(true)}
        onEdit={(aula) => {
          navigate(`/aulas/${aula.id}/chamada`);
        }}
        onDelete={ehAdmin ? handleExcluirAula : undefined}
        columns={[
          { header: "Turma", render: (aula) => aula.turma?.nome ?? "-" },
          { header: "Professor", render: (aula) => aula.professor ?? "-" },
          {
            header: "Data",
            render: (aula) => new Date(aula.data).toLocaleDateString("pt-BR"),
          },
          {
            header: "Status",
            align: "center",
            render: (aula) =>
              aula.status === "ABERTA" ? (
                <Badge variant="warning">Aberta</Badge>
              ) : (
                <Badge variant="success">Finalizada</Badge>
              ),
          },
        ]}
        emptyMessage="Nenhuma aula encontrada."
      />

      <Modal open={modalAberto} title="Iniciar Aula" onClose={() => setModalAberto(false)}>
        <IniciarAulaForm loading={iniciando} onSubmit={handleIniciarAula} />
      </Modal>
    </Layout>
  );
}