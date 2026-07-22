import { useEffect, useState } from "react";
import { LuBell } from "react-icons/lu";

import { Modal } from "../Modal";
import { Checkbox } from "../Checkbox";
import { Button } from "../Button";
import { AvisoService, type Aviso } from "../../../shared/services/AvisoService";

import "./styles.css";

export function NotificationBell() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [aberto, setAberto] = useState(false);
  const [ciente, setCiente] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  async function carregar() {
    try {
      const resumo = await AvisoService.listar();
      setAvisos(resumo.avisos);
    } catch {
      // silencioso: o sino apenas não exibe avisos se a busca falhar
    }
  }

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, 60000);
    return () => clearInterval(intervalo);
  }, []);

  function abrir() {
    setCiente(false);
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
  }

  async function confirmar() {
    try {
      setConfirmando(true);
      await AvisoService.reconhecer(
        avisos.map((aviso) => ({ tipo: aviso.tipo, referenciaId: aviso.referenciaId }))
      );
      setAvisos([]);
      setAberto(false);
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`notification-bell${avisos.length > 0 ? " notification-bell-ativa" : ""}`}
        onClick={abrir}
        aria-label="Avisos"
      >
        <LuBell size={20} />
        {avisos.length > 0 && (
          <span className="notification-bell-badge">{avisos.length}</span>
        )}
      </button>

      <Modal open={aberto} title="Avisos" onClose={fechar}>
        {avisos.length === 0 ? (
          <p className="notification-bell-vazio">Nenhum aviso pendente.</p>
        ) : (
          <>
            <ul className="notification-bell-lista">
              {avisos.map((aviso) => (
                <li key={`${aviso.tipo}:${aviso.referenciaId}`} className="notification-bell-item">
                  <strong>{aviso.titulo}</strong>
                  <span>{aviso.descricao}</span>
                </li>
              ))}
            </ul>

            <div className="notification-bell-rodape">
              <Checkbox
                label="Estou ciente destes avisos"
                checked={ciente}
                onChange={(evento) => setCiente(evento.target.checked)}
              />

              <Button type="button" disabled={!ciente || confirmando} onClick={confirmar}>
                Confirmar
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
