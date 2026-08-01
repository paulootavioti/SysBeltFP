import { useEffect, useState } from "react";

import { Loading } from "../../../components/ui/Loading";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Badge } from "../../../components/ui/Badge";

import { PortalService } from "../services/PortalService";
import { getApiErrorMessage } from "../../../utils/getApiErrorMessage";
import type { Agenda } from "../types";

interface AgendaTabProps {
  alunoId: number;
}

export function AgendaTab({ alunoId }: AgendaTabProps) {
  const [itens, setItens] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    PortalService.agenda(alunoId)
      .then(setItens)
      .catch((error) => setErro(getApiErrorMessage(error, "Não foi possível carregar a agenda.")))
      .finally(() => setLoading(false));
  }, [alunoId]);

  if (loading) return <Loading />;
  if (erro) return <ErrorMessage message={erro} />;

  if (itens.length === 0) {
    return <EmptyState title="Nada agendado" description="Não há aulas ou eventos futuros no momento." />;
  }

  return (
    <div className="agenda-tab-lista">
      {itens.map((item, indice) => (
        <div key={`${item.tipo}-${indice}`} className="agenda-tab-item">
          <span className="agenda-tab-data">
            {new Date(item.data).toLocaleDateString("pt-BR")}
          </span>

          <div>
            <strong>{item.titulo}</strong>
            {item.descricao && <span>{item.descricao}</span>}
            {item.local && <span> · {item.local}</span>}
          </div>

          <Badge variant={item.tipo === "AULA" ? "info" : "neutral"}>
            {item.tipo === "AULA" ? "Aula" : "Evento"}
          </Badge>
        </div>
      ))}
    </div>
  );
}
