export type SituacaoContrato =
  | "RASCUNHO"
  | "PENDENTE_ASSINATURA"
  | "ASSINADO"
  | "ATIVO"
  | "SUSPENSO"
  | "CANCELADO"
  | "ENCERRADO"
  | "RENOVADO";

export const SITUACAO_CONTRATO_LABEL: Record<SituacaoContrato, string> = {
  RASCUNHO: "Rascunho",
  PENDENTE_ASSINATURA: "Pendente de assinatura",
  ASSINADO: "Assinado",
  ATIVO: "Ativo",
  SUSPENSO: "Suspenso",
  CANCELADO: "Cancelado",
  ENCERRADO: "Encerrado",
  RENOVADO: "Renovado",
};

export type TipoAssinaturaContrato = "DIGITAL" | "ELETRONICA" | "PRESENCIAL";

export const TIPO_ASSINATURA_LABEL: Record<TipoAssinaturaContrato, string> = {
  DIGITAL: "Assinatura digital",
  ELETRONICA: "Assinatura eletrônica",
  PRESENCIAL: "Assinatura presencial (tablet ou computador)",
};

export interface Contrato {
  id: number;
  unidadeId: number;
  numero: number;

  alunoId: number;
  contratanteResponsavelId?: number | null;

  modeloContratoId: number;
  planoId?: number | null;
  formaPagamentoId?: number | null;

  valor: number;

  dataInicioVigencia: string;
  dataFimVigencia?: string | null;

  regrasCancelamento?: string | null;
  clausulas?: string | null;

  conteudoGerado: string;

  situacao: SituacaoContrato;

  tipoAssinatura?: TipoAssinaturaContrato | null;
  assinadoEm?: string | null;
  contratoAssinadoUrl?: string | null;

  renovacaoAutomatica: boolean;

  contratoAnteriorId?: number | null;
  canceladoEm?: string | null;
  motivoCancelamento?: string | null;
  encerradoEm?: string | null;

  createdAt: string;
  updatedAt: string;

  aluno?: { id: number; nome: string; dataNascimento?: string };
  contratanteResponsavel?: { id: number; nome: string; cpf?: string | null } | null;
  modeloContrato?: { id: number; nome: string; versao: number };
  plano?: { id: number; nome: string } | null;
  formaPagamento?: { id: number; tipo: string; nomePersonalizado?: string | null } | null;
  contratoAnterior?: { id: number; numero: number; situacao: SituacaoContrato } | null;
  renovacoes?: { id: number; numero: number; situacao: SituacaoContrato; createdAt: string }[];
}
