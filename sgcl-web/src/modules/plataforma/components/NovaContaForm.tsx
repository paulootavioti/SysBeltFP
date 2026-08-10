import { useState } from "react";

import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { FormGrid } from "../../../components/ui/FormGrid";
import { FormGridItem } from "../../../components/ui/FormGridItem";
import type { NovaContaDTO } from "../services/PlataformaService";
import { formatarCentavos, type PlanoPlataforma } from "../types";

interface NovaContaFormProps {
  planos: PlanoPlataforma[];
  loading?: boolean;
  onSubmit: (data: NovaContaDTO) => void;
}

export function NovaContaForm({ planos, loading = false, onSubmit }: NovaContaFormProps) {
  const disponiveis = planos.filter((plano) => plano.ativo);

  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [emailCobranca, setEmailCobranca] = useState("");
  const [nomePrimeiraUnidade, setNomePrimeiraUnidade] = useState("");
  const [planoId, setPlanoId] = useState(String(disponiveis[0]?.id ?? ""));
  const [diaVencimento, setDiaVencimento] = useState("10");
  const [diasDeTeste, setDiasDeTeste] = useState("14");
  const [erro, setErro] = useState("");

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();

    if (!nome.trim()) return setErro("Informe o nome do assinante.");
    if (!planoId) return setErro("Cadastre um plano antes de vender a primeira assinatura.");

    setErro("");

    onSubmit({
      nome: nome.trim(),
      documento: documento.trim() || null,
      emailCobranca: emailCobranca.trim() || null,
      // Sem nome de filial, a primeira unidade herda o nome da academia —
      // é o caso de quem tem só uma.
      nomePrimeiraUnidade: nomePrimeiraUnidade.trim() || null,
      planoId: Number(planoId),
      diaVencimento: Number(diaVencimento),
      diasDeTeste: Number(diasDeTeste),
    });
  }

  const planoEscolhido = disponiveis.find((plano) => String(plano.id) === planoId);

  return (
    <form onSubmit={enviar}>
      <FormGrid columns={2}>
        <FormGridItem span={2}>
          <Input
            label="Nome do assinante"
            placeholder="Ex: Cia de Lutas Kids"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </FormGridItem>

        <FormGridItem>
          <Input
            label="CNPJ ou CPF"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />
        </FormGridItem>

        <FormGridItem>
          <Input
            label="E-mail de cobrança"
            type="email"
            value={emailCobranca}
            onChange={(e) => setEmailCobranca(e.target.value)}
          />
        </FormGridItem>

        <FormGridItem span={2}>
          <Input
            label="Nome da primeira unidade"
            placeholder="Deixe em branco para usar o nome do assinante"
            value={nomePrimeiraUnidade}
            onChange={(e) => setNomePrimeiraUnidade(e.target.value)}
          />
        </FormGridItem>

        <FormGridItem span={2}>
          <Select
            label="Plano"
            options={disponiveis.map((plano) => ({
              value: String(plano.id),
              label: `${plano.nome} — ${formatarCentavos(plano.precoPorBlocoCentavos)} a cada ${plano.alunosPorBloco} alunos`,
            }))}
            value={planoId}
            onChange={(e) => setPlanoId(e.target.value)}
          />
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

        <FormGridItem>
          <Input
            label="Dias de teste grátis"
            type="number"
            min={0}
            max={365}
            value={diasDeTeste}
            onChange={(e) => setDiasDeTeste(e.target.value)}
          />
        </FormGridItem>

        <FormGridItem span={2}>
          <p className="plataforma-ajuda">
            {Number(diasDeTeste) > 0
              ? `A assinatura começa em teste e não é faturada por ${diasDeTeste} dias.`
              : "Sem período de teste: a assinatura já entra no próximo fechamento."}
            {planoEscolhido &&
              ` Com ${planoEscolhido.alunosPorBloco} alunos, a primeira fatura sai por ${formatarCentavos(
                planoEscolhido.precoPorBlocoCentavos
              )}.`}
          </p>
        </FormGridItem>
      </FormGrid>

      <ErrorMessage message={erro} />

      <Button type="submit" disabled={loading}>
        {loading ? "Cadastrando..." : "Cadastrar assinante"}
      </Button>
    </form>
  );
}
