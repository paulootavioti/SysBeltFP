import type { AccessControlProvider } from "./AccessControlProvider";
import { ManualAccessControlProvider } from "./ManualAccessControlProvider";
import { ControlIdProvider } from "./ControlIdProvider";
import { HenryProvider } from "./HenryProvider";
import { IntelbrasProvider } from "./IntelbrasProvider";
import { HikvisionProvider } from "./HikvisionProvider";
import { ZKTecoProvider } from "./ZKTecoProvider";
import { ToletusProvider } from "./ToletusProvider";
import { MadisProvider } from "./MadisProvider";

export type {
  AccessControlProvider,
  EventoAcessoNormalizado,
  PessoaAcessoDTO,
  SentidoAcesso,
  TipoCredencial,
} from "./AccessControlProvider";
export { ProvedorAcessoNaoImplementadoError } from "./AccessControlProvider";

// Fabricantes previstos. Acrescentar um novo é criar a classe (herdando de
// StubAccessControlProvider) e registrar aqui — nenhum service de negócio muda.
export type NomeProvedorAcesso =
  | "CONTROL_ID"
  | "HENRY"
  | "INTELBRAS"
  | "HIKVISION"
  | "ZKTECO"
  | "TOLETUS"
  | "MADIS";

const PROVEDORES: Record<NomeProvedorAcesso, () => AccessControlProvider> = {
  CONTROL_ID: () => new ControlIdProvider(),
  HENRY: () => new HenryProvider(),
  INTELBRAS: () => new IntelbrasProvider(),
  HIKVISION: () => new HikvisionProvider(),
  ZKTECO: () => new ZKTecoProvider(),
  TOLETUS: () => new ToletusProvider(),
  MADIS: () => new MadisProvider(),
};

// Ponto único de escolha do equipamento. Sem provedor configurado (nenhuma
// catraca instalada ainda), cai no manual — a recepção libera e o sistema
// registra a entrada do mesmo jeito.
export function obterProvedorAcesso(nomeProvedor?: string | null): AccessControlProvider {
  if (!nomeProvedor) {
    return new ManualAccessControlProvider();
  }

  const fabrica = PROVEDORES[nomeProvedor as NomeProvedorAcesso];

  return fabrica ? fabrica() : new ManualAccessControlProvider();
}
