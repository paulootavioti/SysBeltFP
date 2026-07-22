import { prisma } from "../../../shared/database/prisma";
import { compare } from "bcryptjs";
import { sign, SignOptions } from "jsonwebtoken";
import { AppError } from "../../../shared/errors/AppError";

interface LoginDTO {
  email: string;
  senha: string;
}

export class LoginService {

  async execute({
    email,
    senha
  }: LoginDTO) {

    const usuario =
      await prisma.usuario.findUnique({
        where: {
          email
        }
      });

    if (!usuario) {
      throw new AppError(
        "Usuário ou senha inválidos."
      );
    }

    if (!usuario.ativo) {
      throw new AppError(
        "Usuário inativo.",
        403
      );
    }

    const senhaCorreta =
      await compare(
        senha,
        usuario.senha
      );

    if (!senhaCorreta) {
      throw new AppError(
        "Usuário ou senha inválidos."
      );
    }
// Antes de validar a senha
//if (!usuario.ativo) {
//   throw new AppError(
//     "Usuário inativo."
//   );
// }
    const jwtSecret =
      process.env.JWT_SECRET as string;

    // Sem refresh token de propósito: ensureAuthenticated já revalida o
    // usuário (existência + ativo) no banco a cada requisição, então um
    // token vazado só é útil até um admin desativar a conta em Usuários —
    // não até a expiração natural. Se quiser uma janela mais curta,
    // ajuste JWT_EXPIRES_IN nas variáveis de ambiente (não precisa mexer
    // no código).
    const jwtExpiresIn =
      (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

    const token = sign(
      {
        perfil: usuario.perfil
      },
        jwtSecret,
      {
        subject: String(usuario.id),
        expiresIn: jwtExpiresIn
      }
    );

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil
      },
      token
    };

  }

}