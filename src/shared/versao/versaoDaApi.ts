// Commit de onde saiu a API em execução. O build do Netlify sobrescreve
// versaoBuild.json (ver netlify.toml) antes de empacotar a function, e o
// esbuild embute o JSON no bundle: a informação não depende de variável de
// ambiente em tempo de execução, que o Netlify não repassa às functions.
// Fora do Netlify, o arquivo versionado diz "desenvolvimento".
import versaoBuild from "./versaoBuild.json";

export interface VersaoDaApi {
  sha: string;
  builtAt: string | null;
}

export function versaoDaApi(): VersaoDaApi {
  return { sha: versaoBuild.sha, builtAt: versaoBuild.builtAt };
}
