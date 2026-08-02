import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Loading } from "../../../../components/ui/Loading";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Badge } from "../../../../components/ui/Badge";

import { MensagemFamiliaService } from "../../services/MensagemFamiliaService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { ConversaFamiliaResumo } from "../../types";

import "./styles.css";

export function MensagensFamiliaListar() {
  const navigate = useNavigate();
  const [conversas, setConversas] = useState<ConversaFamiliaResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    MensagemFamiliaService.listarConversas()
      .then(setConversas)
      .catch((error) => setErro(getApiErrorMessage(error, "Não foi possível carregar as conversas.")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <PageHeader
        title="Mensagens da Família"
        subtitle="Conversas com responsáveis e alunos, ordenadas pela mais recente."
      />

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : conversas.length === 0 ? (
        <EmptyState
          title="Nenhuma conversa ainda"
          description="Mensagens trocadas com a família aparecem aqui."
        />
      ) : (
        <div className="mensagens-familia-listar-lista">
          {conversas.map((conversa) => (
            <button
              key={conversa.aluno.id}
              type="button"
              className="mensagens-familia-listar-item"
              onClick={() => navigate(`/alunos/${conversa.aluno.id}?tab=mensagens`)}
            >
              <div className="mensagens-familia-listar-item-topo">
                <strong>{conversa.aluno.apelido || conversa.aluno.nome}</strong>
                <span className="mensagens-familia-listar-item-data">
                  {new Date(conversa.ultimaMensagemEm).toLocaleString("pt-BR")}
                </span>
              </div>

              <p className="mensagens-familia-listar-item-preview">
                {conversa.ultimoRemetenteTipo === "ACADEMIA" ? "Você: " : ""}
                {conversa.ultimaMensagem}
              </p>

              {conversa.naoLidas > 0 && (
                <Badge variant="info">
                  {conversa.naoLidas} {conversa.naoLidas === 1 ? "mensagem nova" : "mensagens novas"}
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}
    </Layout>
  );
}
