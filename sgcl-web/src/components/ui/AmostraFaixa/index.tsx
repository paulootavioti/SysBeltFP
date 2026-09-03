import { resolverCorFaixa } from "../../../shared/constants/coresFaixa";
import "./styles.css";

interface AmostraFaixaProps {
  cor?: string | null;
  graduacao: string;
  compacta?: boolean;
}

export function AmostraFaixa({ cor, graduacao, compacta = false }: AmostraFaixaProps) {
  const corSegura = resolverCorFaixa(cor);
  return <span className={`amostra-faixa${compacta ? " amostra-faixa-compacta" : ""}`} aria-label={`Graduação ${graduacao}`} role="img" style={corSegura ? { backgroundColor: corSegura } : undefined} />;
}
