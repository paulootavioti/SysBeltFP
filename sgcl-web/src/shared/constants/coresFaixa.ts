export type CorFaixaPorModalidade = Record<string, Record<string, string>>;

// Referência transitória para dados ainda não migrados. Cores persistidas
// em Graduacao.cor sempre têm precedência sobre este catálogo.
export const CORES_FAIXA: CorFaixaPorModalidade = {
  "Jiu-Jitsu": {
    Branca: "#ffffff", Cinza: "#8f8f8f", Amarela: "#f2c500",
    Laranja: "#e8720c", Verde: "#1c7c3c", Azul: "#1552a8",
    Roxa: "#5b2a86", Marrom: "#5a3a22", Preta: "#141414",
    Coral: "#e5544b", Vermelha: "#c81e1e",
  },
};

export function resolverCorFaixa(corPersistida?: string | null) {
  return corPersistida?.match(/^#[0-9a-f]{6}$/i) ? corPersistida : undefined;
}
