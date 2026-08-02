import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Modal } from "../../../../components/ui/Modal";
import { CredenciaisPortalGeradasModal } from "../../../../components/sgcl/feedback/CredenciaisPortalGeradas";
import type { CredencialPortalGerada } from "../../../../components/sgcl/feedback/CredenciaisPortalGeradas";

import { AlunoForm } from "../../components/AlunoForm";
import { AlunoService } from "../../services/AlunoService";
import { ResponsavelForm } from "../../../responsaveis/components/ResponsavelForm";
import { ResponsavelService } from "../../../responsaveis/services/ResponsavelService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { useToast } from "../../../../contexts/toast/useToast";
import { useAuth } from "../../../../contexts/useAuth";

import type { AlunoFormData } from "../../schema/aluno.schema";
import type { ResponsavelFormData } from "../../../responsaveis/schema/responsavel.schema";

import "./styles.css";

export function CadastroAluno() {
  const navigate = useNavigate();
  const toast = useToast();
  const { usuario } = useAuth();

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [credenciaisGeradas, setCredenciaisGeradas] = useState<CredencialPortalGerada[]>([]);

  // responsáveis além do principal (que continua sendo cadastrado na aba
  // "Responsável" do formulário abaixo) — reaproveita o mesmo ResponsavelForm
  // usado em Alunos > Detalhes, só que ainda sem um alunoId pra vincular
  // (isso só acontece depois que o aluno é criado, no submit final).
  const [responsaveisExtras, setResponsaveisExtras] = useState<ResponsavelFormData[]>([]);
  const [modalExtraAberto, setModalExtraAberto] = useState(false);

  function handleAdicionarExtra(data: ResponsavelFormData) {
    setResponsaveisExtras((atual) => [...atual, data]);
    setModalExtraAberto(false);
  }

  function handleRemoverExtra(indice: number) {
    setResponsaveisExtras((atual) => atual.filter((_, i) => i !== indice));
  }

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

      const responsaveisParaCriar: ResponsavelFormData[] = [];

      if (data.responsavel?.nome) {
        responsaveisParaCriar.push({
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
      }

      responsaveisParaCriar.push(...responsaveisExtras);

      for (const responsavel of responsaveisParaCriar) {
        const responsavelCriado = await ResponsavelService.criar(novoAluno.id, responsavel);

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

      <div className="cadastro-aluno-responsaveis-extras">
        <div className="cadastro-aluno-responsaveis-extras-cabecalho">
          <div>
            <strong>Outros responsáveis (opcional)</strong>
            <p>
              Além do responsável principal informado na aba "Responsável" abaixo, você pode adicionar outros
              responsáveis do aluno aqui.
            </p>
          </div>

          <Button type="button" variant="secondary" size="sm" onClick={() => setModalExtraAberto(true)}>
            + Adicionar responsável
          </Button>
        </div>

        {responsaveisExtras.length > 0 && (
          <ul className="cadastro-aluno-responsaveis-extras-lista">
            {responsaveisExtras.map((responsavel, indice) => (
              <li key={`${responsavel.nome}-${indice}`}>
                <span>
                  {responsavel.nome} <span className="cadastro-aluno-responsaveis-extras-parentesco">— {responsavel.parentesco}</span>
                </span>
                <button type="button" onClick={() => handleRemoverExtra(indice)} aria-label={`Remover ${responsavel.nome}`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlunoForm
        loading={loading}
        onSubmit={handleSalvar}
      />

      <Modal open={modalExtraAberto} title="Adicionar responsável" onClose={() => setModalExtraAberto(false)}>
        <ResponsavelForm loading={false} onSubmit={handleAdicionarExtra} />
      </Modal>

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