import { useState } from "react";

import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/Textarea";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";

import { useAuth } from "../../../contexts/useAuth";
import { useToast } from "../../../contexts/toast/useToast";
import { SuporteService } from "../services/SuporteService";

import "./FalarComSuporteModal.css";

interface FalarComSuporteModalProps {
  open: boolean;
  onClose: () => void;
}

export function FalarComSuporteModal({ open, onClose }: FalarComSuporteModalProps) {
  const { usuario } = useAuth();
  const toast = useToast();

  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);

  function fechar() {
    setMensagem("");
    setErro("");
    setEnviado(false);
    onClose();
  }

  async function handleEnviar() {
    if (!usuario) return;

    if (!mensagem.trim()) {
      setErro("Escreva sua mensagem antes de enviar.");
      return;
    }

    try {
      setEnviando(true);
      setErro("");
      await SuporteService.enviar(usuario, mensagem.trim());
      setEnviado(true);
      toast.success("Mensagem registrada. Nossa equipe vai te retornar em breve.");
    } catch {
      setErro("Não foi possível registrar sua mensagem agora. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal open={open} title="Falar com o suporte" onClose={fechar}>
      {enviado ? (
        <div className="suporte-modal-confirmacao">
          <p>Sua mensagem foi registrada com sucesso.</p>
          <p className="suporte-modal-confirmacao-nota">
            Ainda não temos um canal automático de resposta — nossa equipe vai te procurar assim que possível.
          </p>
          <Button type="button" onClick={fechar}>
            Fechar
          </Button>
        </div>
      ) : (
        <>
          <Textarea
            label="Como podemos ajudar?"
            placeholder="Descreva sua dúvida ou o problema que você encontrou..."
            rows={5}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />

          <ErrorMessage message={erro} />

          <Button type="button" disabled={enviando} onClick={handleEnviar}>
            {enviando ? "Enviando..." : "Enviar"}
          </Button>
        </>
      )}
    </Modal>
  );
}
