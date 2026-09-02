import { api } from "../../../services/api";
import type {
  Agenda,
  Frequencia,
  ItemCarrinho,
  Mensagem,
  Mensalidade,
  NaoLidasPorAluno,
  Pedido,
  Produto,
  Resumo,
  ResultadoPagamento,
  ContratoFamilia,
  ConsentimentoFamilia,
} from "../types";

export class PortalService {
  static async resumo(alunoId: number) {
    const response = await api.get<Resumo>(`/portal-familia/resumo/${alunoId}`);
    return response.data;
  }

  static async frequencia(alunoId: number) {
    const response = await api.get<Frequencia[]>(`/portal-familia/frequencia/${alunoId}`);
    return response.data;
  }

  static async mensalidades(alunoId: number) {
    const response = await api.get<Mensalidade[]>(`/portal-familia/mensalidades/${alunoId}`);
    return response.data;
  }

  static async pagarMensalidade(mensalidadeId: number, alunoId: number) {
    const response = await api.post<ResultadoPagamento>(`/portal-familia/mensalidades/${mensalidadeId}/pagar`, {
      alunoId,
    });
    return response.data;
  }

  static async agenda(alunoId: number) {
    const response = await api.get<Agenda[]>(`/portal-familia/agenda/${alunoId}`);
    return response.data;
  }

  static async listarMensagens(alunoId: number) {
    const response = await api.get<Mensagem[]>(`/portal-familia/mensagens/${alunoId}`);
    return response.data;
  }

  static async enviarMensagem(alunoId: number, texto: string) {
    const response = await api.post<Mensagem>("/portal-familia/mensagens", { alunoId, texto });
    return response.data;
  }

  static async mensagensNaoLidas() {
    const response = await api.get<NaoLidasPorAluno[]>("/portal-familia/mensagens-nao-lidas");
    return response.data;
  }

  static async loja(alunoId: number) {
    const response = await api.get<Produto[]>(`/portal-familia/loja/${alunoId}`);
    return response.data;
  }

  static async criarPedido(alunoId: number, itens: ItemCarrinho[], formaPagamentoId?: number) {
    const response = await api.post<Pedido>("/portal-familia/loja/pedidos", { alunoId, itens, formaPagamentoId });
    return response.data;
  }

  static async pagarPedido(pedidoId: number, alunoId: number) {
    const response = await api.post<Pedido>(`/portal-familia/loja/pedidos/${pedidoId}/pagar`, { alunoId });
    return response.data;
  }

  static async listarPedidos(alunoId: number) {
    const response = await api.get<Pedido[]>(`/portal-familia/loja/pedidos/${alunoId}`);
    return response.data;
  }

  static async contratos(alunoId: number) {
    const response = await api.get<ContratoFamilia[]>(`/portal-familia/contratos/${alunoId}`);
    return response.data;
  }

  static async alterarSenha(senhaAtual: string, novaSenha: string) {
    await api.patch("/portal-familia/conta/senha", { senhaAtual, novaSenha });
  }

  static async consentimentos(alunoId: number) {
    const response = await api.get<ConsentimentoFamilia[]>(`/portal-familia/privacidade/${alunoId}/consentimentos`);
    return response.data;
  }

  static async revogarConsentimento(id: number) {
    await api.patch(`/portal-familia/privacidade/consentimentos/${id}/revogar`);
  }
}
