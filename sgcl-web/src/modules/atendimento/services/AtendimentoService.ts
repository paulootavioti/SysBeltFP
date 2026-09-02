import { ApiClient } from "../../../shared/api/ApiClient";
import { api } from "../../../services/api";
import type { CanalBot, CanalMensageria, ConversaDetalhe, EstadoConversa, FluxoBot, PaginaConversas, PassoFluxoBot, TemplateMensageria } from "../types";

export class AtendimentoService {
  static listar(filtros: { busca?: string; canal?: CanalMensageria; estado?: EstadoConversa; naoLidas?: boolean } = {}) {
    const params = new URLSearchParams();
    if (filtros.busca) params.set("busca", filtros.busca);
    if (filtros.canal) params.set("canal", filtros.canal);
    if (filtros.estado) params.set("estado", filtros.estado);
    if (filtros.naoLidas) params.set("naoLidas", "true");
    return ApiClient.get<PaginaConversas>(`/mensageria/conversas?${params}`);
  }
  static obter(id: number) { return ApiClient.get<ConversaDetalhe>(`/mensageria/conversas/${id}`); }
  static responder(id: number, conteudo: string, templateId?: number, parametros: string[] = []) { return ApiClient.post(`/mensageria/conversas/${id}/mensagens`, templateId ? { templateId, parametros } : { conteudo }); }
  static listarTemplates(canalId: number, todos = false) { return ApiClient.get<TemplateMensageria[]>(`/mensageria/templates?canalId=${canalId}${todos ? "&todos=true" : ""}`); }
  static sincronizarTemplates(canalId: number) { return ApiClient.post<{ encontrados: number; aprovados: number }>(`/mensageria/canais-mensageria/${canalId}/templates/sincronizar`, {}); }
  static reenviarMensagem(id: number) { return ApiClient.post(`/mensageria/mensagens/${id}/reenviar`, {}); }
  static async enviarAnexo(id: number, arquivo: File, legenda?: string) { const form = new FormData(); form.append("arquivo", arquivo); if (legenda?.trim()) form.append("legenda", legenda.trim()); return (await api.post(`/mensageria/conversas/${id}/anexos`, form)).data; }
  static assumir(id: number) { return ApiClient.post(`/mensageria/conversas/${id}/assumir`, {}); }
  static encerrar(id: number) { return ApiClient.post(`/mensageria/conversas/${id}/encerrar`, {}); }
  static converterLead(id: number, dataNascimento?: string) { return ApiClient.post<{ alunoId: number; reativado: boolean }>(`/leads/${id}/converter`, { dataNascimento: dataNascimento || undefined }); }
  static agendarExperimental(id: number, data: string) { return ApiClient.post(`/leads/${id}/experimental`, { data }); }
  static atualizarEstagio(id: number, estagio: string) { return ApiClient.post(`/leads/${id}/estagio`, { estagio }); }
  static obterFluxoBot() { return ApiClient.get<FluxoBot>("/mensageria/bot/fluxos"); }
  static publicarFluxoBot(nome: string, passos: PassoFluxoBot[]) { return ApiClient.put<FluxoBot>("/mensageria/bot/fluxos", { nome, passos }); }
  static listarCanaisBot() { return ApiClient.get<CanalBot[]>("/mensageria/canais-mensageria"); }
  static conectarCanalMeta(dados: { tipo: CanalMensageria; identificadorExterno: string; codigo: string; businessAccountId?: string }) { return ApiClient.post("/mensageria/canais-mensageria/meta", dados); }
  static desativarCanalMeta(id: number) { return ApiClient.delete(`/mensageria/canais-mensageria/${id}`); }
  static diagnosticarCanalMeta(id: number) { return ApiClient.post(`/mensageria/canais-mensageria/${id}/diagnosticar`, {}); }
}
