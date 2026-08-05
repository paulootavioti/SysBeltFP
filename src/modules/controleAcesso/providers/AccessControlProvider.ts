// Camada de abstração de controle de acesso físico (catraca/leitora) — mesmo
// espírito de pagamentos/gateways e assinaturaEletronica/providers.
//
// A ideia: o Sys Belt é o dono do CADASTRO e das REGRAS (quem pode entrar, em
// que horário, com mensalidade em dia). O equipamento é dono do RECONHECIMENTO
// (face, biometria, cartão, QR). Nenhum service de negócio conhece marca de
// catraca: todos falam com um AccessControlProvider.
//
// Isso cobre os dois modelos de mercado sem mudar as regras:
//
//  - Equipamento "inteligente" (Control iD, Henry, Intelbras, Hikvision,
//    ZKTeco): guarda os templates e decide localmente. O sistema sincroniza
//    pessoas/credenciais e recebe os eventos depois.
//  - Equipamento "burro" (só leitora + relé): consulta o servidor a cada
//    passagem. Aí o próprio `autorizar` do motor de regras responde na hora.

export type TipoCredencial = "FACIAL" | "BIOMETRIA" | "CARTAO" | "QRCODE" | "PIN";

export type SentidoAcesso = "ENTRADA" | "SAIDA";

/** Pessoa a ser cadastrada no equipamento. */
export interface PessoaAcessoDTO {
  /** id no Sys Belt, usado para correlacionar o evento de volta. */
  referenciaExterna: string;
  nome: string;
  /** foto em base64 — ponto de partida do cadastro facial, quando o equipamento aceita. */
  fotoBase64?: string | null;
  credenciais: Array<{ tipo: TipoCredencial; valor?: string | null }>;
  /** null = sem data de expiração (enquanto a matrícula estiver ativa). */
  validoAte?: Date | null;
}

export interface SincronizarPessoaResultado {
  /** id da pessoa no equipamento — guardado para updates/remoções posteriores. */
  provedorPessoaId: string;
}

/** Evento bruto vindo do equipamento, já normalizado pelo provider. */
export interface EventoAcessoNormalizado {
  provedorEventoId?: string | null;
  referenciaExterna?: string | null;
  provedorPessoaId?: string | null;
  tipoCredencial: TipoCredencial | null;
  sentido: SentidoAcesso;
  autorizado: boolean;
  motivo?: string | null;
  ocorridoEm: Date;
  /** payload original, guardado para auditoria e depuração da integração. */
  payload: unknown;
}

export interface ComandoAberturaResultado {
  aceito: boolean;
  detalhe?: string;
}

export interface AccessControlProvider {
  readonly nome: string;

  /** true quando o equipamento decide localmente (só recebe eventos depois). */
  readonly decideLocalmente: boolean;

  /** Cria/atualiza a pessoa e suas credenciais no equipamento. */
  sincronizarPessoa(
    dados: PessoaAcessoDTO,
    configuracao: Record<string, unknown>
  ): Promise<SincronizarPessoaResultado>;

  /** Remove a pessoa do equipamento (aluno inativado, credencial revogada). */
  removerPessoa(provedorPessoaId: string, configuracao: Record<string, unknown>): Promise<void>;

  /** Traduz o payload do fabricante para o formato único do sistema. */
  normalizarEvento(payload: unknown): EventoAcessoNormalizado;

  /** Abertura remota (recepção liberando manualmente pelo sistema). */
  abrirRemotamente(
    configuracao: Record<string, unknown>,
    sentido: SentidoAcesso
  ): Promise<ComandoAberturaResultado>;
}

export class ProvedorAcessoNaoImplementadoError extends Error {
  constructor(nomeProvedor: string) {
    super(`Integração com a catraca ${nomeProvedor} ainda não implementada.`);
  }
}
