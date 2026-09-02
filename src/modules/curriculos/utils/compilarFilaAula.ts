export const DURACAO_PADRAO_JOGO_SEGUNDOS = 360;
export const DURACAO_PADRAO_TECNICA_SEGUNDOS = 600;

export type TipoBlocoCompilado =
  | "AQUECIMENTO"
  | "JOGO"
  | "TECNICA"
  | "SPARRING"
  | "PAUSA"
  | "ALONGAMENTO";

interface TecnicaParaCompilar {
  id: number;
  nome: string;
  ordem: number;
  obrigatoria: boolean;
  duracaoPrevistaSegundos?: number | null;
}

interface BlocoParaCompilar {
  id: number;
  tipo: TipoBlocoCompilado;
  nome: string;
  ordem: number;
  duracaoPrevistaSegundos: number;
  rounds?: number | null;
  duracaoRoundSegundos?: number | null;
  descansoSegundos?: number | null;
  anuncio?: string | null;
}

interface AulaParaCompilar {
  jogosSugeridos?: string | null;
  tecnicas: TecnicaParaCompilar[];
  blocos?: BlocoParaCompilar[];
}

export interface BlocoAulaCompilado {
  chave: string;
  tipo: TipoBlocoCompilado;
  nome: string;
  ordem: number;
  duracaoPrevistaSegundos: number;
  obrigatoria: boolean;
  tecnicaId?: number;
  rounds?: number;
  duracaoRoundSegundos?: number;
  descansoSegundos?: number;
  anuncio?: string;
}

export interface FilaAulaCompilada {
  blocos: BlocoAulaCompilado[];
  duracaoTotalSegundos: number;
}

export function calcularDuracaoTurmaMinutos(inicio: string, fim: string) {
  const [hi, mi] = inicio.split(":").map(Number);
  const [hf, mf] = fim.split(":").map(Number);
  const inicial = hi * 60 + mi;
  const final = hf * 60 + mf;
  return final >= inicial ? final - inicial : 24 * 60 - inicial + final;
}

function duracaoDoBloco(bloco: BlocoParaCompilar) {
  if (bloco.tipo !== "SPARRING") return bloco.duracaoPrevistaSegundos;
  const rounds = Math.max(1, bloco.rounds ?? 1);
  const round = bloco.duracaoRoundSegundos ?? bloco.duracaoPrevistaSegundos;
  const descanso = bloco.descansoSegundos ?? 0;
  return rounds * round + Math.max(0, rounds - 1) * descanso;
}

export function compilarFilaAula(aula: AulaParaCompilar): FilaAulaCompilada {
  const blocosEstruturados = (aula.blocos ?? []).map<BlocoAulaCompilado>((bloco) => ({
    chave: `bloco:${bloco.id}`,
    tipo: bloco.tipo,
    nome: bloco.nome,
    ordem: bloco.ordem,
    duracaoPrevistaSegundos: duracaoDoBloco(bloco),
    obrigatoria: false,
    ...(bloco.rounds ? { rounds: bloco.rounds } : {}),
    ...(bloco.duracaoRoundSegundos ? { duracaoRoundSegundos: bloco.duracaoRoundSegundos } : {}),
    ...(bloco.descansoSegundos != null ? { descansoSegundos: bloco.descansoSegundos } : {}),
    ...(bloco.anuncio ? { anuncio: bloco.anuncio } : {}),
  }));

  const tecnicas = aula.tecnicas.map<BlocoAulaCompilado>((tecnica) => ({
    chave: `tecnica:${tecnica.id}`,
    tipo: "TECNICA",
    nome: tecnica.nome,
    ordem: tecnica.ordem,
    duracaoPrevistaSegundos: tecnica.duracaoPrevistaSegundos ?? DURACAO_PADRAO_TECNICA_SEGUNDOS,
    obrigatoria: tecnica.obrigatoria,
    tecnicaId: tecnica.id,
  }));

  const temJogosEstruturados = blocosEstruturados.some((bloco) => bloco.tipo === "JOGO");
  const jogosLegados = temJogosEstruturados
    ? []
    : (aula.jogosSugeridos ?? "")
        .split(",")
        .map((nome) => nome.trim())
        .filter(Boolean)
        .map<BlocoAulaCompilado>((nome, indice) => ({
          chave: `jogo-legado:${indice}`,
          tipo: "JOGO",
          nome,
          ordem: -1000 + indice,
          duracaoPrevistaSegundos: DURACAO_PADRAO_JOGO_SEGUNDOS,
          obrigatoria: false,
        }));

  const blocos = [...jogosLegados, ...blocosEstruturados, ...tecnicas]
    .sort((a, b) => a.ordem - b.ordem || a.chave.localeCompare(b.chave))
    .map((bloco, ordem) => ({ ...bloco, ordem }));

  return {
    blocos,
    duracaoTotalSegundos: blocos.reduce((total, bloco) => total + bloco.duracaoPrevistaSegundos, 0),
  };
}
