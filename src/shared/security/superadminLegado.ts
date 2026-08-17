import { AppError } from "../errors/AppError";

export function superadminLegadoPodeAcessar(
  perfil: string,
  _env: NodeJS.ProcessEnv = process.env,
): boolean {
  return perfil !== "SUPERADMIN";
}

export function garantirAcessoSuperadminLegado(
  perfil: string,
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (!superadminLegadoPodeAcessar(perfil, env)) {
    throw new AppError("Operadores da plataforma devem acessar o Control Plane.", 403);
  }
}
