import { useState } from "react";

import { Modal } from "../../../components/ui/Modal";
import { Select } from "../../../components/ui/Select";
import { ImageUpload } from "../../../components/ui/ImageUpload";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { TIPO_ASSINATURA_LABEL, type TipoAssinaturaContrato } from "../types";

interface AssinarModalProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (tipoAssinatura: TipoAssinaturaContrato, contratoAssinadoUrl?: string) => void;
}

export function AssinarModal({ open, loading = false, onClose, onConfirm }: AssinarModalProps) {
  const [tipoAssinatura, setTipoAssinatura] = useState<TipoAssinaturaContrato | "">("");
  const [contratoAssinadoUrl, setContratoAssinadoUrl] = useState<string | undefined>();
  const [erro, setErro] = useState("");

  function handleConfirmar() {
    if (!tipoAssinatura) {
      setErro("Selecione o tipo de assinatura.");
      return;
    }

    setErro("");
    onConfirm(tipoAssinatura, contratoAssinadoUrl);
  }

  return (
    <Modal
      open={open}
      title="Registrar Assinatura"
      onClose={() => {
        setTipoAssinatura("");
        setContratoAssinadoUrl(undefined);
        setErro("");
        onClose();
      }}
    >
      <Select
        label="Tipo de Assinatura"
        value={tipoAssinatura}
        onChange={(e) => setTipoAssinatura(e.target.value as TipoAssinaturaContrato)}
        options={Object.entries(TIPO_ASSINATURA_LABEL).map(([value, label]) => ({ label, value }))}
      />
      <ImageUpload
        label="Contrato assinado (opcional)"
        prefixo="contratos"
        onChange={setContratoAssinadoUrl}
      />
      <ErrorMessage message={erro} />
      <Button type="button" disabled={loading} onClick={handleConfirmar}>
        {loading ? "Enviando..." : "Confirmar Assinatura"}
      </Button>
    </Modal>
  );
}
