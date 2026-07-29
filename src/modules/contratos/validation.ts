import { z } from "zod";

export const contratoSchema = z.object({
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
  modeloContratoId: z.coerce.number().int().positive("Informe o modelo de contrato."),
  planoId: z.coerce.number().int().positive().nullish(),
  formaPagamentoId: z.coerce.number().int().positive().nullish(),
  valor: z.coerce.number().positive("Informe um valor válido."),
  dataInicioVigencia: z.string().min(1, "Informe o início da vigência."),
  dataFimVigencia: z.string().nullish(),
  regrasCancelamento: z.string().nullish(),
  clausulas: z.string().nullish(),
  renovacaoAutomatica: z.boolean().nullish(),
});

export const alterarSituacaoContratoSchema = z.object({
  situacao: z.enum(
    ["RASCUNHO", "PENDENTE_ASSINATURA", "ATIVO", "SUSPENSO", "CANCELADO", "ENCERRADO"],
    { message: "Situação inválida." }
  ),
  motivoCancelamento: z.string().nullish(),
});

export const registrarAssinaturaSchema = z.object({
  tipoAssinatura: z.enum(["DIGITAL", "ELETRONICA", "PRESENCIAL"], { message: "Tipo de assinatura inválido." }),
  contratoAssinadoUrl: z.string().nullish(),
});

export const renovarContratoSchema = z.object({
  dataInicioVigencia: z.string().nullish(),
  dataFimVigencia: z.string().nullish(),
  valor: z.coerce.number().positive().nullish(),
});
