import { compare } from "bcryptjs";
import { sign, SignOptions } from "jsonwebtoken";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

interface LoginFamiliaDTO {
  email: string;
  senha: string;
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const primeiras = [partes[0], partes[partes.length - 1]].filter(Boolean);
  return primeiras.map((parte) => parte[0]?.toUpperCase() ?? "").join("");
}

export class LoginFamiliaService {
  async execute({ email, senha }: LoginFamiliaDTO) {
    const responsaveis = await prisma.responsavel.findMany({
      where: { email, ativo: true },
      include: { aluno: true },
      omit: { senhaPortal: false },
    });

    for (const responsavel of responsaveis) {
      if (!responsavel.senhaPortal) continue;

      const senhaCorreta = await compare(senha, responsavel.senhaPortal);

      if (senhaCorreta) {
        return this.gerarSessao({
          tipo: "RESPONSAVEL",
          email,
          nome: responsavel.nome,
          alunos: responsaveis.map((item) => item.aluno),
        });
      }
    }

    const aluno = await prisma.aluno.findFirst({
      where: { email, ativo: true },
      omit: { senhaPortal: false },
    });

    if (aluno?.senhaPortal) {
      const senhaCorreta = await compare(senha, aluno.senhaPortal);

      if (senhaCorreta) {
        return this.gerarSessao({
          tipo: "ALUNO",
          email,
          nome: aluno.nome,
          alunos: [aluno],
        });
      }
    }

    throw new AppError("E-mail ou senha inválidos.");
  }

  private gerarSessao(dados: {
    tipo: "RESPONSAVEL" | "ALUNO";
    email: string;
    nome: string;
    alunos: { id: number; nome: string; apelido: string | null; fotoUrl: string | null }[];
  }) {
    const jwtSecret = process.env.JWT_SECRET as string;
    const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

    const token = sign(
      {
        tipo: dados.tipo,
        email: dados.email,
      },
      jwtSecret,
      {
        subject: dados.email,
        expiresIn: jwtExpiresIn,
      }
    );

    const alunosUnicos = Array.from(new Map(dados.alunos.map((aluno) => [aluno.id, aluno])).values());

    return {
      usuario: {
        tipo: dados.tipo,
        nome: dados.nome,
        email: dados.email,
      },
      alunos: alunosUnicos.map((aluno) => ({
        id: aluno.id,
        nome: aluno.nome,
        apelido: aluno.apelido,
        fotoUrl: aluno.fotoUrl,
        iniciais: iniciais(aluno.apelido || aluno.nome),
      })),
      token,
    };
  }
}
