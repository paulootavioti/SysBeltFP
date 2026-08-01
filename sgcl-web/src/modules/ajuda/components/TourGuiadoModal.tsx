import { useState } from "react";

import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";

import { PASSOS_TOUR } from "../data/tour";

import "./TourGuiadoModal.css";

interface TourGuiadoModalProps {
  open: boolean;
  onClose: () => void;
}

export function TourGuiadoModal({ open, onClose }: TourGuiadoModalProps) {
  const [passoAtual, setPassoAtual] = useState(0);

  const ultimoPasso = passoAtual === PASSOS_TOUR.length - 1;
  const passo = PASSOS_TOUR[passoAtual];

  function fechar() {
    setPassoAtual(0);
    onClose();
  }

  function proximo() {
    if (ultimoPasso) {
      fechar();
      return;
    }
    setPassoAtual((atual) => atual + 1);
  }

  function voltar() {
    setPassoAtual((atual) => Math.max(0, atual - 1));
  }

  return (
    <Modal open={open} title="Tour guiado" onClose={fechar}>
      <div className="tour-guiado">
        <div className="tour-guiado-progresso">
          {PASSOS_TOUR.map((_, indice) => (
            <span
              key={indice}
              className={`tour-guiado-ponto${indice === passoAtual ? " tour-guiado-ponto-ativo" : ""}`}
            />
          ))}
        </div>

        <h3>{passo.titulo}</h3>
        <p>{passo.texto}</p>

        <div className="tour-guiado-acoes">
          <Button type="button" variant="secondary" onClick={fechar}>
            Pular
          </Button>

          <div className="tour-guiado-navegacao">
            {passoAtual > 0 && (
              <Button type="button" variant="secondary" onClick={voltar}>
                Voltar
              </Button>
            )}

            <Button type="button" onClick={proximo}>
              {ultimoPasso ? "Concluir" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
