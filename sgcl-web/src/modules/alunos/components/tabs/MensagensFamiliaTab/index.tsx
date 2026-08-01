import { useEffect, useState } from "react";

import { Loading } from "../../../../../components/ui/Loading";
import { ErrorMessage } from "../../../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../../../components/ui/EmptyState";
import { Textarea } from "../../../../../components/ui/Textarea";
import { Button } from "../../../../../components/ui/Button";

import { MensagemFamiliaService } from "../../../../mensagensFamilia/services/MensagemFamiliaService";
import { getApiErrorMessage } from "../../../../../shared/utils/getApiErrorMessage";
import type { MensagemFamilia } from "../../../../mensagensFamilia/types";

import "./styles.css";

interface MensagensFamiliaTabProps {
  aluno: { id: number };
}

export function MensagensFamiliaTab({ aluno }: MensagensFamiliaTabProps) {
  const [mensagens, setMensagens] = useState<MensagemFamilia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  function carregar() {
    MensagemFamiliaService.listar(aluno.id)
      .then(setMensagens)
      .catch((error) => setErro(getApiErrorMessage(error, "Não foi possível carregar as mensagens.")))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    setLoading(true);
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aluno.id]);

  async function handleEnviar() {
    if (!texto.trim()) return;

    try {
      setEnviando(true);
      setErro("");
      await MensagemFamiliaService.enviar(aluno.id, texto.trim());
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
    <div className="mensagens-familia-tab">
      <ErrorMessage message={erro} />

      {mensagens.length === 0 ? (
        <EmptyState title="Nenhuma mensagem" description="Ainda não há conversa com a família deste aluno." />
      ) : (
        <div className="mensagens-familia-tab-lista">
          {mensagens.map((mensagem) => (
            <div
              key={mensagem.id}
              className={`mensagens-familia-tab-bolha${
                mensagem.remetenteTipo === "ACADEMIA" ? " mensagens-familia-tab-bolha-academia" : ""
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

      <div className="mensagens-familia-tab-form">
        <Textarea
          label="Responder"
          placeholder="Escreva uma mensagem para a família..."
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
