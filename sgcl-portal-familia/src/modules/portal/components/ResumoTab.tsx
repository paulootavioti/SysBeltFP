import { useEffect, useState } from "react";

import { Loading } from "../../../components/ui/Loading";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Badge } from "../../../components/ui/Badge";
import { InfoCard } from "../../../components/ui/InfoCard";

import { PortalService } from "../services/PortalService";
import { getApiErrorMessage } from "../../../utils/getApiErrorMessage";
import type { Resumo } from "../types";

const BADGE_STATUS: Record<string, { label: string; variant: "warning" | "success" | "danger" | "neutral" }> = {
  ABERTA: { label: "Em aberto", variant: "warning" },
  VENCIDA: { label: "Vencida", variant: "danger" },
  PAGA: { label: "Paga", variant: "success" },
  CANCELADA: { label: "Cancelada", variant: "neutral" },
  ESTORNADA: { label: "Estornada", variant: "neutral" },
};

interface ResumoTabProps {
  alunoId: number;
}

export function ResumoTab({ alunoId }: ResumoTabProps) {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    PortalService.resumo(alunoId)
      .then(setResumo)
      .catch((error) => setErro(getApiErrorMessage(error, "Não foi possível carregar o resumo.")))
      .finally(() => setLoading(false));
  }, [alunoId]);

  if (loading) return <Loading />;
  if (erro) return <ErrorMessage message={erro} />;
  if (!resumo) return null;

  const { aluno, progresso, mensalidade, proximaAula } = resumo;
  const badge = mensalidade ? BADGE_STATUS[mensalidade.status] : null;

  return (
    <div className="resumo-tab-grid">
      <InfoCard title="Faixa atual" value={aluno.faixa} description={`Grau ${aluno.grau}`} />

      <InfoCard
        title="Progresso do grau"
        value={`${progresso.aulasNoCicloAtual}/${progresso.aulasPorGrau} aulas`}
        description={`${progresso.totalPresencas} presenças no total`}
      />

      <InfoCard
        title="Mensalidade"
        value={mensalidade ? `R$ ${mensalidade.valor.toFixed(2)}` : "Em dia"}
        description={
          mensalidade
            ? `Vence em ${new Date(mensalidade.vencimento).toLocaleDateString("pt-BR")}`
            : "Nenhuma pendência"
        }
      />

      {badge && (
        <div className="resumo-tab-status">
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      )}

      <InfoCard
        title="Próxima aula"
        value={
          proximaAula
            ? `${new Date(proximaAula.data).toLocaleDateString("pt-BR")} — ${proximaAula.horarioInicio}`
            : "Sem aula agendada"
        }
        description={proximaAula ? proximaAula.turmaNome : undefined}
      />
    </div>
  );
}
