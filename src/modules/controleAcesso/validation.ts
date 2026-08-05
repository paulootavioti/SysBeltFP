import { z } from "zod";

export const dispositivoAcessoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do dispositivo."),
  localizacao: z.string().max(200).optional().nullable(),
  provedor: z.string().max(40).optional().nullable(),
  configuracao: z.record(z.string(), z.unknown()).optional().nullable(),
  segredoWebhook: z.string().max(200).optional().nullable(),
  ativo: z.boolean().optional(),
});

export const credencialAcessoSchema = z
  .object({
    alunoId: z.coerce.number().int().positive().optional(),
    usuarioId: z.coerce.number().int().positive().optional(),
    dispositivoId: z.coerce.number().int().positive().optional().nullable(),
    tipo: z.enum(["FACIAL", "BIOMETRIA", "CARTAO", "QRCODE", "PIN"]),
    valor: z.string().max(200).optional().nullable(),
    validoAte: z.coerce.date().optional().nullable(),
  })
  .refine((dados) => Boolean(dados.alunoId) !== Boolean(dados.usuarioId), {
    message: "Informe exatamente um entre alunoId e usuarioId.",
  });

// O corpo do evento é livre: cada fabricante manda o seu formato, e quem
// traduz é o provider do dispositivo (normalizarEvento).
export const eventoAcessoSchema = z.record(z.string(), z.unknown());
