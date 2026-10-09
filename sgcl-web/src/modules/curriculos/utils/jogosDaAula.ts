export function jogosDaAula(jogosSugeridos?: string | null): string[] {
  if (!jogosSugeridos?.trim()) return [];

  const separador = jogosSugeridos.includes("\n") ? /[\n,]/ : /,/;
  const vistos = new Set<string>();

  return jogosSugeridos
    .split(separador)
    .map((jogo) => jogo.trim())
    .filter((jogo) => {
      const chave = jogo.toLocaleLowerCase("pt-BR");
      if (!jogo || vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
}
