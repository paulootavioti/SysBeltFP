import { useState } from "react";

import { Modal } from "../../../components/ui/Modal";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";

import { ResponsavelService } from "../services/ResponsavelService";
import { useToast } from "../../../contexts/toast/useToast";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import type { Responsavel } from "../types/responsavel";

interface DefinirSenhaPortalModalProps {
  responsavel: Responsavel | null;
  onClose: () => void;
}

export function DefinirSenhaPortalModal({ responsavel, onClose }: DefinirSenhaPortalModalProps) {
  const toast = useToast();
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  function fechar() {
    setSenha("");
    setErro("");
    onClose();
  }

  async function handleSubmit() {
    if (!responsavel) return;

    try {
      setSalvando(true);
      setErro("");
      await ResponsavelService.definirSenhaPortal(responsavel.id, senha);
      toast.success(`Senha do portal definida para ${responsavel.nome}.`);
      fechar();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao definir a senha do portal."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal open={responsavel !== null} title="Senha do Portal da Família" onClose={fechar}>
      <p>
        Defina a senha de acesso de <strong>{responsavel?.nome}</strong> ao Portal da Família. Compartilhe a senha
        diretamente com o responsável — não há e-mail automático nesta primeira versão.
      </p>

      <Input
        label="Nova senha"
        type="password"
        placeholder="Mínimo 6 caracteres"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        autoComplete="new-password"
      />

      <ErrorMessage message={erro} />

      <Button type="button" disabled={salvando || senha.length < 6} onClick={handleSubmit}>
        {salvando ? "Salvando..." : "Salvar senha"}
      </Button>
    </Modal>
  );
}
