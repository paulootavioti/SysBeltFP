// A suíte roda no ambiente `node` do Vitest, que não tem `localStorage`.
// Em vez de trazer jsdom só por causa de um Storage, instalamos um em memória
// — a sessão usa apenas getItem/setItem/removeItem, e um objeto simples cobre
// isso sem nenhuma dependência nova.
export function instalarLocalStorageDeTeste() {
  let dados: Record<string, string> = {};

  const fake: Storage = {
    get length() {
      return Object.keys(dados).length;
    },
    key: (indice) => Object.keys(dados)[indice] ?? null,
    getItem: (chave) => (chave in dados ? dados[chave] : null),
    setItem: (chave, valor) => {
      dados[chave] = String(valor);
    },
    removeItem: (chave) => {
      delete dados[chave];
    },
    clear: () => {
      dados = {};
    },
  };

  Object.defineProperty(globalThis, "localStorage", {
    value: fake,
    configurable: true,
    writable: true,
  });

  return {
    limpar: () => fake.clear(),
    // Para simular uma chave corrompida por fora da aplicação.
    escreverCru: (chave: string, valor: string) => fake.setItem(chave, valor),
  };
}
