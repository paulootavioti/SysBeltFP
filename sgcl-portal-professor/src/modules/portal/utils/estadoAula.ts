// Persistência mínima pra nunca perder o estado da aula ao recarregar a
// página ou receber ligação — só aulaId, etapa atual e o instante de
// início do cronômetro (o resto vem de novo da API ao montar a tela).
const CHAVE = "@portalProfessor:aulaEmAndamento";

export interface EstadoAula {
  aulaId: number;
  etapa: number;
  iniciadoEm: number;
  timer?: EstadoTimerAula;
}

export interface EstadoTimerAula {
  indiceAtual: number;
  restanteSegundos: number;
  rodando: boolean;
  atualizadoEm: number;
  iniciadoBlocoEm: number;
  chavesConcluidas: string[];
  pausaVoz?: { chave: string; duracaoSegundos: number; restanteSegundos: number; iniciadoEm: number; avisoAntesFimSegundos: number | null };
}

export function lerEstadoAula(aulaId: number): EstadoAula | null {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE) ?? "null") as EstadoAula | null;
    return dados && dados.aulaId === aulaId ? dados : null;
  } catch {
    return null;
  }
}

export function salvarEstadoAula(estado: EstadoAula) {
  localStorage.setItem(CHAVE, JSON.stringify(estado));
}

export function salvarEstadoTimerAula(aulaId: number, timer: EstadoTimerAula) {
  const atual = lerEstadoAula(aulaId);
  if (atual) salvarEstadoAula({ ...atual, timer });
}

export function limparEstadoAula(aulaId: number) {
  const atual = lerEstadoAula(aulaId);
  if (atual) {
    localStorage.removeItem(CHAVE);
  }
}
