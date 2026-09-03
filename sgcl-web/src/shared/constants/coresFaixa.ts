export type CorFaixaPorModalidade = Record<string, Record<string, string>>;

// A fonte é o catálogo recebido do backend. Este mapa nunca contém cores
// predefinidas, pois cada modalidade controla a própria graduação.
export const CORES_FAIXA: CorFaixaPorModalidade = {};

export function resolverCorFaixa(corPersistida?: string | null) {
  return corPersistida?.match(/^#[0-9a-f]{6}$/i) ? corPersistida : undefined;
}
