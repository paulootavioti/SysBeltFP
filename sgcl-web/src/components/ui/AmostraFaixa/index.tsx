import { resolverCorFaixa } from "../../../shared/constants/coresFaixa";
import "./styles.css";

interface AmostraFaixaProps {
  cor?: string | null;
  graduacao: string;
  tamanho?: "padrao" | "compacta";
}

export function AmostraFaixa({ cor, graduacao, tamanho = "padrao" }: AmostraFaixaProps) {
  const corSegura = resolverCorFaixa(cor);
  return <span className={`amostra-faixa${tamanho === "compacta" ? " amostra-faixa-compacta" : ""}`} aria-label={corSegura ? graduacao : "Sem graduação"} role="img" style={corSegura ? { backgroundColor: corSegura } : undefined} />;
}
