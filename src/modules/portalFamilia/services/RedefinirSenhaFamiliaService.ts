import { hash } from "bcryptjs";
import { z } from "zod";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { hashTokenRedefinicaoSenha } from "../../../shared/security/tokenRedefinicaoSenha";

const alvosSchema = z.object({
  responsavelIds: z.array(z.number().int().positive()),
  alunoIds: z.array(z.number().int().positive()),
}).refine((alvos) => alvos.responsavelIds.length + alvos.alunoIds.length > 0);

export class RedefinirSenhaFamiliaService {
  async execute(token: string, senha: string) {
    const prisma = prismaDaRequisicao();
    const registro = await prisma.tokenRedefinicaoSenha.findUnique({ where: { tokenHash: hashTokenRedefinicaoSenha(token) } });

    if (!registro || registro.tipo !== "FAMILIA" || registro.usadoEm || registro.expiraEm <= new Date()) {
      throw new AppError("Este link é inválido ou expirou. Solicite uma nova redefinição.", 400);
    }

    const alvos = alvosSchema.safeParse(registro.alvos);
    if (!alvos.success) throw new AppError("Este link é inválido ou expirou. Solicite uma nova redefinição.", 400);
    const senhaHash = await hash(senha, 10);

    await prisma.$transaction([
      prisma.responsavel.updateMany({ where: { id: { in: alvos.data.responsavelIds }, ativo: true }, data: { senhaPortal: senhaHash } }),
      prisma.aluno.updateMany({ where: { id: { in: alvos.data.alunoIds }, ativo: true }, data: { senhaPortal: senhaHash } }),
      prisma.tokenRedefinicaoSenha.update({ where: { id: registro.id }, data: { usadoEm: new Date() } }),
    ]);
  }
}
