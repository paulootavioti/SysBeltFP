import { ApiClient } from "../../shared/api/ApiClient";

export type AcaoVoz = "INICIAR" | "PAUSAR" | "AVANCAR" | "CONSULTAR" | "BLOCO_PAUSA";
export interface ComandoVoz { id: number; gatilho: string; resposta: string; acao: AcaoVoz; duracaoBlocoSegundos: number | null; avisoAntesFimSegundos: number | null; doSistema: boolean }
export interface ArenaVoz { id: number; nome: string; pareamentoVoz: { id: number; consentidoEm: string; revogadoEm: string | null } | null }
export interface DadosComando { gatilho: string; resposta: string; acao: AcaoVoz; duracaoBlocoSegundos: number | null; avisoAntesFimSegundos: 10 | 30 | null }

export class ComandosVozService {
  static listar() { return ApiClient.get<{ comandos: ComandoVoz[]; arenas: ArenaVoz[] }>("/comandos-voz"); }
  static criar(dados: DadosComando) { return ApiClient.post<ComandoVoz>("/comandos-voz", dados); }
  static atualizar(id: number, dados: DadosComando) { return ApiClient.put<ComandoVoz>(`/comandos-voz/${id}`, dados); }
  static parear(arenaId: number) { return ApiClient.post<{ tokenPareamento: string }>("/comandos-voz/pareamentos", { arenaId, consentiu: true }); }
  static testar(id: number, arenaId: number) { return ApiClient.post<{ resposta: string }>(`/comandos-voz/${id}/testar`, { arenaId }); }
}
