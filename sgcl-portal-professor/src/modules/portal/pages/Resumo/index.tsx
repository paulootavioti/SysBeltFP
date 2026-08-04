import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../../../components/ui/Button";
import type { ResumoAula } from "../../types";

import "./styles.css";

function corPorPercentual(percentual: number) {
  if (percentual >= 80) return "resumo-kpi-verde";
  if (percentual >= 60) return "resumo-kpi-ambar";
  return "resumo-kpi-vermelho";
}

export function Resumo() {
  const navigate = useNavigate();
  const location = useLocation();
  const resumo = location.state?.resumo as ResumoAula | undefined;

  if (!resumo) {
    return (
      <div className="resumo-page resumo-page-vazia">
        <p>Resumo não disponível — a aula já foi finalizada, mas você saiu desta tela.</p>
        <Button onClick={() => navigate("/home")}>Voltar para Home</Button>
      </div>
    );
  }

  const destinoFoto =
    resumo.fotos.length === 0
      ? "Nenhuma foto enviada"
      : resumo.fotos.some((foto) => foto.visivelNaLanding)
        ? "Galeria pública e Portal da Família"
        : "Só Portal da Família";

  return (
    <div className="resumo-page">
      <div className="resumo-topo">
        <span className="resumo-check" aria-hidden="true">
          ✓
        </span>
        <h1>Aula finalizada</h1>
        <p>
          {resumo.turmaNome} · {resumo.duracaoMinutos} min
        </p>
      </div>

      <div className="resumo-kpis">
        <div className={`resumo-kpi ${corPorPercentual(resumo.presenca.percentual)}`}>
          <strong>{resumo.presenca.percentual}%</strong>
          <span>Presença</span>
          <span className="resumo-kpi-detalhe">
            {resumo.presenca.presentes} de {resumo.presenca.total}
          </span>
        </div>

        <div className="resumo-kpi resumo-kpi-neutro">
          <strong>
            {resumo.tecnicas.executadas}/{resumo.tecnicas.planejadas}
          </strong>
          <span>Técnicas</span>
          <span className="resumo-kpi-detalhe">executadas</span>
        </div>
      </div>

      <div className="resumo-checklist">
        <div className="resumo-checklist-item">
          <span className={resumo.observacaoRegistrada ? "resumo-check-ok" : "resumo-check-pendente"}>
            {resumo.observacaoRegistrada ? "✓" : "–"}
          </span>
          <span>{resumo.observacaoRegistrada ? "Observação da turma registrada" : "Sem observação da turma"}</span>
        </div>

        <div className="resumo-checklist-item">
          <span className={resumo.alunosComNota > 0 ? "resumo-check-ok" : "resumo-check-pendente"}>
            {resumo.alunosComNota > 0 ? "✓" : "–"}
          </span>
          <span>
            {resumo.alunosComNota > 0
              ? `${resumo.alunosComNota} aluno${resumo.alunosComNota > 1 ? "s" : ""} com nota individual`
              : "Nenhuma nota individual"}
          </span>
        </div>

        <div className="resumo-checklist-item">
          <span className={resumo.fotos.length > 0 ? "resumo-check-ok" : "resumo-check-pendente"}>
            {resumo.fotos.length > 0 ? "✓" : "–"}
          </span>
          <span>{destinoFoto}</span>
        </div>
      </div>

      <Button className="resumo-botao" onClick={() => navigate("/home")}>
        Concluir
      </Button>
    </div>
  );
}
