import { prismaDaRequisicao } from "../database/prismaDaRequisicao";
import { AppError } from "../errors/AppError";
import { DiretorioControlPlane, DiretorioIndisponivelError, slugDoHostname } from "./DiretorioControlPlane";

let diretorio: DiretorioControlPlane | undefined;

function habilitado() { return process.env.CONTROL_PLANE_DIRECTORY_MULTIPRODUCT_ENABLED === "true"; }
function cliente() {
  return diretorio ??= new DiretorioControlPlane(
    process.env.CONTROL_PLANE_URL?.trim() || "",
    process.env.CONTROL_PLANE_SYSBELT_CREDENTIAL?.trim() || "",
    process.env.CONTROL_PLANE_CREDENTIAL_VERSION?.trim() || "v1",
  );
}

export async function exigirAcessoControlPlane(hostname: string, tenantKey: string, agora = new Date()) {
  if (!habilitado()) return;
  const slug = slugDoHostname(hostname, (process.env.SYSBELT_TENANT_DOMAINS || "").split(","));
  if (!slug) throw new AppError("Tenant não identificado.", 404);
  try {
    const remoto = await cliente().resolver(slug);
    if (!remoto || remoto.tenantKey !== tenantKey) throw new AppError("Tenant não encontrado.", 404);
    if (remoto.status !== "ATIVO" || remoto.acesso.administrativo !== "LIBERADO") {
      throw new AppError("Acesso restrito. Regularize a assinatura da plataforma.", 403);
    }
  } catch (erro) {
    if (!(erro instanceof DiretorioIndisponivelError)) throw erro;
    const concessao = await prismaDaRequisicao().concessaoPlataforma.findUnique({ where: { tenantKey },
      select: { statusAcesso: true, expiraEm: true } });
    if (!concessao || concessao.statusAcesso !== "ATIVO" || concessao.expiraEm <= agora) {
      throw new AppError("Não foi possível validar o acesso da plataforma.", 503);
    }
  }
}

export function limparClienteDiretorioParaTeste() { diretorio = undefined; }
