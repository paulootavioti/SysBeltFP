import { Button } from "../../../components/ui/Button";
import "./DashboardSectionError.css";

interface DashboardSectionErrorProps {
  mensagem: string;
  onTentarNovamente: () => void;
}

// Erro isolado de UMA seção — nunca substitui o dashboard inteiro (ver
// `useDashboard`: cada seção carrega e falha de forma independente).
export function DashboardSectionError({ mensagem, onTentarNovamente }: DashboardSectionErrorProps) {
  return (
    <div className="dashboard-secao-erro" role="alert">
      <p>{mensagem}</p>
      <Button type="button" variant="secondary" size="sm" onClick={onTentarNovamente}>
        Tentar novamente
      </Button>
    </div>
  );
}
