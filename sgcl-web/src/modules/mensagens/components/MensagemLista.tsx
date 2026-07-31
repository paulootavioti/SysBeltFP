import { useEffect, useState } from "react";

import { Loading } from "../../../components/ui/Loading";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Button } from "../../../components/ui/Button";

import { linkWhatsapp } from "../../../shared/utils/linkWhatsapp";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import { useToast } from "../../../contexts/toast/useToast";

import type { MensagemGerada } from "../types/mensagem";

import "./MensagemLista.css";

interface MensagemListaProps {
  carregar: () => Promise<MensagemGerada[]>;
  tituloVazio: string;
  descricaoVazio: string;
}

export function MensagemLista({ carregar, tituloVazio, descricaoVazio }: MensagemListaProps) {
  const toast = useToast();
  const [mensagens, setMensagens] = useState<MensagemGerada[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function buscar() {
    try {
      setLoading(true);
      setErro("");
      const data = await carregar();
      setMensagens(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar mensagens."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copiarTexto(mensagem: string) {
    try {
      await navigator.clipboard.writeText(mensagem);
      toast.success("Mensagem copiada.");
    } catch {
      toast.error("Não foi possível copiar a mensagem.");
    }
  }

  if (loading) return <Loading />;

  if (erro) return <ErrorMessage message={erro} onRetry={buscar} />;

  if (mensagens.length === 0) {
    return <EmptyState title={tituloVazio} description={descricaoVazio} />;
  }

  return (
    <div className="mensagem-lista">
      {mensagens.map((item, index) => {
        const link = linkWhatsapp(item.telefone, item.mensagem);

        return (
          <div key={`${item.alunoId}-${index}`} className="mensagem-card">
            <div className="mensagem-card-cabecalho">
              <strong>{item.nomeDestinatario}</strong>
              <span className="mensagem-card-tag">
                {item.destinatario === "RESPONSAVEL"
                  ? `Responsável de ${item.apelido || item.nome}`
                  : "Aluno"}
              </span>
            </div>

            <p className="mensagem-card-texto">{item.mensagem}</p>

            <div className="mensagem-card-acoes">
              {link ? (
                <Button type="button" onClick={() => window.open(link, "_blank")}>
                  Abrir no WhatsApp
                </Button>
              ) : (
                <span className="mensagem-card-sem-telefone">Sem telefone cadastrado</span>
              )}

              <Button type="button" variant="secondary" onClick={() => copiarTexto(item.mensagem)}>
                Copiar texto
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
