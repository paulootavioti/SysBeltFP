import { randomUUID } from "crypto";

import { AppError } from "../../../../shared/errors/AppError";

// Cliente HTTP mínimo do Mercado Pago. Usa o `fetch` global (Node 18+),
// em vez do SDK oficial, pra não adicionar dependência: a superfície que
// o sistema usa são três chamadas.

const BASE_URL = "https://api.mercadopago.com";

// Uma chamada de pagamento que fica pendurada é pior que uma que falha:
// prende a requisição do usuário e não dá resposta.
const TIMEOUT_MS = 15_000;

export interface PagamentoMercadoPago {
  id: number;
  status: string;
  status_detail?: string;
  transaction_amount: number;
  external_reference?: string | null;
  date_of_expiration?: string | null;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
}

// O token entra por parâmetro, vindo da forma de pagamento da unidade —
// não de variável de ambiente. É o que permite cada academia usar a
// própria conta do Mercado Pago no mesmo servidor.
function exigirToken(accessToken: string): string {
  if (!accessToken) {
    throw new AppError(
      "Mercado Pago não configurado para esta unidade: cadastre o access token na forma de pagamento.",
      503
    );
  }

  return accessToken;
}

async function chamar<T>(
  caminho: string,
  opcoes: {
    metodo: "GET" | "POST";
    accessToken: string;
    corpo?: unknown;
    chaveIdempotencia?: string;
  }
): Promise<T> {
  const cabecalhos: Record<string, string> = {
    Authorization: `Bearer ${exigirToken(opcoes.accessToken)}`,
    "Content-Type": "application/json",
  };

  // O Mercado Pago usa esta chave pra não criar dois pagamentos quando a
  // mesma requisição é repetida (timeout de rede, retry do nosso lado).
  if (opcoes.chaveIdempotencia) {
    cabecalhos["X-Idempotency-Key"] = opcoes.chaveIdempotencia;
  }

  const controle = new AbortController();
  const alarme = setTimeout(() => controle.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(`${BASE_URL}${caminho}`, {
      method: opcoes.metodo,
      headers: cabecalhos,
      body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined,
      signal: controle.signal,
    });

    const texto = await resposta.text();
    const dados = texto ? JSON.parse(texto) : null;

    if (!resposta.ok) {
      // A mensagem do gateway ajuda a diagnosticar, mas não deve vazar
      // crua pro aluno — quem chama decide o que mostrar.
      throw new AppError(
        `Mercado Pago respondeu ${resposta.status}: ${dados?.message ?? texto ?? "sem detalhe"}`,
        502
      );
    }

    return dados as T;
  } catch (erro) {
    if (erro instanceof AppError) throw erro;

    if (erro instanceof Error && erro.name === "AbortError") {
      throw new AppError("Mercado Pago não respondeu a tempo. Tente novamente.", 504);
    }

    throw new AppError("Falha ao falar com o Mercado Pago.", 502);
  } finally {
    clearTimeout(alarme);
  }
}

interface CriarPagamentoPixDTO {
  accessToken: string;
  valor: number;
  descricao: string;
  referenciaExterna: string;
  expiraEm?: Date | null;
  pagador: { email: string; nome?: string | null };
}

export async function criarPagamentoPix(
  dados: CriarPagamentoPixDTO
): Promise<PagamentoMercadoPago> {
  return chamar<PagamentoMercadoPago>("/v1/payments", {
    metodo: "POST",
    accessToken: dados.accessToken,
    // a referência externa é a mensalidade: é por ela que o webhook
    // reencontra o que dar baixa.
    chaveIdempotencia: `mensalidade-${dados.referenciaExterna}-${randomUUID()}`,
    corpo: {
      transaction_amount: Number(dados.valor.toFixed(2)),
      description: dados.descricao,
      payment_method_id: "pix",
      external_reference: dados.referenciaExterna,
      date_of_expiration: dados.expiraEm ? dados.expiraEm.toISOString() : undefined,
      payer: {
        email: dados.pagador.email,
        first_name: dados.pagador.nome ?? undefined,
      },
    },
  });
}

export async function consultarPagamento(
  id: string,
  accessToken: string
): Promise<PagamentoMercadoPago> {
  return chamar<PagamentoMercadoPago>(`/v1/payments/${id}`, { metodo: "GET", accessToken });
}

export async function estornarPagamento(id: string, accessToken: string): Promise<void> {
  await chamar(`/v1/payments/${id}/refunds`, {
    metodo: "POST",
    accessToken,
    chaveIdempotencia: `estorno-${id}`,
    corpo: {},
  });
}
