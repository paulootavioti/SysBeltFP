import { useState } from "react";

import { Modal } from "../../../components/ui/Modal";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";

interface MotivoModalProps {
  open: boolean;
  title: string;
  label: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}

// Modal genérico pra ações que exigem justificativa — hoje usado em
// Cancelar/Estornar mensalidade.
export function MotivoModal({ open, title, label, loading = false, onClose, onConfirm }: MotivoModalProps) {
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");

  function handleConfirmar() {
    if (!motivo.trim()) {
      setErro("Informe o motivo.");
      return;
    }

    setErro("");
    onConfirm(motivo.trim());
  }

  return (
    <Modal
      open={open}
      title={title}
      onClose={() => {
        setMotivo("");
        setErro("");
        onClose();
      }}
    >
      <Textarea label={label} value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} />
      <ErrorMessage message={erro} />
      <Button type="button" disabled={loading} onClick={handleConfirmar}>
        {loading ? "Enviando..." : "Confirmar"}
      </Button>
    </Modal>
  );
}
