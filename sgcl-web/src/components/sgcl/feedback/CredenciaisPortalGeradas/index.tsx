import { useState } from "react";

import { Modal } from "../../../ui/Modal";
import { Button } from "../../../ui/Button";

import "./styles.css";

export interface CredencialPortalGerada {
  papel: "Aluno" | "Responsável";
  nome: string;
  email: string;
  senha: string;
}

interface CredenciaisPortalGeradasModalProps {
  credenciais: CredencialPortalGerada[];
  onClose: () => void;
}

// exibida uma única vez, logo após o cadastro/edição gerar a senha do
// Portal da Família — depois disso só o hash fica salvo, então essa é a
// única chance do Admin ver (e copiar) a senha em texto puro.
export function CredenciaisPortalGeradasModal({
  credenciais,
  onClose,
}: CredenciaisPortalGeradasModalProps) {
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiar(credencial: CredencialPortalGerada) {
    const texto = `Login: ${credencial.email}\nSenha: ${credencial.senha}`;

    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(credencial.email);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      // clipboard indisponível (ex.: contexto não seguro) — admin copia à mão
    }
  }

  return (
    <Modal
      open={credenciais.length > 0}
      title="Acesso ao Portal da Família"
      onClose={onClose}
    >
      <p className="credenciais-portal-aviso">
        Senha gerada automaticamente. Compartilhe com a família por um canal seguro
        — esta é a única vez que ela aparece em texto, depois só é possível
        redefini-la.
      </p>

      {credenciais.map((credencial) => (
        <div className="credenciais-portal-item" key={`${credencial.papel}-${credencial.email}`}>
          <strong>
            {credencial.papel}: {credencial.nome}
          </strong>

          <div className="credenciais-portal-linha">
            <span>Login: {credencial.email}</span>
          </div>

          <div className="credenciais-portal-linha">
            <span>
              Senha: <code>{credencial.senha}</code>
            </span>
            <Button type="button" variant="secondary" size="sm" onClick={() => copiar(credencial)}>
              {copiado === credencial.email ? "Copiado!" : "Copiar"}
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" onClick={onClose}>
        Fechar
      </Button>
    </Modal>
  );
}
