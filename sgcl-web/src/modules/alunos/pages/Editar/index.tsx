import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";

import { AlunoForm } from "../../components/AlunoForm";
import { AlunoService } from "../../services/AlunoService";
import { ResponsavelService } from "../../../responsaveis/services/ResponsavelService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { useToast } from "../../../../contexts/toast/useToast";
import { useAuth } from "../../../../contexts/useAuth";

import type { Aluno } from "../../types";
import type { AlunoFormData } from "../../schema/aluno.schema";

export function EditarAluno() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { usuario } = useAuth();

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarAluno() {
      try {
        setLoading(true);

        const data = await AlunoService.buscar(Number(id));

        setAluno(data);
      } catch (error) {
        setErro(
          getApiErrorMessage(
            error,
            "Erro ao carregar aluno."
          )
        );
      } finally {
        setLoading(false);
      }
    }

    carregarAluno();
  }, [id]);

  async function handleSalvar(data: AlunoFormData) {
    try {
      setSalvando(true);
      setErro("");

      await AlunoService.editar(Number(id), data);

      if (data.responsavel?.nome) {
        const dadosResponsavel = {
          nome: data.responsavel.nome,
          apelido: data.responsavel.apelido,
          parentesco: data.responsavel.parentesco || "Não informado",
          telefone: data.responsavel.telefone,
          whatsapp: data.responsavel.whatsapp,
          email: data.responsavel.email,
          responsavelFinanceiro: data.responsavel.responsavelFinanceiro ?? false,
          podeBuscar: data.responsavel.podeBuscar ?? true,
          contatoEmergencia: data.responsavel.contatoEmergencia ?? false,
          recebeComunicados: data.responsavel.recebeComunicados ?? true,
        };

        if (data.responsavel.id) {
          await ResponsavelService.atualizar(data.responsavel.id, Number(id), dadosResponsavel);
        } else {
          await ResponsavelService.criar(Number(id), dadosResponsavel);
        }
      }

      toast.success("Aluno atualizado com sucesso.");
      navigate("/alunos");
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao editar aluno.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  // PROFESSOR não tem permissão de editar aluno — navegação manual pra cá
  // só devolveria os dados básicos (redigidos) num formulário que espera
  // o cadastro completo.
  if (usuario?.perfil === "PROFESSOR") {
    return <Navigate to="/alunos" replace />;
  }

  return (
    <Layout>
      <PageHeader
        title="Editar Aluno"
        subtitle="Alteração dos dados do aluno."
      />

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : (
        <AlunoForm
          aluno={aluno ?? undefined}
          loading={salvando}
          onSubmit={handleSalvar}
        />
      )}
    </Layout>
  );
}