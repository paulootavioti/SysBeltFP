import { AppError } from "../errors/AppError";

export function superadminLegadoPodeAcessar(
  perfil: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return perfil !== "SUPERADMIN" || env.LEGACY_SUPERADMIN_ACCESS_ENABLED === "true";
}

export function garantirAcessoSuperadminLegado(
  perfil: string,
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (!superadminLegadoPodeAcessar(perfil, env)) {
    throw new AppError("Operadores da plataforma devem acessar o Control Plane.", 403);
  }
}

export function garantirConcessaoSuperadminPermitida(
  perfilDesejado: unknown,
  perfilAtor: string,
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (perfilDesejado !== "SUPERADMIN") return;

  if (env.LEGACY_SUPERADMIN_MANAGEMENT_ENABLED !== "true") {
    throw new AppError("A concessão de SUPERADMIN foi desativada no Tenant Plane.", 403);
  }

  if (perfilAtor !== "SUPERADMIN") {
    throw new AppError("Apenas um superadmin pode conceder esse perfil.", 403);
  }
}
