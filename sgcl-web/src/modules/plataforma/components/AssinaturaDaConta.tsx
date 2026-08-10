import { useState } from "react";

import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";
import { useToast } from "../../../contexts/toast/useToast";
import { formatarData } from "../../../shared/utils/formatarData";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import { PlataformaService } from "../services/PlataformaService";
import {
  STATUS_ASSINATURA_LABEL,
  centavosParaReais,
  formatarCentavos,
  reaisParaCentavos,
  type FaturaPlataforma,
  type MinhaAssinatura,
  type PlanoPlataforma,
  type StatusAssinaturaPlataforma,
} from "../types";

const STATUS_FATURA_BADGE = {
  ABERTA: "PENDENTE",
  PAGA: "PAGO",
  CANCELADA: "CANCELADO",
} as const;

const OPCOES_STATUS = (
  Object.keys(STATUS_ASSINATURA_LABEL) as StatusAssinaturaPlataforma[]
).map((valor) => ({ value: valor, label: STATUS_ASSINATURA_LABEL[valor] }));

// Competência é mês, e mês é data de calendário — lido em UTC pra não
// virar o mês anterior no fuso de quem olha.
function formatarCompetencia(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface AssinaturaDaContaProps {
  detalhe: MinhaAssinatura;
  planos: PlanoPlataforma[];
  onAtualizado: (contaId: number) => Promise<void>;
}

export function AssinaturaDaConta({ detalhe, planos, onAtualizado }: AssinaturaDaContaProps) {
  const toast = useToast();
  const contaId = detalhe.conta.id;

  const [planoId, setPlanoId] = useState(String(detalhe.plano.id));
  const [status, setStatus] = useState<StatusAssinaturaPlataforma>(detalhe.status);
  const [diaVencimento, setDiaVencimento] = useState(String(detalhe.diaVencimento));
  // Preço em REAIS na tela, centavos no envio. Pedir centavos a quem
  // negocia preço é convite a errar por um fator de 100.
  const [precoNegociado, setPrecoNegociado] = useState(
    centavosParaReais(detalhe.plano.precoPorBlocoCentavos)
  );
  const [salvando, setSalvando] = useState(false);
  const [baixando, setBaixando] = useState(0);

  const planoDeTabela = planos.find((plano) => String(plano.id) === planoId);
  const centavosDigitados = reaisParaCentavos(precoNegociado);

  async function salvar() {
    if (!Number.isFinite(centavosDigitados) || centavosDigitados < 100) {
      toast.error("Preço inválido. O mínimo é R$ 1,00 por faixa.");
      return;
    }

    try {
      setSalvando(true);
      await PlataformaService.alterarAssinatura(contaId, {
        planoId: Number(planoId),
        status,
        diaVencimento: Number(diaVencimento),
        // Só manda preço quando ele DIFERE da tabela do plano: gravar um
        // "negociado" igual ao de tabela congelaria o cliente num valor
        // que deveria acompanhar o reajuste do plano.
        precoPorBlocoCentavos:
          planoDeTabela && centavosDigitados === planoDeTabela.precoPorBlocoCentavos
            ? null
            : centavosDigitados,
      });
      toast.success("Assinatura atualizada.");
      await onAtualizado(contaId);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao atualizar a assinatura."));
    } finally {
      setSalvando(false);
    }
  }

  async function darBaixa(fatura: FaturaPlataforma) {
    try {
      setBaixando(fatura.id);
      await PlataformaService.marcarFaturaPaga(fatura.id);
      toast.success("Fatura baixada.");
      await onAtualizado(contaId);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao baixar a fatura."));
    } finally {
      setBaixando(0);
    }
  }

  return (
    <div className="conta-detalhe">
      <div className="conta-detalhe-resumo">
        <div>
          <span>Alunos ativos</span>
          <strong>{detalhe.previaDoMes.alunosContados}</strong>
        </div>
        <div>
          <span>Previsto neste mês</span>
          <strong>{formatarCentavos(detalhe.previaDoMes.valorCentavos)}</strong>
        </div>
        <div>
          <span>Faixas</span>
          <strong>{detalhe.previaDoMes.blocos}</strong>
        </div>
      </div>

      <FormGrid columns={2}>
        <FormGridItem>
          <Select
            label="Plano"
            options={planos.map((plano) => ({ value: String(plano.id), label: plano.nome }))}
            value={planoId}
            onChange={(e) => setPlanoId(e.target.value)}
          />
        </FormGridItem>

        <FormGridItem>
          <Select
            label="Situação"
            options={OPCOES_STATUS}
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusAssinaturaPlataforma)}
          />
        </FormGridItem>

        <FormGridItem>
          <Input
            label="Preço por faixa (R$)"
            value={precoNegociado}
            onChange={(e) => setPrecoNegociado(e.target.value)}
          />
          {planoDeTabela && centavosDigitados !== planoDeTabela.precoPorBlocoCentavos && (
            <p className="plataforma-ajuda">
              Condição especial — a tabela do plano é{" "}
              {formatarCentavos(planoDeTabela.precoPorBlocoCentavos)}.
            </p>
          )}
        </FormGridItem>

        <FormGridItem>
          <Input
            label="Dia de vencimento"
            type="number"
            min={1}
            max={31}
            value={diaVencimento}
            onChange={(e) => setDiaVencimento(e.target.value)}
          />
        </FormGridItem>
      </FormGrid>

      <p className="plataforma-ajuda">
        Suspender corta o acesso aos recursos do plano. Inadimplente NÃO corta —
        é só a marcação de atraso.
      </p>

      <Button disabled={salvando} onClick={salvar}>
        {salvando ? "Salvando..." : "Salvar assinatura"}
      </Button>

      <h3 className="conta-detalhe-titulo">Faturas</h3>

      {detalhe.faturas.length === 0 ? (
        <EmptyState title="Nenhuma fatura emitida" description="Rode o fechamento do mês." />
      ) : (
        // Lista, e não tabela: dentro de um modal de 600px uma tabela de
        // seis colunas empurra a ação pra fora da área visível, e um botão
        // "Dar baixa" que só aparece rolando pro lado é um botão que não
        // existe. A lista põe a ação sempre na borda direita.
        <ul className="faturas-lista">
          {detalhe.faturas.map((f) => (
            <li key={f.id}>
              <div>
                <strong>{formatarCompetencia(f.competencia)}</strong>
                <span className="fatura-apoio">
                  {f.alunosContados} alunos · {f.blocos} faixas · vence{" "}
                  {formatarData(f.vencimento)}
                </span>
              </div>

              <div className="faturas-valor">
                <strong>{formatarCentavos(f.valorCentavos)}</strong>
                <StatusBadge status={STATUS_FATURA_BADGE[f.status]} />
              </div>

              {f.status === "ABERTA" ? (
                <Button variant="secondary" disabled={baixando === f.id} onClick={() => darBaixa(f)}>
                  {baixando === f.id ? "Baixando..." : "Dar baixa"}
                </Button>
              ) : (
                <span className="plataforma-ajuda">
                  {f.pagaEm ? `Pago em ${formatarData(f.pagaEm)}` : "—"}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
