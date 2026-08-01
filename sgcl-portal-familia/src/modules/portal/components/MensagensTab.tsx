import { useEffect, useState } from "react";

import { Loading } from "../../../components/ui/Loading";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Textarea } from "../../../components/ui/Textarea";
import { Button } from "../../../components/ui/Button";

import { PortalService } from "../services/PortalService";
import { getApiErrorMessage } from "../../../utils/getApiErrorMessage";
import type { Mensagem } from "../types";

interface MensagensTabProps {
  alunoId: number;
}

export function MensagensTab({ alunoId }: MensagensTabProps) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  function carregar() {
    PortalService.listarMensagens(alunoId)
      .then(setMensagens)
      .catch((error) => setErro(getApiErrorMessage(error, "Não foi possível carregar as mensagens.")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setLoading(true);
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alunoId]);

  async function handleEnviar() {
    if (!texto.trim()) return;

    try {
      setEnviando(true);
      setErro("");
      await PortalService.enviarMensagem(alunoId, texto.trim());
      setTexto("");
      carregar();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Não foi possível enviar a mensagem."));
    } finally {
      setEnviando(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="mensagens-tab">
      <ErrorMessage message={erro} />

      {mensagens.length === 0 ? (
        <EmptyState title="Nenhuma mensagem" description="Envie uma mensagem para a academia." />
      ) : (
        <div className="mensagens-tab-lista">
          {mensagens.map((mensagem) => (
            <div
              key={mensagem.id}
              className={`mensagens-tab-bolha${
                mensagem.remetenteTipo === "FAMILIA" ? " mensagens-tab-bolha-familia" : ""
              }`}
            >
              <strong>
                {mensagem.remetenteNome} · {new Date(mensagem.createdAt).toLocaleString("pt-BR")}
              </strong>
              <p>{mensagem.texto}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mensagens-tab-form">
        <Textarea
          label="Mensagem"
          placeholder="Escreva uma mensagem para a academia..."
          rows={2}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />

        <Button type="button" disabled={enviando || !texto.trim()} onClick={handleEnviar}>
          {enviando ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  );
}
