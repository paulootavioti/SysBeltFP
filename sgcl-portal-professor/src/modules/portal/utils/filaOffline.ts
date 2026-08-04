// Fila local de ações que falharam por falta de conexão (tatame com sinal
// ruim) — guardada como dados simples (serializáveis), não como closures,
// pra sobreviver a um reload da página. Sincronizada de novo assim que a
// conexão volta (ver hooks/useSincronizarFila.ts).
export interface AcaoPendente {
  id: string;
  tipo: "presenca" | "tecnica" | "observacao";
  aulaId: number;
  payload: Record<string, unknown>;
  criadoEm: number;
}

const CHAVE = "@portalProfessor:filaOffline";

export function lerFila(): AcaoPendente[] {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "[]") as AcaoPendente[];
  } catch {
    return [];
  }
}

function salvarFila(fila: AcaoPendente[]) {
  localStorage.setItem(CHAVE, JSON.stringify(fila));
}

export function enfileirar(acao: Omit<AcaoPendente, "id" | "criadoEm">) {
  const fila = lerFila();
  fila.push({ ...acao, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, criadoEm: Date.now() });
  salvarFila(fila);
  return fila;
}

export function removerDaFila(id: string) {
  const fila = lerFila().filter((item) => item.id !== id);
  salvarFila(fila);
  return fila;
}
