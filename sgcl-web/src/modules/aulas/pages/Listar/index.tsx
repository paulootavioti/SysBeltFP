import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { CrudDataTable } from "../../../../components/ui/CrudDataTable";
import { Badge } from "../../../../components/ui/Badge";
import { Modal } from "../../../../components/ui/Modal";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";

import { useAuth } from "../../../../contexts/useAuth";
import { AulaService } from "../../services/AulaService";
import { IniciarAulaForm, type IniciarAulaFormData } from "../../components/IniciarAulaForm";
import { GradeHorariaSemanal } from "../../components/GradeHorariaSemanal";
import { ResumoTurmas } from "../../components/ResumoTurmas";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";

import type { Aula, PeriodoContagem } from "../../types";

import "./styles.css";

export function Aulas() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [turmaSelecionada, setTurmaSelecionada] = useState<{ id: number; nome: string } | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoContagem>("SEMANAL");

  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [erro, setErro] = useState("");

  const ehAdmin = usuario?.perfil === "ADMIN";

  async function carregarAulas() {
    if (!turmaSelecionada) return;

    try {
      setLoading(true);
      const data = await AulaService.listar({ turmaId: turmaSelecionada.id, periodo });
      setAulas(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAulas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaSelecionada, periodo]);

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
      <div className="aulas-cabecalho">
        <PageHeader title="Aulas" subtitle="Controle das aulas e chamadas." />
        <GradeHorariaSemanal compacta />
      </div>

      <ErrorMessage message={erro} />

      <div className="aulas-acoes-topo">
        <Button type="button" onClick={() => setModalAberto(true)}>
          + Iniciar aula avulsa
        </Button>
      </div>

      {!turmaSelecionada ? (
        <ResumoTurmas
          colunaQuantidade="Aulas Cadastradas"
          periodo={periodo}
          onPeriodoChange={setPeriodo}
          carregarResumo={AulaService.resumoTurmas}
          onSelecionarTurma={(turmaId, turmaNome) => setTurmaSelecionada({ id: turmaId, nome: turmaNome })}
        />
      ) : (
        <>
          <div className="aulas-drill-cabecalho">
            <Button type="button" variant="secondary" onClick={() => setTurmaSelecionada(null)}>
              ← Voltar para turmas
            </Button>
            <h2>{turmaSelecionada.nome}</h2>
          </div>

          <CrudDataTable
            title={turmaSelecionada.nome}
            description="Aulas iniciadas no sistema para esta turma."
            data={aulas}
            loading={loading}
            searchable
            searchPlaceholder="Pesquisar aula..."
            searchKeys={["professor", "status"]}
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
            emptyMessage="Nenhuma aula encontrada para esta turma no período selecionado."
          />
        </>
      )}

      <Modal open={modalAberto} title="Iniciar aula avulsa" onClose={() => setModalAberto(false)}>
        <IniciarAulaForm loading={iniciando} onSubmit={handleIniciarAula} />
      </Modal>
    </Layout>
  );
}
