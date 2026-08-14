import { compare } from "bcryptjs";
import { SignOptions } from "jsonwebtoken";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { calcularIdade } from "../../mensagens/utils";
import { calcularEscopoFamilia } from "../utils/calcularEscopoFamilia";
import { assinarTokenDaRequisicao } from "../../../shared/tenant/tokenDaRequisicao";

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
    const prisma = prismaDaRequisicao();
    const responsaveis = await prisma.responsavel.findMany({
      where: { email, ativo: true },
      include: { aluno: true },
      omit: { senhaPortal: false },
    });

    let comoResponsavel = false;

    for (const responsavel of responsaveis) {
      if (responsavel.senhaPortal && (await compare(senha, responsavel.senhaPortal))) {
        comoResponsavel = true;
        break;
      }
    }

    const alunoProprio = await prisma.aluno.findFirst({
      where: { email, ativo: true },
      omit: { senhaPortal: false },
    });

    const comoAluno = Boolean(
      alunoProprio?.senhaPortal && (await compare(senha, alunoProprio.senhaPortal))
    );

    if (!comoResponsavel && !comoAluno) {
      throw new AppError("E-mail ou senha inválidos.");
    }

    const escopo = calcularEscopoFamilia({ comoAluno, comoResponsavel, alunoProprio, responsaveis });

    if (escopo.alunos.length === 0) {
      // a senha bateu, mas a regra de maioridade zerou o escopo — dá pra
      // explicar exatamente por quê, em vez de um genérico "acesso negado".
      if (comoAluno && alunoProprio && calcularIdade(alunoProprio.dataNascimento) < 18) {
        throw new AppError(
          "Alunos menores de 18 anos não acessam o portal diretamente. Peça a um responsável para acessar por ele."
        );
      }

      throw new AppError(
        "Os alunos vinculados a este acesso já são maiores de idade — eles agora acessam o portal com a própria conta."
      );
    }

    return this.gerarSessao({ email, comoAluno, comoResponsavel, escopo });
  }

  private gerarSessao(dados: {
    email: string;
    comoAluno: boolean;
    comoResponsavel: boolean;
    escopo: ReturnType<typeof calcularEscopoFamilia>;
  }) {
    const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

    const token = assinarTokenDaRequisicao(
      {
        email: dados.email,
        comoAluno: dados.comoAluno,
        comoResponsavel: dados.comoResponsavel,
      },
      {
        subject: dados.email,
        expiresIn: jwtExpiresIn,
      },
      "sysbelt-familia",
    );

    return {
      usuario: {
        tipo: dados.escopo.tipo,
        nome: dados.escopo.nome,
        email: dados.email,
      },
      alunos: dados.escopo.alunos.map((aluno) => ({
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
