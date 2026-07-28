import type { AlertaDashboard } from "../types";
import type { MetaDashboard } from "../../metas/types";
import type { Evento } from "../../eventos/types";

const DIAS_EVENTO_PROXIMO = 7;
const LIMIAR_INSCRICOES_BAIXAS = 0.5;

// Alertas derivados no FRONT a partir dos serviços mockados de Metas e
// Eventos (que ainda não têm backend próprio — ver `MetaService` e
// `EventoService`). Quando esses módulos ganharem backend real, essa
// lógica deve migrar pra dentro de `GetAlertasDashboardService`
// (backend), junto dos demais alertas — hoje fica aqui só porque a fonte
// de dados também está só no front.
export function alertasDeMetasAtrasadas(metas: MetaDashboard[]): AlertaDashboard[] {
  const atrasadas = metas.filter((meta) => meta.status === "ATRASADA");
  if (atrasadas.length === 0) return [];

  return [
    {
      id: "metas-atrasadas",
      titulo: "Metas atrasadas",
      descricao: `${atrasadas.length} meta(s) com prazo vencido e ainda não atingida(s): ${atrasadas
        .map((m) => m.nome)
        .join(", ")}.`,
      prioridade: "ALTA",
      quantidade: atrasadas.length,
      rota: "/metas",
    },
  ];
}

export function alertasDeEventosComInscricoesBaixas(eventos: Evento[]): AlertaDashboard[] {
  const agora = Date.now();
  const limite = agora + DIAS_EVENTO_PROXIMO * 24 * 60 * 60 * 1000;

  const comInscricoesBaixas = eventos.filter((evento) => {
    if (evento.status === "CANCELADO" || evento.status === "CONCLUIDO") return false;
    if (!evento.metaParticipantes) return false;

    const dataInicio = new Date(evento.dataInicio).getTime();
    if (dataInicio < agora || dataInicio > limite) return false;

    const confirmados = evento.participantesConfirmados ?? 0;
    return confirmados / evento.metaParticipantes < LIMIAR_INSCRICOES_BAIXAS;
  });

  if (comInscricoesBaixas.length === 0) return [];

  return [
    {
      id: "eventos-inscricoes-baixas",
      titulo: "Campanhas/seminários com poucas inscrições",
      descricao: `${comInscricoesBaixas.length} evento(s) nos próximos ${DIAS_EVENTO_PROXIMO} dias com menos de ${
        LIMIAR_INSCRICOES_BAIXAS * 100
      }% da meta de participantes.`,
      prioridade: "MEDIA",
      quantidade: comInscricoesBaixas.length,
      rota: "/eventos",
    },
  ];
}

export function mesclarAlertas(
  alertasBackend: AlertaDashboard[],
  metas: MetaDashboard[],
  eventos: Evento[]
): AlertaDashboard[] {
  const ordemPrioridade: Record<AlertaDashboard["prioridade"], number> = {
    CRITICA: 0,
    ALTA: 1,
    MEDIA: 2,
    BAIXA: 3,
  };

  return [
    ...alertasBackend,
    ...alertasDeMetasAtrasadas(metas),
    ...alertasDeEventosComInscricoesBaixas(eventos),
  ].sort((a, b) => ordemPrioridade[a.prioridade] - ordemPrioridade[b.prioridade]);
}
