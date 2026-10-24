import type { PrismaClient } from "@prisma/client";

import { prismaDaRequisicao } from "../database/prismaDaRequisicao";
import { AppError } from "../errors/AppError";

// Academia com a assinatura da plataforma suspensa ou vencida continua
// consultando os próprios dados, mas não cadastra nem altera nada até
// regularizar. É a decisão de produto registrada em
// docs/prontidao-lancamento.md ("somente leitura").
//
// Vale para quem passa por ensureAuthenticated: o painel da academia e o
// Portal do Professor. O Portal da Família tem autenticação própria e fica
// de fora de propósito — a família pagar a mensalidade é dinheiro entrando
// para a academia. Webhooks também não passam por aqui.

const METODOS_DE_LEITURA = new Set(["GET", "HEAD", "OPTIONS"]);

// Escritas que ajudam a sair da situação continuam liberadas.
const ROTAS_LIBERADAS = ["/suporte"];

export const MENSAGEM_SOMENTE_LEITURA =
  "A assinatura da plataforma está suspensa ou vencida: o sistema está em modo somente leitura. " +
  "Regularize a assinatura para voltar a cadastrar e alterar dados.";

type RepositorioConcessao = Pick<PrismaClient, "concessaoPlataforma">;

export async function exigirEscritaLiberada(
  dados: { metodo?: string; rotaBase?: string; contaId: number },
  agora = new Date(),
  db: RepositorioConcessao = prismaDaRequisicao(),
): Promise<void> {
  if (METODOS_DE_LEITURA.has((dados.metodo ?? "GET").toUpperCase())) return;
  if (ROTAS_LIBERADAS.some((rota) => dados.rotaBase?.startsWith(rota))) return;

  const concessao = await db.concessaoPlataforma.findUnique({
    where: { contaId: dados.contaId },
    select: { statusAcesso: true, expiraEm: true },
  });

  // Conta sem concessão ainda não foi provisionada pelo Control Plane (a
  // instalação de antes da integração): segue como sempre funcionou.
  if (!concessao) return;

  if (concessao.statusAcesso !== "ATIVO" || concessao.expiraEm <= agora) {
    throw new AppError(MENSAGEM_SOMENTE_LEITURA, 403);
  }
}
