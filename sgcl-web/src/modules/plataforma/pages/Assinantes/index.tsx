import { useEffect, useState } from "react";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Table } from "../../../../components/ui/Table";
import { Modal } from "../../../../components/ui/Modal";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";
import { useToast } from "../../../../contexts/toast/useToast";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { PlataformaService } from "../../services/PlataformaService";
import {
  STATUS_ASSINATURA_LABEL,
  formatarCentavos,
  type ContaResumo,
  type MinhaAssinatura,
  type PlanoPlataforma,
} from "../../types";
import { NovaContaForm } from "../../components/NovaContaForm";
import { AssinaturaDaConta } from "../../components/AssinaturaDaConta";
import { PlanosDaPlataforma } from "../../components/PlanosDaPlataforma";
import "./styles.css";

export function Assinantes() {
  const toast = useToast();
  const [contas, setContas] = useState<ContaResumo[]>([]);
  const [planos, setPlanos] = useState<PlanoPlataforma[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [modalNovaConta, setModalNovaConta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [detalhe, setDetalhe] = useState<MinhaAssinatura | null>(null);
  const [modalPlanos, setModalPlanos] = useState(false);
  const [confirmarFechamento, setConfirmarFechamento] = useState(false);
  const [fechando, setFechando] = useState(false);

  async function carregar() {
    try {
      setLoading(true);
      setErro("");
      const [listaContas, listaPlanos] = await Promise.all([
        PlataformaService.listarContas(),
        PlataformaService.listarPlanos(),
      ]);
      setContas(listaContas);
      setPlanos(listaPlanos);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar os assinantes."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function abrirDetalhe(conta: ContaResumo) {
    try {
      setDetalhe(await PlataformaService.detalharConta(conta.id));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao abrir o assinante."));
    }
  }

  async function salvarNovaConta(data: Parameters<typeof PlataformaService.criarConta>[0]) {
    try {
      setSalvando(true);
      await PlataformaService.criarConta(data);
      toast.success("Assinante cadastrado.");
      setModalNovaConta(false);
      await carregar();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao cadastrar o assinante."));
    } finally {
      setSalvando(false);
    }
  }

  async function fecharMes() {
    try {
      setFechando(true);
      const resultado = await PlataformaService.fecharMes();

      // Diz o que aconteceu, inclusive quando não aconteceu nada: "0
      // geradas / 3 já existiam" é resposta útil, e some a dúvida de se o
      // botão funcionou.
      toast.success(
        `${resultado.geradas} fatura(s) emitida(s), ${resultado.jaExistiam} já existia(m). ` +
          `Total: ${formatarCentavos(resultado.valorTotalCentavos)}.`
      );

      setConfirmarFechamento(false);
      await carregar();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao fechar o mês."));
    } finally {
      setFechando(false);
    }
  }

  const receitaPrevista = contas.reduce(
    (total, conta) => total + (conta.assinatura?.valorCentavos ?? 0),
    0
  );
  const alunosTotais = contas.reduce((total, conta) => total + conta.alunosAtivos, 0);
  const pagantes = contas.filter((c) => c.assinatura?.status === "ATIVA").length;

  const colunas = [
    {
      header: "Assinante",
      accessor: "nome" as keyof ContaResumo,
      render: (conta: ContaResumo) => (
        <button className="assinantes-link" onClick={() => abrirDetalhe(conta)}>
          {conta.nome}
        </button>
      ),
    },
    {
      header: "Unidades",
      accessor: "unidades" as keyof ContaResumo,
      render: (conta: ContaResumo) => String(conta.unidades),
    },
    {
      header: "Alunos ativos",
      accessor: "alunosAtivos" as keyof ContaResumo,
      render: (conta: ContaResumo) => String(conta.alunosAtivos),
    },
    {
      header: "Plano",
      accessor: "assinatura" as keyof ContaResumo,
      render: (conta: ContaResumo) => conta.assinatura?.plano ?? "—",
    },
    {
      header: "Situação",
      accessor: "ativo" as keyof ContaResumo,
      render: (conta: ContaResumo) =>
        conta.assinatura ? (
          <span className={`assinantes-status assinantes-status--${conta.assinatura.status.toLowerCase()}`}>
            {STATUS_ASSINATURA_LABEL[conta.assinatura.status]}
          </span>
        ) : (
          <span className="assinantes-status assinantes-status--sem">Sem assinatura</span>
        ),
    },
    {
      header: "Mensalidade",
      accessor: "id" as keyof ContaResumo,
      render: (conta: ContaResumo) =>
        conta.assinatura ? formatarCentavos(conta.assinatura.valorCentavos) : "—",
    },
  ];

  return (
    <Layout>
      <PageHeader
        title="Assinantes"
        subtitle="Academias que assinam o SysBelt"
        action={
          <div className="assinantes-acoes">
            <Button variant="secondary" onClick={() => setModalPlanos(true)}>
              Planos
            </Button>
            <Button variant="secondary" onClick={() => setConfirmarFechamento(true)}>
              Fechar o mês
            </Button>
            <Button onClick={() => setModalNovaConta(true)}>+ Novo assinante</Button>
          </div>
        }
      />

      {erro && <ErrorMessage message={erro} />}

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="assinantes-cartoes">
            <div className="assinantes-cartao">
              <span>Receita prevista no mês</span>
              <strong>{formatarCentavos(receitaPrevista)}</strong>
            </div>
            <div className="assinantes-cartao">
              <span>Assinantes pagantes</span>
              <strong>
                {pagantes} de {contas.length}
              </strong>
            </div>
            <div className="assinantes-cartao">
              <span>Alunos na base</span>
              <strong>{alunosTotais}</strong>
            </div>
          </div>

          {contas.length === 0 ? (
            <EmptyState
              title="Nenhum assinante ainda"
              description="Cadastre a primeira academia para começar a cobrar."
            />
          ) : (
            <Table columns={colunas} data={contas} />
          )}
        </>
      )}

      <Modal
        open={modalNovaConta}
        onClose={() => setModalNovaConta(false)}
        title="Novo assinante"
      >
        <NovaContaForm planos={planos} loading={salvando} onSubmit={salvarNovaConta} />
      </Modal>

      <Modal
        open={!!detalhe}
        onClose={() => setDetalhe(null)}
        title={detalhe ? detalhe.conta.nome : ""}
        size="lg"
      >
        {detalhe && (
          <AssinaturaDaConta
            detalhe={detalhe}
            planos={planos}
            onAtualizado={async (contaId) => {
              setDetalhe(await PlataformaService.detalharConta(contaId));
              await carregar();
            }}
          />
        )}
      </Modal>

      <Modal open={modalPlanos} onClose={() => setModalPlanos(false)} title="Planos da plataforma" size="lg">
        <PlanosDaPlataforma planos={planos} onAtualizado={carregar} />
      </Modal>

      <ConfirmDialog
        open={confirmarFechamento}
        title="Fechar o mês"
        message={
          "Emite a fatura deste mês para todo assinante ativo ou inadimplente. " +
          "Rodar de novo não cobra em dobro — quem já tem fatura do mês é ignorado."
        }
        confirmLabel="Emitir faturas"
        loading={fechando}
        onConfirm={fecharMes}
        onCancel={() => setConfirmarFechamento(false)}
      />
    </Layout>
  );
}

