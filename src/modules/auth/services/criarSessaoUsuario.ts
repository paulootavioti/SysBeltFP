import type { Unidade, Usuario } from "@prisma/client";
import type { SignOptions } from "jsonwebtoken";
import { assinarTokenDaRequisicao } from "../../../shared/tenant/tokenDaRequisicao";

export type UsuarioComUnidade = Usuario & { unidade: Unidade | null };

export function criarSessaoUsuario(usuario: UsuarioComUnidade) {
  const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];
  const token = assinarTokenDaRequisicao(
    { perfil: usuario.perfil, tipo: "sessao" },
    { subject: String(usuario.id), expiresIn: jwtExpiresIn },
    "sysbelt-web",
  );
  const semUnidadeFixa = usuario.perfil === "DONO";

  return {
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      unidadeId: semUnidadeFixa ? null : usuario.unidadeId,
      unidadeNome: semUnidadeFixa ? null : (usuario.unidade?.nome ?? null),
    },
    token,
  };
}
