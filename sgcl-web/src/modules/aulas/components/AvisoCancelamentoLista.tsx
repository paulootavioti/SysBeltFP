import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";

import { linkWhatsapp } from "../../../shared/utils/linkWhatsapp";
import { useToast } from "../../../contexts/toast/useToast";

import type { MensagemGerada } from "../../mensagens/types/mensagem";

import "../../mensagens/components/MensagemLista.css";

interface AvisoCancelamentoListaProps {
  avisos: MensagemGerada[];
}

export function AvisoCancelamentoLista({ avisos }: AvisoCancelamentoListaProps) {
  const toast = useToast();

  async function copiarTexto(mensagem: string) {
    try {
      await navigator.clipboard.writeText(mensagem);
      toast.success("Mensagem copiada.");
    } catch {
      toast.error("Não foi possível copiar a mensagem.");
    }
  }

  if (avisos.length === 0) {
    return (
      <EmptyState
        title="Nenhum aviso a enviar"
        description="Não há alunos ativos vinculados a esta turma no momento."
      />
    );
  }

  return (
    <div className="mensagem-lista">
      {avisos.map((item, index) => {
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
                <Button type="button" size="sm" onClick={() => window.open(link, "_blank")}>
                  Abrir no WhatsApp
                </Button>
              ) : (
                <span className="mensagem-card-sem-telefone">Sem telefone cadastrado</span>
              )}

              <Button type="button" size="sm" variant="secondary" onClick={() => copiarTexto(item.mensagem)}>
                Copiar texto
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
