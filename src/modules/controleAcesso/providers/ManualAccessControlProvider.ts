import { randomUUID } from "crypto";

import type {
  AccessControlProvider,
  ComandoAberturaResultado,
  EventoAcessoNormalizado,
  PessoaAcessoDTO,
  SentidoAcesso,
  SincronizarPessoaResultado,
} from "./AccessControlProvider";

// Provedor padrão — é o que roda enquanto não há catraca instalada, ou quando
// a academia opta por liberar na recepção. Não conversa com equipamento
// nenhum: o registro de entrada é feito pelo sistema, e o motor de regras
// (AutorizarAcessoService) continua valendo igual.
//
// Serve também de referência mínima do contrato: qualquer provider real
// precisa responder a estes mesmos métodos.
export class ManualAccessControlProvider implements AccessControlProvider {
  readonly nome = "Manual (recepção)";

  // sem equipamento, quem decide é sempre o servidor.
  readonly decideLocalmente = false;

  async sincronizarPessoa(dados: PessoaAcessoDTO): Promise<SincronizarPessoaResultado> {
    // não há equipamento pra cadastrar — devolve um id local só pra manter o
    // mesmo contrato de retorno dos providers reais.
    return { provedorPessoaId: `manual-${dados.referenciaExterna}-${randomUUID().slice(0, 8)}` };
  }

  async removerPessoa(): Promise<void> {
    // nada a fazer: não há equipamento com cadastro pra limpar.
  }

  normalizarEvento(payload: unknown): EventoAcessoNormalizado {
    // Liberação manual registrada pela recepção pelo próprio sistema: quem
    // registra escolhe a pessoa na tela, então o payload já traz a
    // identificação. Sem ela o evento entra como "não identificada" e o motor
    // de regras nega — que é o comportamento correto.
    const dados = (payload ?? {}) as Record<string, unknown>;

    const referenciaExterna =
      dados.referenciaExterna != null
        ? String(dados.referenciaExterna)
        : dados.alunoId != null
          ? String(dados.alunoId)
          : null;

    return {
      referenciaExterna,
      provedorPessoaId: dados.provedorPessoaId != null ? String(dados.provedorPessoaId) : null,
      tipoCredencial: null,
      sentido: dados.sentido === "SAIDA" ? "SAIDA" : "ENTRADA",
      autorizado: true,
      motivo: "Liberado manualmente na recepção",
      ocorridoEm: new Date(),
      payload,
    };
  }

  async abrirRemotamente(
    _configuracao: Record<string, unknown>,
    _sentido: SentidoAcesso
  ): Promise<ComandoAberturaResultado> {
    return { aceito: true, detalhe: "Liberação manual — nenhum equipamento acionado." };
  }
}
