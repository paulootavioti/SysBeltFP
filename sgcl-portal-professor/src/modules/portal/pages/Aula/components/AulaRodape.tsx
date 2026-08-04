import { Button } from "../../../../../components/ui/Button";
import "./AulaRodape.css";

const ROTULOS_AVANCAR: Record<number, string> = {
  1: "Avançar para Plano",
  2: "Avançar para Notas",
  3: "Avançar para Foto",
};

interface AulaRodapeProps {
  etapaAtual: number;
  onVoltar: () => void;
  onAvancar: () => void;
  finalizando: boolean;
}

export function AulaRodape({ etapaAtual, onVoltar, onAvancar, finalizando }: AulaRodapeProps) {
  const ultimaEtapa = etapaAtual === 4;

  return (
    <footer className="aula-rodape">
      {etapaAtual > 1 && (
        <Button variant="secondary" onClick={onVoltar} disabled={finalizando}>
          Voltar
        </Button>
      )}

      <Button onClick={onAvancar} disabled={finalizando} className="aula-rodape-principal">
        {ultimaEtapa ? (finalizando ? "Finalizando..." : "Finalizar aula") : ROTULOS_AVANCAR[etapaAtual]}
      </Button>
    </footer>
  );
}
