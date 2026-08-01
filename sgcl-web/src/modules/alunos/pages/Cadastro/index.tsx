import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { CredenciaisPortalGeradasModal } from "../../../../components/sgcl/feedback/CredenciaisPortalGeradas";
import type { CredencialPortalGerada } from "../../../../components/sgcl/feedback/CredenciaisPortalGeradas";

import { AlunoForm } from "../../components/AlunoForm";
import { AlunoService } from "../../services/AlunoService";
import { ResponsavelService } from "../../../responsaveis/services/ResponsavelService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { useToast } from "../../../../contexts/toast/useToast";
import { useAuth } from "../../../../contexts/useAuth";

import type { AlunoFormData } from "../../schema/aluno.schema";

export function CadastroAluno() {
  const navigate = useNavigate();
  const toast = useToast();
  const { usuario } = useAuth();

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [credenciaisGeradas, setCredenciaisGeradas] = useState<CredencialPortalGerada[]>([]);

  async function handleSalvar(data: AlunoFormData) {
    try {
      setLoading(true);
      setErro("");

      const novoAluno = await AlunoService.criar(data);
      const credenciais: CredencialPortalGerada[] = [];

      if (novoAluno.senhaPortalGerada && novoAluno.email) {
        credenciais.push({
          papel: "Aluno",
          nome: novoAluno.nome,
          email: novoAluno.email,
          senha: novoAluno.senhaPortalGerada,
        });
      }

      if (data.responsavel?.nome) {
        const responsavelCriado = await ResponsavelService.criar(novoAluno.id, {
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
        });

        if (responsavelCriado.senhaPortalGerada && responsavelCriado.email) {
          credenciais.push({
            papel: "Responsável",
            nome: responsavelCriado.nome,
            email: responsavelCriado.email,
            senha: responsavelCriado.senhaPortalGerada,
          });
        }
      }

      toast.success("Aluno cadastrado com sucesso.");

      if (credenciais.length > 0) {
        setCredenciaisGeradas(credenciais);
      } else {
        navigate("/alunos");
      }
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao cadastrar aluno.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setLoading(false);
    }
  }

  if (usuario?.perfil === "PROFESSOR") {
    return <Navigate to="/alunos" replace />;
  }

  return (
    <Layout>
      <PageHeader
        title="Cadastro de Aluno"
        subtitle="Novo aluno da academia."
      />

      <ErrorMessage message={erro} />

      <AlunoForm
        loading={loading}
        onSubmit={handleSalvar}
      />

      <CredenciaisPortalGeradasModal
        credenciais={credenciaisGeradas}
        onClose={() => {
          setCredenciaisGeradas([]);
          navigate("/alunos");
        }}
      />
    </Layout>
  );
}