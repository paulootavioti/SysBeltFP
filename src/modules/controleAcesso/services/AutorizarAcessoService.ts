import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import type { SentidoAcesso } from "../providers";
import { tenantTemRecurso } from "../../concessaoPlataforma/recursos";

export interface DecisaoAcesso {
  autorizado: boolean;
  motivo: string;
  alunoId?: number | null;
  usuarioId?: number | null;
}

interface AutorizarAcessoDTO {
  /// identificação lida pelo equipamento
  credencialId?: number | null;
  alunoId?: number | null;
  usuarioId?: number | null;
  sentido?: SentidoAcesso;
  /// permite testar/reprocessar com um instante específico
  referencia?: Date;
}

// Motor de regras de liberação. É o único lugar que decide quem entra —
// independe de fabricante, e vale tanto para o equipamento que consulta o
// servidor a cada passagem quanto para a conferência de um evento que já
// veio decidido localmente.
//
// Regras, em ordem (a primeira que falha nega):
//   1. saída é sempre liberada — ninguém fica preso lá dentro;
//   2. a concessão precisa liberar o recurso de controle de acesso;
//   3. a credencial precisa existir, estar ativa e dentro da validade;
//   4. aluno precisa estar ativo;
//   5. aluno com mensalidade vencida não passa (a academia pode desligar
//      essa regra por unidade — ver bloqueiaInadimplente);
//   6. usuário (professor/equipe) precisa estar ativo.
export class AutorizarAcessoService {
  constructor(
    private readonly temRecurso: typeof tenantTemRecurso = tenantTemRecurso,
  ) {}

  async execute(dados: AutorizarAcessoDTO): Promise<DecisaoAcesso> {
    const prisma = prismaDaRequisicao();
    const sentido = dados.sentido ?? "ENTRADA";
    const agora = dados.referencia ?? new Date();

    if (sentido === "SAIDA") {
      return { autorizado: true, motivo: "Saída liberada", alunoId: dados.alunoId, usuarioId: dados.usuarioId };
    }

    if (!(await this.temRecurso("CONTROLE_ACESSO", agora))) {
      return { autorizado: false, motivo: "Controle de acesso indisponível para esta assinatura" };
    }

    let alunoId = dados.alunoId ?? null;
    let usuarioId = dados.usuarioId ?? null;

    if (dados.credencialId) {
      const credencial = await prisma.credencialAcesso.findUnique({
        where: { id: dados.credencialId },
      });

      if (!credencial) {
        return { autorizado: false, motivo: "Credencial não reconhecida" };
      }

      if (!credencial.ativo) {
        return { autorizado: false, motivo: "Credencial desativada", alunoId: credencial.alunoId, usuarioId: credencial.usuarioId };
      }

      if (credencial.validoAte && credencial.validoAte < agora) {
        return { autorizado: false, motivo: "Credencial expirada", alunoId: credencial.alunoId, usuarioId: credencial.usuarioId };
      }

      alunoId = credencial.alunoId;
      usuarioId = credencial.usuarioId;
    }

    if (alunoId) {
      return this.avaliarAluno(alunoId, agora);
    }

    if (usuarioId) {
      const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });

      if (!usuario || !usuario.ativo) {
        return { autorizado: false, motivo: "Usuário inativo", usuarioId };
      }

      return { autorizado: true, motivo: "Acesso de equipe liberado", usuarioId };
    }

    return { autorizado: false, motivo: "Pessoa não identificada" };
  }

  private async avaliarAluno(alunoId: number, agora: Date): Promise<DecisaoAcesso> {
    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
      include: { unidade: true },
    });

    if (!aluno) {
      return { autorizado: false, motivo: "Aluno não encontrado", alunoId };
    }

    if (!aluno.ativo) {
      return { autorizado: false, motivo: "Matrícula inativa", alunoId };
    }

    const vencidas = await prisma.mensalidade.count({
      where: { alunoId, status: "VENCIDA" },
    });

    if (vencidas > 0) {
      // negar a entrada por inadimplência é decisão comercial da academia —
      // por isso a mensagem é explícita e o evento fica registrado, pra
      // recepção poder liberar manualmente quando fizer sentido.
      return {
        autorizado: false,
        motivo: `Mensalidade em aberto (${vencidas})`,
        alunoId,
      };
    }

    return { autorizado: true, motivo: "Acesso liberado", alunoId };
  }
}
