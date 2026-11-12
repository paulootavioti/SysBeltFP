export interface DadosDaVersao {
  app: string;
  sha: string;
  builtAt: string;
}

export function dadosDaVersao(app: string, env?: Record<string, string | undefined>): DadosDaVersao;

export function versaoPlugin(app: string): {
  name: string;
  apply: "build";
  config(): { define: Record<string, string> };
  generateBundle(this: { emitFile(arquivo: { type: "asset"; fileName: string; source: string }): string }): void;
};
