export type CanalMensageria = "WHATSAPP" | "INSTAGRAM";
export type EstadoConversa = "ABERTA" | "BOT_EM_ANDAMENTO" | "AGUARDANDO_EQUIPE" | "EM_ATENDIMENTO" | "AGUARDANDO_CONTATO" | "ENCERRADA";
export type StatusMensagem = "RECEBIDA" | "PENDENTE" | "ENVIADA" | "ENTREGUE" | "LIDA" | "FALHOU";

export interface ConversaResumo {
  id: number; unidadeId: number; contatoNome: string | null; contatoExternoId: string;
  estado: EstadoConversa; naoLidas: number; ultimaMensagemEm: string | null;
  canalMensageria: { id?: number; tipo: CanalMensageria; nomeExibicao: string };
  lead: { id: number; estagio: string } | null; atendente: { id: number; nome: string } | null;
  mensagens: Array<{ conteudo: string | null; tipoConteudo: string }>;
}

export interface MensagemAtendimento {
  id: number; direcao: "ENTRADA" | "SAIDA"; autor: "CONTATO" | "BOT" | "ATENDENTE" | "SISTEMA";
  usuario: { id: number; nome: string } | null; conteudo: string | null; tipoConteudo: string;
  statusEntrega: StatusMensagem; erroEnvio: string | null; tentativasEnvio: number; proximaTentativaEm: string | null; enviadaEm: string;
  mediaStatus: string | null; arquivoUrl: string | null; arquivoMime: string | null; arquivoNome: string | null; arquivoTamanho: number | null; erroMedia: string | null;
}

export interface ConversaDetalhe extends Omit<ConversaResumo, "mensagens" | "lead"> {
  mensagens: MensagemAtendimento[];
  janelaAtendimentoAte: string | null; janelaAtendimentoAberta: boolean;
  lead: null | { id: number; nome: string; telefoneE164: string; tipoContato: string; praticanteNome: string | null;
    situacao: string; turnoPreferido: string[]; estagio: string; proximaAcaoEm: string | null; alunoId: number | null; slaEstourado: boolean;
    canal: { nome: string }; consentimentos: Array<{ finalidade: string; textoAceito: string; versao: string; aceitoEm: string; revogadoEm: string | null }>;
    eventos: Array<{ id: number; tipo: string; descricao: string; criadoEm: string; usuario: { nome: string } | null }> };
}

export interface PaginaConversas { itens: ConversaResumo[]; pagina: number; limite: number; total: number; totalPaginas: number; }
export interface TemplateMensageria { id: number; canalMensageriaId: number; nome: string; idioma: string; textoExibicao: string; status: string; categoria: string | null; quantidadeParametros: number; suportado: boolean; sincronizadoEm: string | null; }

export interface PassoFluxoBot {
  id: string; tipo: "TEXTO_LIVRE" | "BOTOES" | "CONDICIONAL" | "AUTOMATICO";
  campo?: string; texto: string; opcoes?: string[]; regra?: string;
}
export interface FluxoBot { id: number; nome: string; versao: string; ativo: boolean; passos: PassoFluxoBot[]; atualizadoEm: string; }
export type StatusConexaoMeta = "PENDENTE" | "VALIDANDO" | "CONECTADO" | "ERRO" | "INATIVO";
export interface CanalBot { id: number; tipo: CanalMensageria; nomeExibicao: string; conta: string; status: StatusConexaoMeta; codigoErro: string | null; leadsUltimos30Dias: number; atualizadoEm: string; validadoEm: string | null; sincronizadoEm: string | null; tokenExpiraEm: string | null; proximaRenovacaoEm: string | null; ultimoDiagnosticoEm: string | null; tokenVersao: number; }
